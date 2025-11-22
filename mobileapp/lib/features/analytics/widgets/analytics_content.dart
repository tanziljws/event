import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../models/analytics_models.dart' as analytics_models;
import 'analytics_charts.dart';
import 'analytics_filters_widget.dart';
import 'analytics_calendar.dart';
import 'analytics_table.dart';

class AnalyticsContent extends StatelessWidget {
  final analytics_models.AnalyticsData analyticsData;
  final analytics_models.AnalyticsFilters filters;
  final List<analytics_models.AnalyticsEvent> filteredEvents;
  final String viewMode;
  final Function(analytics_models.AnalyticsFilters) onFiltersChanged;
  final Function(String) onViewModeChanged;

  const AnalyticsContent({
    super.key,
    required this.analyticsData,
    required this.filters,
    required this.filteredEvents,
    required this.viewMode,
    required this.onFiltersChanged,
    required this.onViewModeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filters Section
          AnalyticsFiltersWidget(
            filters: filters,
            categories: _getUniqueCategories(),
            onFiltersChanged: onFiltersChanged,
          ),
          
          const SizedBox(height: 24),
          
          // Charts Section
          AnalyticsCharts(
            chartData: analyticsData.chartData,
            statusData: analyticsData.statusData,
          ),
          
          const SizedBox(height: 24),
          
          // View Toggle
          _buildViewToggle(),
          
          const SizedBox(height: 16),
          
          // Results Count
          _buildResultsCount(),
          
          const SizedBox(height: 16),
          
          // Content based on view mode
          if (viewMode == 'calendar') ...[
            AnalyticsCalendar(
              events: filteredEvents,
            ),
          ] else ...[
            AnalyticsTable(
              events: filteredEvents,
              onEventAnalyticsTap: (eventId, eventTitle) {
                context.go('/analytics/event/$eventId?title=${Uri.encodeComponent(eventTitle)}');
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildViewToggle() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => onViewModeChanged('calendar'),
            icon: Icon(
              Icons.calendar_today,
              size: 18,
              color: viewMode == 'calendar' 
                  ? Colors.white 
                  : AppConstants.primaryColor,
            ),
            label: Text(
              'Calendar View',
              style: TextStyle(
                color: viewMode == 'calendar' 
                    ? Colors.white 
                    : AppConstants.primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: viewMode == 'calendar' 
                  ? AppConstants.primaryColor 
                  : Colors.white,
              foregroundColor: viewMode == 'calendar' 
                  ? Colors.white 
                  : AppConstants.primaryColor,
              side: BorderSide(
                color: AppConstants.primaryColor,
                width: 1,
              ),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => onViewModeChanged('table'),
            icon: Icon(
              Icons.table_chart,
              size: 18,
              color: viewMode == 'table' 
                  ? Colors.white 
                  : AppConstants.primaryColor,
            ),
            label: Text(
              'Table View',
              style: TextStyle(
                color: viewMode == 'table' 
                    ? Colors.white 
                    : AppConstants.primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: viewMode == 'table' 
                  ? AppConstants.primaryColor 
                  : Colors.white,
              foregroundColor: viewMode == 'table' 
                  ? Colors.white 
                  : AppConstants.primaryColor,
              side: BorderSide(
                color: AppConstants.primaryColor,
                width: 1,
              ),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultsCount() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppConstants.cardBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppConstants.borderLight),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            size: 16,
            color: AppConstants.textSecondary,
          ),
          const SizedBox(width: 8),
          Text(
            'Showing ${filteredEvents.length} of ${analyticsData.events.length} events',
            style: TextStyle(
              color: AppConstants.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  List<String> _getUniqueCategories() {
    return analyticsData.events
        .map((event) => event.category)
        .toSet()
        .toList();
  }
}
