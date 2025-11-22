import 'package:flutter/material.dart';
import '../../../shared/models/registration_model.dart';
import 'registration_card.dart';

class MyRegistrationsList extends StatelessWidget {
  final List<RegistrationModel> registrations;
  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;
  final Function(RegistrationModel) onRegistrationTap;
  final Function(String) onGenerateCertificate;
  final Function(String) onDownloadCertificate;

  const MyRegistrationsList({
    super.key,
    required this.registrations,
    required this.isLoading,
    required this.error,
    required this.onRetry,
    required this.onRegistrationTap,
    required this.onGenerateCertificate,
    required this.onDownloadCertificate,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _buildLoadingState();
    }

    if (error != null) {
      return _buildErrorState(error!);
    }

    if (registrations.isEmpty) {
      return _buildEmptyState();
    }

    return _buildRegistrationsList();
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Loading your registrations...',
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
              'Failed to load registrations',
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
              onPressed: onRetry,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(60),
              ),
              child: Icon(
                Icons.event_note,
                size: 60,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No Registrations Yet',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'You haven\'t registered for any events yet.\nStart exploring and join amazing events!',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Navigate to events page
              },
              icon: const Icon(Icons.explore),
              label: const Text('Explore Events'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegistrationsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: registrations.length,
      itemBuilder: (context, index) {
        final registration = registrations[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: RegistrationCard(
            registration: registration,
            onTap: () => onRegistrationTap(registration),
          ),
        );
      },
    );
  }
}
