import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/registration_confirmation_dialog.dart';
import '../../registration/bloc/registration_bloc.dart';

class EventDetailRegistration extends StatefulWidget {
  final EventModel event;
  final UserModel? user;
  final bool isRegistered;
  final bool isLoading;
  final VoidCallback onRegisterPressed;

  const EventDetailRegistration({
    super.key,
    required this.event,
    required this.user,
    required this.isRegistered,
    required this.isLoading,
    required this.onRegisterPressed,
  });

  @override
  State<EventDetailRegistration> createState() => _EventDetailRegistrationState();
}

class _EventDetailRegistrationState extends State<EventDetailRegistration> {
  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRegistrationSection(),
          ],
        ),
      ),
    );
  }


  Widget _buildRegistrationSection() {
    if (widget.isRegistered) {
      return _buildRegisteredState();
    }

    if (_isRegistrationClosed()) {
      return _buildRegistrationClosedState();
    }

    if (_isEventFull()) {
      return _buildEventFullState();
    }

    return _buildRegistrationButton();
  }

  Widget _buildRegisteredState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF10B981).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            color: const Color(0xFF10B981),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'You are registered!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF10B981),
                  ),
                ),
                Text(
                  'Check your tickets in the Tickets section',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegistrationClosedState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey[300]!,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.event_busy,
            color: Colors.grey[600],
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Registration Closed',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  'Registration deadline has passed',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventFullState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFEF4444).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.person_off,
            color: const Color(0xFFEF4444),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Event Full',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFEF4444),
                  ),
                ),
                Text(
                  'Maximum participants reached',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegistrationButton() {
    return BlocListener<RegistrationBloc, RegistrationState>(
      listener: (context, state) {
        if (state is RegistrationSuccess) {
          _showRegistrationSuccessDialog();
        } else if (state is RegistrationFailure) {
          _showRegistrationErrorDialog(state.message);
        }
      },
      child: CustomButton(
        text: widget.event.isFree ? 'Register for Free' : 'Register Now',
        onPressed: widget.isLoading ? null : widget.onRegisterPressed,
        isLoading: widget.isLoading,
        backgroundColor: const Color(0xFF2563EB),
        textColor: Colors.white,
        width: double.infinity,
        height: 50,
      ),
    );
  }

  void _showRegistrationSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => RegistrationConfirmationDialog(
        event: widget.event,
        user: UserModel(
          id: 'temp-id',
          email: 'temp@example.com',
          fullName: 'Temp User',
          role: 'PARTICIPANT',
          emailVerified: true,
          tokenVersion: 1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ), // TODO: Get current user
        onConfirm: () {
          Navigator.of(context).pop();
          // TODO: Handle registration confirmation
        },
        onCancel: () {
          Navigator.of(context).pop();
        },
      ),
    );
  }

  void _showRegistrationErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Registration Failed'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  bool _isRegistrationClosed() {
    return DateTime.now().isAfter(widget.event.registrationDeadline);
  }

  bool _isEventFull() {
    // Assuming we have registration count from the event
    // This would need to be implemented based on your data structure
    return false; // Placeholder
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    return double.parse(price.toString()).toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}
