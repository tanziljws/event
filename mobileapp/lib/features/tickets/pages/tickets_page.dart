import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/bottom_navigation.dart';
import '../../../core/constants/app_constants.dart';
import '../bloc/tickets_bloc.dart';
import '../models/ticket.dart';
import '../widgets/ticket_card.dart';
import '../widgets/ticket_filter_bottom_sheet.dart';
import '../widgets/qr_code_modal.dart';

class TicketsPage extends StatefulWidget {
  final Map<String, dynamic>? extra;
  
  const TicketsPage({super.key, this.extra});

  @override
  State<TicketsPage> createState() => _TicketsPageState();
}

class _TicketsPageState extends State<TicketsPage> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  String? _selectedStatus;
  String? _searchQuery;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadTickets();
    
    // Check if we need to show modal for specific registration
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.extra != null && widget.extra!['showModalForRegistrationId'] != null) {
        _showModalForRegistration(widget.extra!['showModalForRegistrationId']);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      context.read<TicketsBloc>().add(const LoadMoreTickets());
    }
  }

  void _loadTickets() {
    context.read<TicketsBloc>().add(LoadTickets(
      status: _selectedStatus,
      search: _searchQuery,
    ));
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query.isEmpty ? null : query;
    });
    _loadTickets();
  }

  void _onStatusFilterChanged(String? status) {
    setState(() {
      _selectedStatus = status;
    });
    _loadTickets();
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TicketFilterBottomSheet(
        selectedStatus: _selectedStatus,
        onStatusChanged: _onStatusFilterChanged,
      ),
    );
  }

  void _showQRCodeModal(Ticket ticket) {
    showDialog(
      context: context,
      builder: (context) => QRCodeModal(ticket: ticket),
    );
  }

  void _showModalForRegistration(String registrationId) {
    // Find the ticket with the matching registration ID
    final ticketsBloc = context.read<TicketsBloc>();
    if (ticketsBloc.state is TicketsLoaded) {
      final tickets = (ticketsBloc.state as TicketsLoaded).tickets;
      try {
        final matchingTicket = tickets.firstWhere(
          (ticket) => ticket.id == registrationId,
        );
        
        // Show the QR code modal for this ticket
        _showQRCodeModal(matchingTicket);
      } catch (e) {
        // Ticket not found, show error message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tiket tidak ditemukan'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else {
      // Tickets not loaded yet, wait a bit and try again
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _showModalForRegistration(registrationId);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Column(
        children: [
          // Custom Header with Search Bar
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              left: 20,
              right: 20,
              bottom: 8,
            ),
            child: Row(
              children: [
                // Back button
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    onPressed: () {
                      if (Navigator.of(context).canPop()) {
                        Navigator.of(context).pop();
                      } else {
                        context.go('/home');
                      }
                    },
                    icon: const Icon(Icons.arrow_back_ios_new),
                    iconSize: 20,
                    color: Colors.black87,
                  ),
                ),
                
                const SizedBox(width: 12),
                
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        hintText: 'Search tickets...',
                        hintStyle: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                        prefixIcon: Container(
                          padding: const EdgeInsets.all(12),
                          child: Icon(
                            Icons.search_rounded,
                            color: Colors.grey[600],
                            size: 20,
                          ),
                        ),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? Container(
                                padding: const EdgeInsets.all(12),
                                child: GestureDetector(
                                  onTap: () {
                                    _searchController.clear();
                                    _onSearchChanged('');
                                  },
                                  child: Icon(
                                    Icons.clear_rounded,
                                    color: Colors.grey[600],
                                    size: 20,
                                  ),
                                ),
                              )
                            : Container(
                                padding: const EdgeInsets.all(12),
                                child: Icon(
                                  Icons.tune_rounded,
                                  color: Colors.grey[600],
                                  size: 20,
                                ),
                              ),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide(
                            color: Colors.grey[200]!,
                            width: 1,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide(
                            color: Colors.grey[200]!,
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: const BorderSide(
                            color: Color(0xFF2563EB),
                            width: 2,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.filter_list, color: Colors.grey),
                    onPressed: _showFilterBottomSheet,
                  ),
                ),
              ],
            ),
          ),
          // Status Filter Chips
          if (_selectedStatus != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF2563EB).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _getStatusDisplayName(_selectedStatus!),
                          style: const TextStyle(
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => _onStatusFilterChanged(null),
                          child: const Icon(
                            Icons.close,
                            size: 16,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          // Tickets List
          Expanded(
            child: BlocBuilder<TicketsBloc, TicketsState>(
              builder: (context, state) {
                if (state is TicketsLoading) {
                  return const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF2563EB),
                    ),
                  );
                } else if (state is TicketsError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: const Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            'Failed to load tickets',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            state.message,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF64748B),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: _loadTickets,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Try Again'),
                          ),
                        ],
                      ),
                    ),
                  );
                } else if (state is TicketsLoaded) {
                  if (state.tickets.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0F9FF),
                                borderRadius: BorderRadius.circular(50),
                              ),
                              child: const Icon(
                                Icons.confirmation_number_outlined,
                                size: 48,
                                color: Color(0xFF2563EB),
                              ),
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              'No tickets found',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'You haven\'t registered for any events yet.\nStart exploring events to get your first ticket!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Color(0xFF64748B),
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),
                            ElevatedButton.icon(
                              onPressed: () => context.go('/events'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2563EB),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.explore, size: 20),
                              label: const Text('Browse Events'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<TicketsBloc>().add(const RefreshTickets());
                    },
                    color: const Color(0xFF2563EB),
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: state.tickets.length + (state.isLoadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index >= state.tickets.length) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(
                              child: CircularProgressIndicator(
                                color: Color(0xFF2563EB),
                              ),
                            ),
                          );
                        }

                        final ticket = state.tickets[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: TicketCard(
                            ticket: ticket,
                            onTap: () => _showQRCodeModal(ticket),
                            onDownload: () {
                              context.read<TicketsBloc>().add(
                                DownloadTicket(ticket.id),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  );
                }

                return const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF2563EB),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: const BottomNavigation(currentIndex: 3),
    );
  }

  String _getStatusDisplayName(String status) {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Active';
      case 'USED':
        return 'Used';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
