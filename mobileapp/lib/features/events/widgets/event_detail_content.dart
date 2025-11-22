import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/ticket_type_model.dart';
import '../../../shared/services/event_service.dart';
import '../../../shared/widgets/floating_register_button.dart';
import '../../../shared/widgets/floating_analytics_button.dart';
import '../../../features/auth/bloc/auth_bloc.dart';
import '../../../features/payment/widgets/payment_modal_simple.dart';
import 'event_detail_header.dart';
import 'event_detail_info.dart';
import 'event_detail_tickets_tab.dart';

class EventDetailContent extends StatefulWidget {
  final String eventId;

  const EventDetailContent({
    super.key,
    required this.eventId,
  });

  @override
  State<EventDetailContent> createState() => _EventDetailContentState();
}

class _EventDetailContentState extends State<EventDetailContent>
    with TickerProviderStateMixin {
  EventModel? _event;
  String? _error;
  bool _isLoading = true;
  bool _isRegistering = false;
  bool _isRegistered = false;
  EventRegistration? _userRegistration;
  final EventService _eventService = EventService();
  TicketType? _selectedTicket;
  int _selectedTicketQuantity = 1;
  
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadEventDetails();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _tabController = TabController(length: 2, vsync: this);

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.easeOutCubic,
    ));

    _fadeController.forward();
    _slideController.forward();
  }

  Future<void> _loadEventDetails() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('🔍 Loading event details for ID: ${widget.eventId}');
      final response = await _eventService.getEventById(widget.eventId);
      print('🔍 Event details response: $response');
      
      if (response['success'] == true) {
        print('✅ Event data received: ${response['event']}');
        final event = response['event'] as EventModel;
        
        // Check if user is registered using the isRegistered field from backend
        bool isUserRegistered = event.isRegistered ?? false;
        EventRegistration? userRegistration;
        
        // If user is registered, get their registration data
        if (isUserRegistered && event.registrations != null && event.registrations!.isNotEmpty) {
          userRegistration = event.registrations!.first;
        }
        

        setState(() {
          _event = event;
          _isRegistered = isUserRegistered;
          _userRegistration = userRegistration;
          _isLoading = false;
        });
        print('✅ Event loaded successfully: ${_event?.title}');
        print('🔍 User registration status: $_isRegistered');
        print('🔍 Event.isRegistered from backend: ${event.isRegistered}');
        print('🔍 Registrations count: ${event.registrations?.length ?? 0}');
        print('🔍 User registration data: $userRegistration');
        print('🔍 Registration count from backend: ${event.registrationCount}');
        
      } else {
        print('❌ Event loading failed: ${response['message']}');
        setState(() {
          _error = response['message'] ?? 'Failed to load event details';
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Exception loading event details: $e');
      setState(() {
        _error = 'An error occurred while loading event details: $e';
        _isLoading = false;
      });
    }
  }



  Future<void> _handleRegistration() async {
    if (_event == null) return;
    
    setState(() {
      _isRegistering = true;
    });

    try {
      // For paid events with ticket types, always call register (not cancel)
      if (_event!.hasMultipleTicketTypes || !_event!.isFree) {
        await _handleRegisterForEvent();
      } else {
        // For free events, check registration status
        if (_isRegistered) {
          // Cancel registration
          await _handleCancelRegistration();
        } else {
          // Register for event
          await _handleRegisterForEvent();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Operation failed: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isRegistering = false;
        });
      }
    }
  }

  Future<void> _handleRegisterForEvent() async {
    print('🔍 Registering for event: ${_event!.id}');
    print('🔍 Event has ticket types: ${_event!.hasMultipleTicketTypes}');
    print('🔍 Event is free: ${_event!.isFree}');
    print('🔍 Selected ticket: ${_selectedTicket?.name}');
    print('🔍 Selected ticket ID: ${_selectedTicket?.id}');
    print('🔍 Selected quantity: $_selectedTicketQuantity');
    
    // For events with multiple ticket types, user MUST select a ticket type first
    if (_event!.hasMultipleTicketTypes && !_event!.isFree) {
      if (_selectedTicket == null) {
        // Show error message - user must select a ticket type first
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please select a ticket type first'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
    }
    
    // For events with selected ticket (regardless of hasMultipleTicketTypes flag)
    // OR for paid events with ticket types - go straight to payment
    if (_selectedTicket != null || (!_event!.hasMultipleTicketTypes && !_event!.isFree)) {
      print('🟡 PAID EVENT - Going straight to payment modal');
      print('🟡 Ticket: ${_selectedTicket?.name ?? "None"}, Price: ${_selectedTicket?.price ?? _event!.price}');
      print('🟡 Ticket Type ID: ${_selectedTicket?.id ?? "None"}');
      
      final amountToPay = _selectedTicket != null 
          ? (_selectedTicket!.price ?? 0) * _selectedTicketQuantity
          : (_event!.price ?? 0);
      
      final eventData = {
        'id': _event!.id,
        'title': _event!.title,
        'price': amountToPay,
      };
      
      await _showPaymentModal(eventData, amount: amountToPay);
      return; // STOP HERE - don't call registerForEvent API
    }
    
    // For FREE events or paid events without ticket types - call registration API first
    print('🟡 FREE EVENT or SINGLE PRICE - Calling registration API');
    
    // Check if event is private and ask for password
    String? privatePassword;
    if (_event!.isPrivate) {
      privatePassword = await _showPasswordDialog();
      if (privatePassword == null) {
        // User cancelled password input
        return;
      }
    }
    
    final response = await _eventService.registerForEvent(_event!.id, privatePassword: privatePassword);
    print('🔍 Registration response: $response');
    
    if (response['success'] == true) {
      // Check if payment is required
      if (response['data']?['requiresPayment'] == true) {
        if (mounted) {
          // Show payment modal
          double amountToPay = double.parse(response['data']['event']['price'].toString());
          await _showPaymentModal(response['data']['event'], amount: amountToPay);
        }
      } else {
        // Free event - direct registration successful
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully registered for ${_event!.title}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          
          // Update registration status and refresh event data
          setState(() {
            _isRegistered = true;
            _userRegistration = response['registration'] as EventRegistration?;
          });
          
          // Refresh event data to get updated registration count
          await _loadEventDetails();
        }
      }
    } else {
      if (mounted) {
        // Check if user is already registered
        if (response['message']?.contains('already registered') == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('You are already registered for this event'),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 3),
            ),
          );
          
          // Update status to registered
          setState(() {
            _isRegistered = true;
          });
          
          // Refresh event data to get correct status
          await _loadEventDetails();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Registration failed: ${response['message']}'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    }
  }

  Future<void> _handleCancelRegistration() async {
    print('🔍 Cancelling registration for event: ${_event!.id}');
    final response = await _eventService.cancelEventRegistration(_event!.id);
    print('🔍 Cancel registration response: $response');
    
    if (response['success'] == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration cancelled for ${_event!.title}'),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 3),
          ),
        );
        
        // Update registration status and refresh event data
        setState(() {
          _isRegistered = false;
          _userRegistration = null;
        });
        
        // Refresh event data to get updated registration count
        await _loadEventDetails();
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to cancel registration: ${response['message']}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<String?> _showPasswordDialog() async {
    final TextEditingController passwordController = TextEditingController();
    
    return await showDialog<String>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Private Event'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('This is a private event. Please enter the password to register:'),
              const SizedBox(height: 16),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(passwordController.text),
              child: const Text('Submit'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showPaymentModal(Map<String, dynamic> eventData, {double? amount}) async {
    final displayAmount = amount ?? double.parse(eventData['price'].toString());
    
    // Log ticket type information before showing payment modal
    print('💰 SHOW PAYMENT MODAL:');
    print('💰 Event ID: ${eventData['id']}');
    print('💰 Amount: $displayAmount');
    print('💰 Selected Ticket: ${_selectedTicket?.name}');
    print('💰 Selected Ticket ID: ${_selectedTicket?.id}');
    print('💰 Selected Quantity: $_selectedTicketQuantity');
    
    // Verify ticket type is selected for events with multiple ticket types
    if (_event!.hasMultipleTicketTypes && _selectedTicket == null) {
      print('❌ ERROR: Ticket type not selected for event with multiple ticket types!');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select a ticket type first'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }
    
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PaymentModalSimple(
        eventId: eventData['id'],
        eventTitle: eventData['title'],
        amount: displayAmount,
        quantity: _selectedTicket != null ? _selectedTicketQuantity : null,
        ticketTypeId: _selectedTicket?.id, // This MUST be set for events with multiple ticket types
        onPaymentSuccess: () async {
          print('🟢 Payment success callback triggered!');
          // IMPORTANT: Reset registration state before refresh
          setState(() {
            _isRegistered = false;
            _userRegistration = null;
          });
          // Refresh event data after successful payment
          await _loadEventDetails();
          print('🟢 Event details refreshed after payment');
          print('🟢 Current _isRegistered: $_isRegistered');
        },
      ),
    );
    // Also refresh after modal closes
    print('🟢 Payment modal closed, refreshing event details...');
    await _loadEventDetails();
    print('🟢 Final _isRegistered: $_isRegistered');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildLoadingState();
    }

    if (_error != null) {
      return _buildErrorState(_error!);
    }

    if (_event == null) {
      return _buildErrorState('Event not found');
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Stack(
          children: [
            _event!.hasMultipleTicketTypes
                ? Column(
                    children: [
                      // Header with Image Carousel (Fixed height)
                      SizedBox(
                        height: 300,
                        child: Stack(
                          children: [
                            // Use PageView instead of CustomScrollView for fixed height
                            if (_event!.galleryUrls.isNotEmpty)
                              PageView.builder(
                                itemCount: _event!.galleryUrls.length,
                                itemBuilder: (context, index) {
                                  return CachedNetworkImage(
                                    imageUrl: _event!.galleryUrls[index],
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    height: double.infinity,
                                    placeholder: (context, url) => Container(
                                      color: Colors.grey[300],
                                      child: const Center(child: CircularProgressIndicator()),
                                    ),
                                    errorWidget: (context, url, error) => Container(
                                      color: Colors.grey[300],
                                      child: const Icon(Icons.image, size: 64),
                                    ),
                                  );
                                },
                              )
                            else if (_event!.thumbnailUrl != null && _event!.thumbnailUrl!.isNotEmpty)
                              CachedNetworkImage(
                                imageUrl: _event!.thumbnailUrl!,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                                placeholder: (context, url) => Container(
                                  color: Colors.grey[300],
                                  child: const Center(child: CircularProgressIndicator()),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  color: Colors.grey[300],
                                  child: const Icon(Icons.broken_image, size: 64, color: Colors.grey),
                                ),
                              )
                            else
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [Colors.blue.shade400, Colors.blue.shade600],
                                  ),
                                ),
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.event_available, size: 80, color: Colors.white.withOpacity(0.9)),
                                      const SizedBox(height: 16),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 20),
                                        child: Text(
                                          _event!.title,
                                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                                          textAlign: TextAlign.center,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      
                      // Modern Tab Bar (Compact)
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: TabBar(
                          controller: _tabController,
                          indicator: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          labelColor: const Color(0xFF2563EB),
                          unselectedLabelColor: Colors.grey[600],
                          labelStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          unselectedLabelStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          indicatorSize: TabBarIndicatorSize.tab,
                          dividerColor: Colors.transparent,
                          splashFactory: NoSplash.splashFactory,
                          overlayColor: WidgetStateProperty.all(Colors.transparent),
                          tabs: const [
                            Tab(
                              height: 38,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.info_outline, size: 16),
                                  SizedBox(width: 5),
                                  Text('Details'),
                                ],
                              ),
                            ),
                            Tab(
                              height: 38,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.confirmation_number_outlined, size: 16),
                                  SizedBox(width: 5),
                                  Text('Tickets'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Tab Content
                      Expanded(
                        child: TabBarView(
                          controller: _tabController,
                          children: [
                            // Details Tab
                            SingleChildScrollView(
                              physics: const ClampingScrollPhysics(),
                              child: Column(
                                children: [
                                  EventDetailInfo(event: _event!, useSliver: false),
                                  const SizedBox(height: 100),
                                ],
                              ),
                            ),
                            // Tickets Tab
                            EventDetailTicketsTab(
                              event: _event!,
                              onTicketSelected: (ticket, qty) {
                                setState(() {
                                  _selectedTicket = ticket;
                                  _selectedTicketQuantity = qty;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : CustomScrollView(
                    physics: const ClampingScrollPhysics(),
                    slivers: [
                      // Header with Image Carousel
                      EventDetailHeader(event: _event!),
                      
                      // Event Information (already wrapped in SliverToBoxAdapter)
                      EventDetailInfo(event: _event!),
                      
                      // Bottom spacing for floating button
                      const SliverToBoxAdapter(
                        child: SizedBox(height: 100),
                      ),
                    ],
                  ),
            // Floating Button - Register or Analytics for Owner
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                if (authState is AuthAuthenticated && authState.user.id == _event!.createdBy) {
                  // Owner of the event - show Analytics button
                  return FloatingAnalyticsButton(
                    event: _event!,
                    onPressed: () => context.go('/analytics/event/${_event!.id}?title=${Uri.encodeComponent(_event!.title)}'),
                  );
                } else {
                  // Regular user - show Register button (only if not using multiple ticket types)
                  // If using multiple ticket types, registration happens through ticket selection
                  if (!_event!.hasMultipleTicketTypes) {
                    return FloatingRegisterButton(
                      event: _event!,
                      isLoading: _isRegistering,
                      isRegistered: _isRegistered,
                      userRegistration: _userRegistration,
                      isAuthenticated: authState is AuthAuthenticated,
                      onPressed: _handleRegistration,
                    );
                  } else {
                    // Show ticket-based register button
                    return _buildTicketRegisterButton(authState is AuthAuthenticated);
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketRegisterButton(bool isAuthenticated) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_selectedTicket != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(_selectedTicket!.iconData, 
                        color: _selectedTicket!.colorValue, 
                        size: 20
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedTicket!.name,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              _selectedTicket!.formattedPrice,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              ElevatedButton(
                onPressed: _selectedTicket != null && isAuthenticated
                    ? _handleRegistration
                    : (_selectedTicket == null 
                        ? null 
                        : () => context.go('/login')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: _isRegistering
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _selectedTicket == null
                            ? 'Select a Ticket'
                            : (isAuthenticated 
                                ? 'Register with ${_selectedTicket!.name}' 
                                : 'Login to Register'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Loading event details...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load event',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadEventDetails,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
