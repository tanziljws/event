import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/models/registration_model.dart';
import 'registration_card.dart';

class MyRegistrationsContent extends StatelessWidget {
  final List<RegistrationModel> registrations;
  final String selectedFilter;
  final String searchQuery;
  final VoidCallback? onRefresh;
  final double horizontalPadding;

  const MyRegistrationsContent({
    super.key,
    required this.registrations,
    required this.selectedFilter,
    required this.searchQuery,
    this.onRefresh,
    this.horizontalPadding = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    final filteredRegistrations = _filterRegistrations(registrations);
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;
    
    if (filteredRegistrations.isEmpty) {
      return _buildEmptyState(context);
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh?.call(),
      child: isTablet 
        ? _buildTabletLayout(filteredRegistrations)
        : _buildMobileLayout(filteredRegistrations),
    );
  }

  Widget _buildMobileLayout(List<RegistrationModel> filteredRegistrations) {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 8),
      itemCount: filteredRegistrations.length,
      itemBuilder: (context, index) {
        final registration = filteredRegistrations[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: RegistrationCard(
            registration: registration,
              onTap: () {
                context.go('/events/detail/${registration.event.id}');
                            },
          ),
        );
      },
    );
  }

  Widget _buildTabletLayout(List<RegistrationModel> filteredRegistrations) {
    return GridView.builder(
      padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: filteredRegistrations.length,
      itemBuilder: (context, index) {
        final registration = filteredRegistrations[index];
        return RegistrationCard(
          registration: registration,
              onTap: () {
                context.go('/events/detail/${registration.event.id}');
                            },
        );
      },
    );
  }

  List<RegistrationModel> _filterRegistrations(List<RegistrationModel> registrations) {
    var filtered = registrations;
    
    // Filter by status
    if (selectedFilter != 'All') {
      filtered = filtered.where((registration) {
        switch (selectedFilter) {
          case 'Attended':
            return registration.hasAttended == true;
          case 'Not Attended':
            return registration.hasAttended == false;
          case 'Cancelled':
            return registration.status.toLowerCase() == 'cancelled';
          default:
            return true;
        }
      }).toList();
    }
    
    // Filter by search query
    if (searchQuery.isNotEmpty) {
      filtered = filtered.where((registration) {
        return registration.event.title.toLowerCase().contains(searchQuery.toLowerCase()) == true ||
               registration.event.location.toLowerCase().contains(searchQuery.toLowerCase()) == true;
      }).toList();
    }
    
    return filtered;
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(50),
            ),
            child: Icon(
              Icons.event_busy,
              size: 80,
              color: AppConstants.primaryColor,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No registrations found',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            selectedFilter != 'All' 
                ? 'No ${selectedFilter.toLowerCase()} registrations found'
                : 'You haven\'t registered for any events yet',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => context.go('/events'),
            icon: const Icon(Icons.explore),
            label: const Text('Browse Events'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}