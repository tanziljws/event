import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../models/analytics_models.dart';

class AnalyticsCalendar extends StatelessWidget {
  final List<AnalyticsEvent> events;

  const AnalyticsCalendar({
    super.key,
    required this.events,
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
            'Event Calendar',
            style: TextStyle(
              color: AppConstants.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'View your events in calendar format',
            style: TextStyle(
              color: AppConstants.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          
          // Calendar Grid
          _buildCalendarGrid(),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final now = DateTime.now();
    final firstDay = DateTime(now.year, now.month, 1);
    final lastDay = DateTime(now.year, now.month + 1, 0);
    final startDate = firstDay.subtract(Duration(days: firstDay.weekday - 1));
    
    return Column(
      children: [
        // Day headers
        Row(
          children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              .map((day) => Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        day,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppConstants.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        
        // Calendar days
        ...List.generate(6, (weekIndex) {
          return Row(
            children: List.generate(7, (dayIndex) {
              final dayDate = startDate.add(
                Duration(days: weekIndex * 7 + dayIndex),
              );
              final dayEvents = _getEventsForDay(dayDate);
              final isCurrentMonth = dayDate.month == now.month;
              final isToday = dayDate.day == now.day && 
                             dayDate.month == now.month && 
                             dayDate.year == now.year;
              
              return Expanded(
                child: Container(
                  height: 80,
                  margin: const EdgeInsets.all(1),
                  decoration: BoxDecoration(
                    color: isCurrentMonth ? Colors.white : Colors.grey[50],
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: isToday 
                          ? AppConstants.primaryColor 
                          : Colors.grey[200]!,
                      width: isToday ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      // Date number
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              dayDate.day.toString(),
                              style: TextStyle(
                                color: isCurrentMonth 
                                    ? AppConstants.textPrimary 
                                    : AppConstants.textMuted,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (dayEvents.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: _getEventCountColor(dayEvents.length),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  dayEvents.length.toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      
                      // Events list
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          itemCount: dayEvents.length > 3 ? 3 : dayEvents.length,
                          itemBuilder: (context, index) {
                            final event = dayEvents[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 1),
                              padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppConstants.primaryColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(
                                event.title,
                                style: TextStyle(
                                  color: AppConstants.primaryColor,
                                  fontSize: 8,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          },
                        ),
                      ),
                      
                      // More events indicator
                      if (dayEvents.length > 3)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: Text(
                            '+${dayEvents.length - 3} more',
                            style: TextStyle(
                              color: AppConstants.textMuted,
                              fontSize: 8,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }),
          );
        }),
      ],
    );
  }

  List<AnalyticsEvent> _getEventsForDay(DateTime dayDate) {
    return events.where((event) {
      final eventDate = DateTime.parse(event.eventDate);
      return eventDate.day == dayDate.day &&
             eventDate.month == dayDate.month &&
             eventDate.year == dayDate.year;
    }).toList();
  }

  Color _getEventCountColor(int count) {
    if (count <= 2) return Colors.green;
    if (count <= 4) return Colors.orange;
    if (count <= 6) return Colors.red;
    return Colors.purple;
  }
}
