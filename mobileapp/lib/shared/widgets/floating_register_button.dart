import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../models/event_model.dart';
import '../models/registration_model.dart';
import '../../features/auth/bloc/auth_bloc.dart';

class FloatingRegisterButton extends StatelessWidget {
  final EventModel event;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isRegistered;
  final EventRegistration? userRegistration;
  final bool isAuthenticated;

  const FloatingRegisterButton({
    super.key,
    required this.event,
    this.onPressed,
    this.isLoading = false,
    this.isRegistered = false,
    this.userRegistration,
    this.isAuthenticated = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDisabled = _isButtonDisabled();
    
    // Debug logging
    print('🔍 FloatingRegisterButton - isRegistered: $isRegistered');
    print('🔍 FloatingRegisterButton - isDisabled: $isDisabled');
    print('🔍 FloatingRegisterButton - buttonText: ${_getButtonText()}');
    print('🔍 FloatingRegisterButton - buttonColor: ${_getButtonColor()}');
    
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(25),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: (isLoading || isDisabled) ? null : () => _handleButtonTap(context),
            borderRadius: BorderRadius.circular(25),
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: _getButtonColor(),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Center(
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getButtonIcon(),
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _getButtonText(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  bool _isButtonDisabled() {
    // Check if event is published
    if (!event.isPublished) return true;
    
    // Check if event is full
    if ((event.registrationCount ?? 0) >= event.maxParticipants) return true;
    
    // Check if registration deadline has passed
    if (DateTime.now().isAfter(event.registrationDeadline)) return true;
    
    // Check if event has already started
    try {
      final eventDateTime = _parseEventDateTime();
      if (DateTime.now().isAfter(eventDateTime)) return true;
    } catch (e) {
      print('⚠️ Error parsing event datetime: $e');
      // If parsing fails, assume event is still valid
    }
    
    return false;
  }

  Color _getButtonColor() {
    if (isRegistered) {
      return Colors.grey; // Grey for already registered (disabled)
    } else if (_isButtonDisabled()) {
      return Colors.grey; // Grey for disabled
    } else {
      return const Color(0xFF2563EB); // Blue for register
    }
  }

  IconData _getButtonIcon() {
    if (isRegistered) {
      return Icons.check_circle_outline; // Check icon for already registered
    } else {
      return Icons.event_available; // Register icon
    }
  }

  String _getButtonText() {
    if (isRegistered) {
      return 'You Already Registered';
    } else if (!event.isPublished) {
      return 'Event Not Published';
    } else if ((event.registrationCount ?? 0) >= event.maxParticipants) {
      return 'Event Full';
    } else if (DateTime.now().isAfter(event.registrationDeadline)) {
      return 'Registration Closed';
    } else {
      try {
        final eventDateTime = _parseEventDateTime();
        if (DateTime.now().isAfter(eventDateTime)) {
          return 'Event Started';
        }
      } catch (e) {
        print('⚠️ Error parsing event datetime for button text: $e');
        // If parsing fails, continue to default text
      }
    }
    
    // Default register text - check authentication status
    if (!isAuthenticated) {
      return 'Sign in to Register';
    }
    
    if (event.isFree) {
      return 'Register Free';
    } else {
      return 'Register - ${event.formattedPrice}';
    }
  }

  DateTime _parseEventDateTime() {
    final dateStr = event.eventDate.toIso8601String().split('T')[0]; // YYYY-MM-DD
    final timeStr = event.eventTime;
    
    // Handle different time formats
    String isoTimeStr;
    if (timeStr.contains('AM') || timeStr.contains('PM')) {
      // Format: "9:00 AM" or "2:30 PM"
      final parts = timeStr.split(' ');
      if (parts.length != 2) throw Exception('Invalid time format: $timeStr');
      
      final timePart = parts[0];
      final period = parts[1];
      
      final timeComponents = timePart.split(':');
      if (timeComponents.length != 2) throw Exception('Invalid time format: $timeStr');
      
      int hour = int.parse(timeComponents[0]);
      final minute = int.parse(timeComponents[1]);
      
      // Convert to 24-hour format
      if (period == 'PM' && hour != 12) {
        hour += 12;
      } else if (period == 'AM' && hour == 12) {
        hour = 0;
      }
      
      isoTimeStr = '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}:00';
    } else if (timeStr.contains(':')) {
      // Format: "14:00:00" or "14:00"
      if (timeStr.split(':').length == 2) {
        isoTimeStr = '$timeStr:00'; // Add seconds if missing
      } else {
        isoTimeStr = timeStr;
      }
    } else {
      throw Exception('Unsupported time format: $timeStr');
    }
    
    final dateTimeStr = '${dateStr}T$isoTimeStr';
    return DateTime.parse(dateTimeStr);
  }

  void _handleButtonTap(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    
    if (authState is! AuthAuthenticated) {
      // User is not authenticated, redirect to login
      context.go('/login');
      return;
    }
    
    // If user is already registered, show message
    if (isRegistered) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are already registered for this event'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }
    
    // User is authenticated and not registered, proceed with registration
    if (onPressed != null) {
      onPressed!();
    }
  }
}
