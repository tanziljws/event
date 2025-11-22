import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/organizer_bloc.dart';
import '../models/event_form_data.dart';
import '../widgets/location_picker.dart';
import '../widgets/image_picker_widget.dart';
import '../widgets/custom_ticket_builder.dart';
import '../../../shared/models/ticket_type_model.dart';

class CreateEventPage extends StatefulWidget {
  const CreateEventPage({super.key});

  @override
  State<CreateEventPage> createState() => _CreateEventPageState();
}

class _CreateEventPageState extends State<CreateEventPage> with AutomaticKeepAliveClientMixin {
  final PageController _pageController = PageController();
  final EventFormData _formData = EventFormData();
  int _currentStep = 0;
  final List<String> _steps = ['Basic Info', 'Details', 'Media', 'Ticketing', 'Settings'];
  
  // Debounce timer untuk setState
  Timer? _debounceTimer;
  
  // Multi-day event state
  bool _isMultiDayEvent = false;
  
  // Validation errors
  final Map<String, String?> _fieldErrors = {};
  
  // TextEditingControllers untuk setiap field
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _eventDateController = TextEditingController();
  final TextEditingController _eventEndDateController = TextEditingController();
  final TextEditingController _eventTimeController = TextEditingController();
  final TextEditingController _eventEndTimeController = TextEditingController();
  final TextEditingController _maxParticipantsController = TextEditingController();
  final TextEditingController _registrationDeadlineController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _privatePasswordController = TextEditingController();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    
    // Initialize controllers with form data
    _titleController.text = _formData.title;
    _descriptionController.text = _formData.description;
    _eventDateController.text = _formData.eventDate;
    _eventEndDateController.text = _formData.eventEndDate ?? '';
    _eventTimeController.text = _formData.eventTime;
    _eventEndTimeController.text = _formData.eventEndTime ?? '';
    _maxParticipantsController.text = _formData.maxParticipants.toString();
    _registrationDeadlineController.text = _formData.registrationDeadline;
    _priceController.text = _formData.price.toString();
    _privatePasswordController.text = _formData.privatePassword;
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _pageController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _eventDateController.dispose();
    _eventEndDateController.dispose();
    _eventTimeController.dispose();
    _eventEndTimeController.dispose();
    _maxParticipantsController.dispose();
    _registrationDeadlineController.dispose();
    _priceController.dispose();
    _privatePasswordController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < _steps.length - 1) {
      setState(() {
        _currentStep++;
      });
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToStep(int step) {
    setState(() {
      _currentStep = step;
    });
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _createEvent() {
    // Clear previous errors
    _fieldErrors.clear();
    
    // Validate all required fields
    bool hasErrors = false;
    
    // Validate title
    if (_formData.title.trim().isEmpty) {
      _fieldErrors['title'] = 'Event title is required';
      hasErrors = true;
    } else if (_formData.title.trim().length < 5) {
      _fieldErrors['title'] = 'Event title must be at least 5 characters';
      hasErrors = true;
    } else if (_formData.title.trim().length > 200) {
      _fieldErrors['title'] = 'Event title must be less than 200 characters';
      hasErrors = true;
    }
    
    // Validate description
    if (_formData.description.trim().isEmpty) {
      _fieldErrors['description'] = 'Description is required';
      hasErrors = true;
    } else if (_formData.description.trim().length > 2000) {
      _fieldErrors['description'] = 'Description must be less than 2000 characters';
      hasErrors = true;
    }
    
    // Validate maxParticipants
    if (_formData.maxParticipants < 1) {
      _fieldErrors['maxParticipants'] = 'Max participants must be at least 1';
      hasErrors = true;
    }
    
    // If there are errors, show them and go to first step with error
    if (hasErrors) {
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fix the errors in the form'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      _goToStep(0); // Go to Basic Info
      return;
    }
    
    // Check specific validation failures
    if (!_formData.isBasicInfoValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete Basic Info section'),
          backgroundColor: Colors.red,
        ),
      );
      _goToStep(0); // Go to Basic Info
      return;
    }
    
    if (!_formData.isDetailsValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete Details section'),
          backgroundColor: Colors.red,
        ),
      );
      _goToStep(1); // Go to Details
      return;
    }
    
    if (!_formData.isSettingsValid) {
      // Check if it's ticket validation issue
      if (_formData.hasMultipleTicketTypes && _formData.ticketTypes.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please add at least one ticket type in Ticketing section'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 4),
          ),
        );
        _goToStep(3); // Go to Ticketing
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please complete Settings section'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }
    
    if (!_formData.isFormValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all required fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate dates
    try {
      final eventDate = DateTime.parse(_formData.eventDate);
      final registrationDeadline = DateTime.parse(_formData.registrationDeadline);
      final now = DateTime.now();

      if (eventDate.isBefore(now.add(const Duration(days: 3)))) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Event date must be at least 3 days from now'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (registrationDeadline.isAfter(eventDate)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration deadline must be before event date'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter valid dates'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Create event
    context.read<OrganizerBloc>().add(
      CreateOrganizerEvent(eventData: _formData.toApiFormat()),
    );
  }

  // Debounced setState untuk performance
  void _debouncedSetState(VoidCallback fn) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 100), () {
      if (mounted) {
        setState(fn);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return Scaffold(
      backgroundColor: Colors.grey[50],
      resizeToAvoidBottomInset: false, // Disable resize to avoid animation lag
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: Container(
          margin: const EdgeInsets.only(left: 8, top: 8, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new),
            iconSize: 20,
            color: Colors.black87,
            onPressed: () => context.pop(),
          ),
        ),
        title: const Text(
          'Create Event',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
      ),
      body: BlocListener<OrganizerBloc, OrganizerState>(
        listener: (context, state) {
          if (state is OrganizerSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green,
              ),
            );
            context.pop();
          } else if (state is OrganizerFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  style: const TextStyle(fontSize: 14),
                ),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 5), // Show longer for validation errors
                action: SnackBarAction(
                  label: 'OK',
                  textColor: Colors.white,
                  onPressed: () {
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  },
                ),
              ),
            );
          }
        },
        child: Column(
          children: [
            // Progress Indicator
            RepaintBoundary(child: _buildProgressIndicator()),
            
            // Form Content (Expanded to fill space)
            Expanded(
              child: RepaintBoundary(
                child: PageView(
                  controller: _pageController,
                  physics: const ClampingScrollPhysics(),
                  onPageChanged: (index) {
                    _debouncedSetState(() {
                      _currentStep = index;
                    });
                  },
                  children: [
                    _buildBasicInfoStep(),
                    _buildDetailsStep(),
                    _buildMediaStep(),
                    _buildTicketingStep(),
                    _buildSettingsStep(),
                  ],
                ),
              ),
            ),
            
            // Navigation Buttons (Sticky at bottom)
            RepaintBoundary(child: _buildNavigationButtons()),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Progress Bar
          LinearProgressIndicator(
            value: _formData.completionPercentage,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(const Color(0xFF2563EB)),
          ),
          
          const SizedBox(height: 16),
          
          // Step Indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final isActive = index == _currentStep;
              final isCompleted = _isStepCompleted(index);
              
              return GestureDetector(
                onTap: () => _goToStep(index),
                child: Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? Colors.green
                            : isActive
                                ? const Color(0xFF2563EB)
                                : Colors.grey[300],
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(Icons.check, color: Colors.white, size: 20)
                            : Text(
                                '${index + 1}',
                                style: TextStyle(
                                  color: isActive ? Colors.white : Colors.grey[600],
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      step,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        color: isActive ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  bool _isStepCompleted(int stepIndex) {
    switch (stepIndex) {
      case 0:
        return _formData.isBasicInfoValid;
      case 1:
        return _formData.isDetailsValid;
      case 2:
        return _formData.isMediaValid;
      case 3:
        // Ticketing step - valid if has tickets (when using multiple ticket types)
        // For simple pricing, always considered complete (no tickets needed)
        return _formData.hasMultipleTicketTypes ? _formData.ticketTypes.isNotEmpty : false;
      case 4:
        // Settings step - use form data validation
        return _formData.isSettingsValid;
      default:
        return false;
    }
  }

  Widget _buildBasicInfoStep() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          _buildTextField(
            label: 'Event Title *',
            value: _formData.title,
            onChanged: (value) => _debouncedSetState(() => _formData.title = value),
            hintText: 'Enter event title',
            icon: Icons.event,
            controller: _titleController,
            fieldKey: 'title',
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Event title is required';
              }
              if (value.trim().length < 5) {
                return 'Event title must be at least 5 characters';
              }
              if (value.trim().length > 200) {
                return 'Event title must be less than 200 characters';
              }
              return null;
            },
          ),
          
          const SizedBox(height: 20),
          
          // Description
          _buildTextField(
            label: 'Description *',
            value: _formData.description,
            onChanged: (value) => _debouncedSetState(() => _formData.description = value),
            hintText: 'Describe your event...',
            icon: Icons.description,
            maxLines: 4,
            controller: _descriptionController,
            fieldKey: 'description',
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Description is required';
              }
              if (value.trim().length > 2000) {
                return 'Description must be less than 2000 characters';
              }
              return null;
            },
          ),
          
          const SizedBox(height: 20),
          
          // Location
        Text(
          'Location *',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
          const SizedBox(height: 12),
          LocationPicker(
            initialLocation: _formData.location,
            initialLatitude: _formData.latitude,
            initialLongitude: _formData.longitude,
            onLocationSelected: (location) {
              _debouncedSetState(() {
                _formData.location = location['address'] ?? '';
                _formData.latitude = location['latitude'];
                _formData.longitude = location['longitude'];
                _formData.address = location['address'];
                _formData.city = location['city'];
                _formData.province = location['province'];
                _formData.country = location['country'];
                _formData.postalCode = location['postalCode'];
              });
            },
            placeholder: 'Search location...',
          ),
          
          // Bottom spacing for navigation buttons
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildDetailsStep() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Multi-day toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.event_repeat, color: Colors.blue.shade700, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Multi-day Event',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue.shade900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Event spans multiple days',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isMultiDayEvent,
                  onChanged: (value) {
                    setState(() {
                      _isMultiDayEvent = value;
                      if (value) {
                        // Enable multi-day: auto-fill end date with start date
                        if (_formData.eventDate.isNotEmpty) {
                          _formData.eventEndDate = _formData.eventDate;
                          _eventEndDateController.text = _formData.eventDate;
                        }
                      } else {
                        // Disable multi-day: clear end date/time
                        _formData.eventEndDate = null;
                        _formData.eventEndTime = null;
                        _eventEndDateController.clear();
                        _eventEndTimeController.clear();
                      }
                    });
                  },
                  activeThumbColor: Colors.blue.shade700,
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Start Date & Time Row
          Text(
            _isMultiDayEvent ? 'Start Date & Time *' : 'Event Date & Time *',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: _buildTextField(
                  label: '',
                  value: _formData.eventDate,
                  onChanged: (value) => _debouncedSetState(() => _formData.eventDate = value),
                  hintText: 'Date',
                  icon: Icons.calendar_today,
                  readOnly: true,
                  controller: _eventDateController,
                  onTap: () => _selectDate(context, (date) {
                    _debouncedSetState(() => _formData.eventDate = date.toIso8601String().split('T')[0]);
                  }),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _buildTextField(
                  label: '',
                  value: _formData.eventTime,
                  onChanged: (value) => _debouncedSetState(() => _formData.eventTime = value),
                  hintText: 'Time',
                  icon: Icons.access_time,
                  readOnly: true,
                  controller: _eventTimeController,
                  onTap: () => _selectTime(context, (time) {
                    _debouncedSetState(() => _formData.eventTime = time.format(context));
                  }),
                ),
              ),
            ],
          ),
          
          // End Date & Time Row (only show if multi-day)
          if (_isMultiDayEvent) ...[
            const SizedBox(height: 20),
            Text(
              'End Date & Time *',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: _buildTextField(
                    label: '',
                    value: _formData.eventEndDate ?? '',
                    onChanged: (value) => _debouncedSetState(() => _formData.eventEndDate = value),
                    hintText: 'Date',
                    icon: Icons.event,
                    readOnly: true,
                    controller: _eventEndDateController,
                    onTap: () => _selectDate(context, (date) {
                      _debouncedSetState(() => _formData.eventEndDate = date.toIso8601String().split('T')[0]);
                    }),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: _buildTextField(
                    label: '',
                    value: _formData.eventEndTime ?? '',
                    onChanged: (value) => _debouncedSetState(() => _formData.eventEndTime = value),
                    hintText: 'Time',
                    icon: Icons.schedule,
                    readOnly: true,
                    controller: _eventEndTimeController,
                    onTap: () => _selectTime(context, (time) {
                      _debouncedSetState(() => _formData.eventEndTime = time.format(context));
                    }),
                  ),
                ),
              ],
            ),
          ],
          
          const SizedBox(height: 20),
          
          // Max Participants
          _buildTextField(
            label: 'Max Participants *',
            fieldKey: 'maxParticipants',
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Max participants is required';
              }
              final intValue = int.tryParse(value);
              if (intValue == null) {
                return 'Please enter a valid number';
              }
              if (intValue < 1) {
                return 'Max participants must be at least 1';
              }
              if (intValue > 10000) {
                return 'Max participants must be less than 10,000';
              }
              return null;
            },
            value: _formData.maxParticipants.toString(),
            onChanged: (value) => _debouncedSetState(() => _formData.maxParticipants = int.tryParse(value) ?? 100),
            hintText: 'Enter maximum participants',
            icon: Icons.people,
            keyboardType: TextInputType.number,
            controller: _maxParticipantsController,
          ),
          
          const SizedBox(height: 20),
          
          // Registration Deadline
          _buildTextField(
            label: 'Registration Deadline *',
            value: _formData.registrationDeadline,
            onChanged: (value) => _debouncedSetState(() => _formData.registrationDeadline = value),
            hintText: 'Select registration deadline',
            icon: Icons.event_available,
            readOnly: true,
            controller: _registrationDeadlineController,
            onTap: () => _selectDate(context, (date) {
              _debouncedSetState(() => _formData.registrationDeadline = date.toIso8601String().split('T')[0]);
            }),
          ),
          
          // Bottom spacing for navigation buttons
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildMediaStep() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail Image
          ImagePickerWidget(
            title: 'Thumbnail Image',
            hint: 'Upload event thumbnail',
            currentImageUrl: _formData.thumbnailUrl,
            onImageSelected: (imageUrl) {
              _debouncedSetState(() => _formData.thumbnailUrl = imageUrl);
            },
            onImageRemoved: () {
              _debouncedSetState(() => _formData.thumbnailUrl = '');
            },
          ),
          
          const SizedBox(height: 24),
          
          // Gallery Images
          ImagePickerWidget(
            title: 'Gallery Images',
            hint: 'Upload gallery images',
            isMultiple: true,
            currentImageUrls: _formData.galleryUrls,
            onImageSelected: (imageUrl) {
              _debouncedSetState(() {
                _formData.galleryUrls = [..._formData.galleryUrls, imageUrl];
              });
            },
          ),
          
          // Bottom spacing for navigation buttons
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildTicketingStep() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ticketing Mode Toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.confirmation_number, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Text(
                      'Ticketing Options',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Choose how you want to manage event pricing and tickets',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Simple Pricing Option
          _buildTicketModeCard(
            title: 'Simple Pricing',
            description: 'Single price for all participants (Free or Paid)',
            icon: Icons.attach_money,
            isSelected: !_formData.hasMultipleTicketTypes,
            onTap: () {
              _debouncedSetState(() {
                _formData.hasMultipleTicketTypes = false;
                _formData.ticketTypes = [];
              });
            },
          ),
          
          const SizedBox(height: 16),
          
          // Multiple Ticket Types Option
          _buildTicketModeCard(
            title: 'Multiple Ticket Types',
            description: 'Create custom tickets (VIP, Early Bird, Student, etc.)',
            icon: Icons.confirmation_number_outlined,
            isSelected: _formData.hasMultipleTicketTypes,
            onTap: () {
              _debouncedSetState(() {
                _formData.hasMultipleTicketTypes = true;
              });
            },
          ),
          
          const SizedBox(height: 24),
          
          // Show appropriate UI based on selection
          if (!_formData.hasMultipleTicketTypes) ...[
            // Simple pricing UI
            _buildSwitchTile(
              title: 'Free Event',
              subtitle: 'No registration fee required',
              value: _formData.isFree,
              onChanged: (value) {
                _debouncedSetState(() {
                  _formData.isFree = value;
                  if (value) _formData.price = 0;
                });
              },
              icon: Icons.money_off,
            ),
            
            if (!_formData.isFree) ...[
              const SizedBox(height: 16),
              _buildTextField(
                label: 'Event Price (IDR) *',
                value: _formData.price.toString(),
                onChanged: (value) => _debouncedSetState(() => _formData.price = double.tryParse(value) ?? 0),
                hintText: 'Enter event price',
                icon: Icons.payments,
                keyboardType: TextInputType.number,
                controller: _priceController,
              ),
            ],
          ] else ...[
            // Multiple ticket types UI
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Ticket Types (${_formData.ticketTypes.length})',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _addTicketType,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Ticket'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Ticket Types List
            if (_formData.ticketTypes.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Icon(Icons.confirmation_number_outlined, 
                      size: 48, 
                      color: Colors.grey.shade400
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No ticket types yet',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Add at least one ticket type to continue',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              )
            else
              ...List.generate(_formData.ticketTypes.length, (index) {
                final ticket = _formData.ticketTypes[index];
                return _buildTicketTypeCard(ticket, index);
              }),
          ],
        ],
      ),
    );
  }
  
  Widget _buildTicketModeCard({
    required String title,
    required String description,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.blue.shade400 : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? Colors.blue.shade100 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.blue.shade700 : Colors.grey.shade600,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.blue.shade900 : Colors.grey.shade800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: Colors.blue.shade700, size: 24),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTicketTypeCard(dynamic ticket, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: ticket.colorValue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(ticket.iconData, color: ticket.colorValue, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ticket.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${ticket.formattedPrice} • Capacity: ${ticket.capacity}',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit, color: Color(0xFF2563EB)),
            onPressed: () => _editTicketType(index),
          ),
          IconButton(
            icon: Icon(Icons.delete, color: Colors.red.shade400),
            onPressed: () => _deleteTicketType(index),
          ),
        ],
      ),
    );
  }
  
  void _addTicketType() {
    // Navigate to custom ticket builder
    // For now, we'll use a simple dialog - you can replace with full page navigation
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: CustomTicketBuilder(
          eventId: 'temp', // Will be replaced with actual event ID after creation
          eventRegistrationDeadline: DateTime.tryParse(_formData.registrationDeadline),
          onTicketCreated: (ticket) {
            _debouncedSetState(() {
              _formData.ticketTypes = [..._formData.ticketTypes, ticket];
            });
            Navigator.pop(context);
          },
          onCancel: () => Navigator.pop(context),
        ),
      ),
    );
  }
  
  void _editTicketType(int index) {
    final ticket = _formData.ticketTypes[index];
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: CustomTicketBuilder(
          eventId: 'temp',
          eventRegistrationDeadline: DateTime.tryParse(_formData.registrationDeadline),
          initialTicket: ticket,
          onTicketCreated: (updatedTicket) {
            _debouncedSetState(() {
              final newList = List<TicketType>.from(_formData.ticketTypes);
              newList[index] = updatedTicket;
              _formData.ticketTypes = newList;
            });
            Navigator.pop(context);
          },
          onCancel: () => Navigator.pop(context),
        ),
      ),
    );
  }
  
  void _deleteTicketType(int index) {
    _debouncedSetState(() {
      final newList = List<TicketType>.from(_formData.ticketTypes);
      newList.removeAt(index);
      _formData.ticketTypes = newList;
    });
  }

  Widget _buildSettingsStep() {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category
        Text(
          'Event Category *',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _formData.category,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              hintStyle: TextStyle(
                color: Colors.grey[400],
                fontWeight: FontWeight.w400,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: Colors.grey[700]!, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: Colors.red[300]!),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: Colors.red[700]!, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 18,
              ),
            ),
            dropdownColor: Colors.white,
            style: const TextStyle(
              color: Color(0xFF1E293B),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
            items: EventCategories.categories.map((category) {
              return DropdownMenuItem(
                value: category['value'],
                child: Text(
                  category['label']!,
                  style: const TextStyle(
                    color: Color(0xFF1E293B),
                    fontSize: 16,
                  ),
                ),
              );
            }).toList(),
            onChanged: (value) {
              _debouncedSetState(() => _formData.category = value ?? 'OTHER');
            },
          ),
          
          const SizedBox(height: 20),
          
          // Note about pricing
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Event pricing is managed through ticket types',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.blue.shade900,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Settings
          _buildSwitchTile(
            title: 'Publish Immediately',
            subtitle: 'Make event visible to participants',
            value: _formData.isPublished,
            onChanged: (value) => _debouncedSetState(() => _formData.isPublished = value),
            icon: Icons.publish,
          ),
          
          _buildSwitchTile(
            title: 'Generate Certificates',
            subtitle: 'Generate certificates for participants',
            value: _formData.generateCertificate,
            onChanged: (value) => _debouncedSetState(() => _formData.generateCertificate = value),
            icon: Icons.card_membership,
          ),

          // Private Event Section
          Container(
            margin: const EdgeInsets.symmetric(vertical: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.purple.shade50,
                  Colors.pink.shade50,
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.purple.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.lock_outline,
                      color: Colors.purple.shade600,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Private Event Settings',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.purple.shade800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                _buildSwitchTile(
                  title: 'Make this event private',
                  subtitle: 'Require password for access',
                  value: _formData.isPrivate,
                  onChanged: (value) => _debouncedSetState(() => _formData.isPrivate = value),
                  icon: Icons.security,
                ),
                
                if (_formData.isPrivate) ...[
                  const SizedBox(height: 12),
                  _buildTextField(
                    label: 'Private Event Password *',
                    value: _formData.privatePassword,
                    onChanged: (value) => _debouncedSetState(() => _formData.privatePassword = value),
                    hintText: 'Enter password for private access',
                    icon: Icons.key,
                    controller: _privatePasswordController,
                    obscureText: true,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Participants will need this password to view and register for your event.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Bottom spacing for navigation buttons
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String value,
    required Function(String) onChanged,
    required String hintText,
    required IconData icon,
    required TextEditingController controller,
    int maxLines = 1,
    bool readOnly = false,
    VoidCallback? onTap,
    TextInputType? keyboardType,
    bool enabled = true,
    bool obscureText = false,
    String? fieldKey, // Key untuk error message
    String? Function(String?)? validator, // Validator function
  }) {
    // Update controller text jika berbeda dengan value
    // Pastikan controller selalu sync dengan form data
    if (controller.text != value) {
      controller.text = value;
    }
    
    // Get error message for this field
    final errorMessage = fieldKey != null ? _fieldErrors[fieldKey] : null;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: controller,
          onChanged: (newValue) {
            // Clear error when user starts typing
            if (fieldKey != null && _fieldErrors.containsKey(fieldKey)) {
              _fieldErrors.remove(fieldKey);
              setState(() {});
            }
            
            // Run validator if provided
            if (validator != null && fieldKey != null) {
              final validationError = validator(newValue);
              if (validationError != null) {
                _fieldErrors[fieldKey] = validationError;
              } else {
                _fieldErrors.remove(fieldKey);
              }
              setState(() {});
            }
            
            onChanged(newValue);
          },
          maxLines: maxLines,
          readOnly: readOnly,
          onTap: onTap,
          keyboardType: keyboardType,
          enabled: enabled,
          obscureText: obscureText,
          // Keyboard optimization
          textInputAction: maxLines > 1 ? TextInputAction.newline : TextInputAction.next,
          enableSuggestions: true,
          autocorrect: true,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(
              color: Colors.grey[400],
              fontWeight: FontWeight.w400,
            ),
            prefixIcon: Icon(icon, color: Colors.grey[600]),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[200]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[700]!, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.red[300]!),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.red[700]!, width: 2),
            ),
            // Better keyboard behavior
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 18,
            ),
            errorText: errorMessage,
            errorStyle: const TextStyle(
              fontSize: 12,
              color: Colors.red,
            ),
          ),
          style: TextStyle(
            color: const Color(0xFF1E293B),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildPriceField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Event Price (IDR)',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _priceController,
          onChanged: (value) {
            // Handle empty string and non-numeric input
            if (value.isEmpty) {
              _debouncedSetState(() => _formData.price = 0);
            } else {
              final parsedValue = double.tryParse(value);
              if (parsedValue != null && parsedValue >= 0) {
                _debouncedSetState(() => _formData.price = parsedValue);
              }
            }
          },
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          enabled: !_formData.isFree,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
            TextInputFormatter.withFunction((oldValue, newValue) {
              // Prevent multiple decimal points
              if (newValue.text.split('.').length > 2) {
                return oldValue;
              }
              return newValue;
            }),
          ],
          decoration: InputDecoration(
            hintText: 'Enter event price',
            hintStyle: TextStyle(
              color: Colors.grey[400],
              fontWeight: FontWeight.w400,
            ),
            prefixIcon: Icon(Icons.attach_money, color: Colors.grey[600]),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[200]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.grey[700]!, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.red[300]!),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.red[700]!, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 18,
            ),
          ),
          style: TextStyle(
            color: const Color(0xFF1E293B),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: SwitchListTile(
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            color: Color(0xFF1E293B),
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF64748B)),
        ),
        value: value,
        onChanged: onChanged,
        secondary: Icon(icon, color: const Color(0xFF2563EB)),
        activeThumbColor: const Color(0xFF2563EB),
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                child: const Text('Previous'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            child: BlocBuilder<OrganizerBloc, OrganizerState>(
              buildWhen: (previous, current) => 
                previous is OrganizerLoading != current is OrganizerLoading,
              builder: (context, state) {
                final isLoading = state is OrganizerLoading;
                
                if (_currentStep == _steps.length - 1) {
                  return ElevatedButton(
                    onPressed: isLoading ? null : _createEvent,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green[600],
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Create Event',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  );
                } else {
                  return ElevatedButton(
                    onPressed: _nextStep,
                    child: const Text('Next'),
                  );
                }
              },
            ),
          ),
        ],
        ),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context, Function(DateTime) onDateSelected) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      onDateSelected(picked);
    }
  }

  Future<void> _selectTime(BuildContext context, Function(TimeOfDay) onTimeSelected) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
    );
    
    if (picked != null) {
      onTimeSelected(picked);
    }
  }
}
