import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../models/event_analytics_models.dart';
import 'event_analytics_overview.dart';
import 'event_analytics_registrations.dart';
import 'event_analytics_attendance.dart';

class EventAnalyticsContent extends StatelessWidget {
  final EventAnalyticsData analyticsData;
  final String selectedTab;
  final Function(String) onTabChanged;

  const EventAnalyticsContent({
    super.key,
    required this.analyticsData,
    required this.selectedTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab Bar
        Container(
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              _buildTab('overview', 'Overview', Icons.dashboard),
              _buildTab('registrations', 'Registrations', Icons.person_add),
              _buildTab('attendance', 'Attendance', Icons.event_available),
            ],
          ),
        ),
        
        // Content
        Expanded(
          child: _buildTabContent(),
        ),
      ],
    );
  }

  Widget _buildTab(String tabId, String label, IconData icon) {
    final isSelected = selectedTab == tabId;
    
    return Expanded(
      child: GestureDetector(
        onTap: () => onTabChanged(tabId),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppConstants.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : AppConstants.textSecondary,
                size: 20,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppConstants.textSecondary,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (selectedTab) {
      case 'overview':
        return EventAnalyticsOverview(analyticsData: analyticsData);
      case 'registrations':
        return EventAnalyticsRegistrations(analyticsData: analyticsData);
      case 'attendance':
        return EventAnalyticsAttendance(analyticsData: analyticsData);
      default:
        return EventAnalyticsOverview(analyticsData: analyticsData);
    }
  }
}
