import 'package:flutter/material.dart';
import 'event_card.dart';

/// Events section widget with horizontal scrolling
class EventsSection extends StatelessWidget {
  final String title;
  final List<dynamic> events;
  final String? subtitle;

  const EventsSection({
    super.key,
    required this.title,
    required this.events,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    // Apply smart filtering to hide registration closed events
    final filteredEvents = _applySmartFiltering(events);
    if (filteredEvents.isEmpty) return const SizedBox.shrink();

    // Sort events: active events first, then completed/expired events
    final sortedEvents = _sortEventsByStatus(filteredEvents);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 250,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: sortedEvents.length,
            itemBuilder: (context, index) {
              final event = sortedEvents[index];
              return Container(
                width: 200,
                margin: const EdgeInsets.only(right: 12),
                child: EventCard(event: event),
              );
            },
          ),
        ),
      ],
    );
  }

  /// Apply smart filtering to hide old registration closed events
  List<dynamic> _applySmartFiltering(List<dynamic> events) {
    final now = DateTime.now();
    const hideAfterDays = 3; // Hide events 3 days after registration closes
    
    return events.where((event) {
      try {
        // Check registration deadline first
        if (event.registrationDeadline != null) {
          DateTime deadline;
          if (event.registrationDeadline is DateTime) {
            deadline = event.registrationDeadline;
          } else {
            deadline = DateTime.parse(event.registrationDeadline.toString());
          }
          
          // If registration is still open, show the event
          if (!now.isAfter(deadline)) {
            return true;
          }
          
          // If registration is closed, check if it's been more than 3 days
          final daysSinceClosed = now.difference(deadline).inDays;
          if (daysSinceClosed >= hideAfterDays) {
            print('🚫 Hiding event "${event.title}" - Registration closed ${daysSinceClosed} days ago');
            return false; // Hide events that have been closed for 3+ days
          }
        }
        
        // Check if event has already happened (more than 1 day ago)
        if (event.eventDate != null) {
          DateTime eventDate;
          if (event.eventDate is DateTime) {
            eventDate = event.eventDate;
          } else {
            eventDate = DateTime.parse(event.eventDate.toString());
          }
          
          // If event was more than 1 day ago, hide it
          if (now.difference(eventDate).inDays > 1) {
            print('🚫 Hiding event "${event.title}" - Event happened ${now.difference(eventDate).inDays} days ago');
            return false;
          }
        }
        
        // Show the event if it passes all checks
        return true;
        
      } catch (e) {
        print('⚠️ Error filtering event: $e');
        // If parsing fails, show the event (safe fallback)
        return true;
      }
    }).toList();
  }

  /// Sort events by status: active events first, then completed/expired events
  List<dynamic> _sortEventsByStatus(List<dynamic> events) {
    final now = DateTime.now();
    
    return List.from(events)..sort((a, b) {
      try {
        // Check registration status first (most important)
        bool aRegistrationOpen = _isRegistrationOpen(a, now);
        bool bRegistrationOpen = _isRegistrationOpen(b, now);
        
        // Events with open registration come first
        if (aRegistrationOpen && !bRegistrationOpen) return -1;
        if (!aRegistrationOpen && bRegistrationOpen) return 1;
        
        // If both have same registration status, check event date
        DateTime aEventDate = _parseEventDateTime(a);
        DateTime bEventDate = _parseEventDateTime(b);
        
        bool aIsUpcoming = aEventDate.isAfter(now);
        bool bIsUpcoming = bEventDate.isAfter(now);
        
        // Upcoming events come before past events
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        
        // If both are upcoming or both are past, sort by date (closest first for upcoming, latest first for past)
        if (aIsUpcoming && bIsUpcoming) {
          return aEventDate.compareTo(bEventDate); // Closest upcoming first
        } else {
          return bEventDate.compareTo(aEventDate); // Latest past first
        }
      } catch (e) {
        print('Error sorting events: $e');
        return 0;
      }
    });
  }
  
  /// Check if registration is still open
  bool _isRegistrationOpen(dynamic event, DateTime now) {
    try {
      if (event.registrationDeadline == null) return true;
      
      DateTime deadline;
      if (event.registrationDeadline is DateTime) {
        deadline = event.registrationDeadline;
      } else {
        deadline = DateTime.parse(event.registrationDeadline.toString());
      }
      
      return now.isBefore(deadline);
    } catch (e) {
      return true; // Default to open if parsing fails
    }
  }
  
  /// Parse event date and time
  DateTime _parseEventDateTime(dynamic event) {
    try {
      String dateStr;
      if (event.eventDate is DateTime) {
        dateStr = event.eventDate.toIso8601String().split('T')[0];
      } else {
        dateStr = event.eventDate.toString().split('T')[0];
      }
      
      String timeStr = event.eventTime ?? '00:00';
      return DateTime.parse('${dateStr}T$timeStr');
    } catch (e) {
      // Fallback to just date if time parsing fails
      if (event.eventDate is DateTime) {
        return event.eventDate;
      } else {
        return DateTime.parse(event.eventDate.toString());
      }
    }
  }
}
