import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../models/analytics_models.dart';

class AnalyticsTable extends StatelessWidget {
  final List<AnalyticsEvent> events;
  final Function(String eventId, String eventTitle)? onEventAnalyticsTap;

  const AnalyticsTable({
    super.key,
    required this.events,
    this.onEventAnalyticsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConstants.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppConstants.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Event Performance Table',
            style: TextStyle(
              color: AppConstants.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Detailed statistics in table format',
            style: TextStyle(
              color: AppConstants.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          
          if (events.isEmpty)
            _buildEmptyState()
          else
            _buildTable(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(
            Icons.table_chart_outlined,
            size: 48,
            color: AppConstants.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'No events found',
            style: TextStyle(
              color: AppConstants.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your filters to see more events.',
            style: TextStyle(
              color: AppConstants.textSecondary,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 16,
        headingRowColor: WidgetStateProperty.all(
          AppConstants.primaryColor.withOpacity(0.1),
        ),
        columns: const [
          DataColumn(
            label: Text(
              'Event',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          DataColumn(
            label: Text(
              'Date',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          DataColumn(
            label: Text(
              'Status',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          DataColumn(
            label: Text(
              'Participants',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          DataColumn(
            label: Text(
              'Rate',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
        rows: events.map((event) {
          final registrationRate = event.maxParticipants > 0
              ? ((event.registrationsCount / event.maxParticipants) * 100)
              : 0.0;

          return DataRow(
            cells: [
              DataCell(
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 200),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        event.title,
                        style: TextStyle(
                          color: AppConstants.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        event.location,
                        style: TextStyle(
                          color: AppConstants.textSecondary,
                          fontSize: 10,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppConstants.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          event.category,
                          style: TextStyle(
                            color: AppConstants.primaryColor,
                            fontSize: 9,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              DataCell(
                Text(
                  _formatDate(event.eventDate),
                  style: TextStyle(
                    color: AppConstants.textPrimary,
                    fontSize: 12,
                  ),
                ),
              ),
              DataCell(_buildStatusBadge(event.status)),
              DataCell(
                Text(
                  '${event.registrationsCount}/${event.maxParticipants}',
                  style: TextStyle(
                    color: AppConstants.textPrimary,
                    fontSize: 12,
                  ),
                ),
              ),
              DataCell(
                Row(
                  children: [
                    Text(
                      '${registrationRate.toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: AppConstants.textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        // Navigate to event analytics
                        if (onEventAnalyticsTap != null) {
                          onEventAnalyticsTap!(event.id, event.title);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppConstants.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Icon(
                          Icons.analytics,
                          color: AppConstants.primaryColor,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status) {
      case 'DRAFT':
        backgroundColor = Colors.grey[100]!;
        textColor = Colors.grey[800]!;
        displayText = 'Draft';
        break;
      case 'PUBLISHED':
        backgroundColor = Colors.green[100]!;
        textColor = Colors.green[800]!;
        displayText = 'Published';
        break;
      default:
        backgroundColor = Colors.grey[100]!;
        textColor = Colors.grey[800]!;
        displayText = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    return '${date.day}/${date.month}/${date.year}';
  }
}
