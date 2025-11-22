import 'package:flutter/material.dart';
import '../../../shared/models/event_model.dart';
import '../../../core/services/location_discovery_service.dart';
import 'event_card.dart';

/// Events near me section with location-based filtering
class EventsNearMeSection extends StatefulWidget {
  final String title;
  final String? subtitle;
  final double radiusKm;
  final int limit;

  const EventsNearMeSection({
    super.key,
    required this.title,
    this.subtitle,
    this.radiusKm = 50.0, // Increased from 10km to 50km to show more events
    this.limit = 10,
  });

  @override
  State<EventsNearMeSection> createState() => _EventsNearMeSectionState();
}

class _EventsNearMeSectionState extends State<EventsNearMeSection> {
  final LocationDiscoveryService _locationService = LocationDiscoveryService();
  List<EventModel> _events = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadEventsNearMe();
  }

  Future<void> _loadEventsNearMe() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final events = await _locationService.getEventsNearMe(
        radiusKm: widget.radiusKm,
        limit: widget.limit,
      );

      setState(() {
        _events = events;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildLoadingState();
    }

    if (_error != null) {
      return _buildErrorState();
    }

    if (_events.isEmpty) {
      return _buildEmptyState();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        widget.subtitle!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // View all button
              TextButton(
                onPressed: () {
                  // Navigate to map page
                  // context.go('/map');
                },
                child: const Text('View on Map'),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Events list
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _events.length,
            itemBuilder: (context, index) {
              final event = _events[index];
              return Container(
                width: 280,
                margin: const EdgeInsets.only(right: 16),
                child: EventCard(
                  event: event,
                  showDistance: true,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(20),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Finding events near you...'),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(20),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_off,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Unable to find events',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Please check your location settings',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadEventsNearMe,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(20),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No events nearby',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try expanding your search radius or check back later',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadEventsNearMe,
              child: const Text('Refresh'),
            ),
          ],
        ),
      ),
    );
  }
}
