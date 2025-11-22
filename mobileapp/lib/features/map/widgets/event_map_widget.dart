import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../shared/models/event_model.dart';
import '../../../core/services/location_discovery_service.dart';
import '../../../core/utils/logger.dart';

class EventMapWidget extends StatefulWidget {
  final List<EventModel> events;
  final Function(EventModel)? onEventTap;
  final Function(LatLng)? onMapTap;
  final double initialZoom;
  final LatLng? initialCenter;
  final bool showCurrentLocation;
  final bool showEventMarkers;

  const EventMapWidget({
    super.key,
    required this.events,
    this.onEventTap,
    this.onMapTap,
    this.initialZoom = 13.0,
    this.initialCenter,
    this.showCurrentLocation = true,
    this.showEventMarkers = true,
  });

  @override
  State<EventMapWidget> createState() => _EventMapWidgetState();
}

class _EventMapWidgetState extends State<EventMapWidget> {
  final MapController _mapController = MapController();
  final LocationDiscoveryService _locationService = LocationDiscoveryService();
  
  LatLng? _currentLocation;
  LatLng? _mapCenter;
  double _currentZoom = 13.0;
  bool _isLoadingLocation = false;
  bool _showEventDetails = false;
  EventModel? _selectedEvent;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    if (widget.initialCenter != null) {
      _mapCenter = widget.initialCenter;
    } else if (widget.showCurrentLocation) {
      await _getCurrentLocation();
    } else {
      // Default to Jakarta if no location available
      _mapCenter = const LatLng(-6.2088, 106.8456);
    }
    
    _currentZoom = widget.initialZoom;
    
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        _currentLocation = LatLng(position.latitude, position.longitude);
        if (_mapCenter == null) {
          _mapCenter = _currentLocation;
        }
        AppLogger.info('Current location: ${_currentLocation!.latitude}, ${_currentLocation!.longitude}', 'EventMapWidget');
      }
    } catch (e) {
      AppLogger.error('Failed to get current location: $e', 'EventMapWidget');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingLocation = false;
        });
      }
    }
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    setState(() {
      _showEventDetails = false;
      _selectedEvent = null;
    });
    
    widget.onMapTap?.call(point);
  }

  void _onEventMarkerTap(EventModel event) {
    setState(() {
      _selectedEvent = event;
      _showEventDetails = true;
    });
    
    widget.onEventTap?.call(event);
  }

  void _centerOnCurrentLocation() async {
    if (_currentLocation != null) {
      _mapController.move(_currentLocation!, _currentZoom);
    } else {
      await _getCurrentLocation();
      if (_currentLocation != null) {
        _mapController.move(_currentLocation!, _currentZoom);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_mapCenter == null) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Stack(
      children: [
        // Map
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _mapCenter!,
            initialZoom: _currentZoom,
            onTap: _onMapTap,
            minZoom: 5.0,
            maxZoom: 18.0,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
          ),
          children: [
            // Tile Layer
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.nusa.eventmanagement',
              maxZoom: 18,
            ),
            
            // Current Location Marker
            if (_currentLocation != null && widget.showCurrentLocation)
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentLocation!,
                    width: 40,
                    height: 40,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.my_location,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            
            // Event Markers
            if (widget.showEventMarkers)
              MarkerLayer(
                markers: widget.events
                    .where((event) => event.latitude != null && event.longitude != null)
                    .map((event) => Marker(
                          point: LatLng(event.latitude!, event.longitude!),
                          width: 50,
                          height: 50,
                          child: GestureDetector(
                            onTap: () => _onEventMarkerTap(event),
                            child: Container(
                              decoration: BoxDecoration(
                                color: _getEventMarkerColor(event),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.3),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                _getEventMarkerIcon(event),
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ))
                    .toList(),
              ),
          ],
        ),
        
        // Loading indicator for location
        if (_isLoadingLocation)
          const Positioned(
            top: 20,
            right: 20,
            child: Card(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 8),
                    Text('Getting location...'),
                  ],
                ),
              ),
            ),
          ),
        
        // Current location button
        if (widget.showCurrentLocation)
          Positioned(
            bottom: 20,
            right: 20,
            child: FloatingActionButton(
              mini: true,
              onPressed: _centerOnCurrentLocation,
              backgroundColor: Colors.white,
              child: Icon(
                Icons.my_location,
                color: Colors.blue,
              ),
            ),
          ),
        
        // Event details card
        if (_showEventDetails && _selectedEvent != null)
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: _buildEventDetailsCard(_selectedEvent!),
          ),
      ],
    );
  }

  Widget _buildEventDetailsCard(EventModel event) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event title
            Text(
              event.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            
            const SizedBox(height: 8),
            
            // Event details
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  _formatEventDate(event.eventDate),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 4),
            
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    event.location,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            
            if (event.distance != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.navigation,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _locationService.formatDistance(event.distance!),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
            
            const SizedBox(height: 12),
            
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _showEventDetails = false;
                        _selectedEvent = null;
                      });
                    },
                    child: const Text('Close'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // Navigate to event detail
                      // This would be handled by the parent widget
                    },
                    child: const Text('View Details'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getEventMarkerColor(EventModel event) {
    // Color based on event category or status
    switch (event.category.toLowerCase()) {
      case 'technology':
        return Colors.blue;
      case 'business':
        return Colors.green;
      case 'education':
        return Colors.purple;
      case 'entertainment':
        return Colors.orange;
      case 'sports':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getEventMarkerIcon(EventModel event) {
    // Icon based on event category
    switch (event.category.toLowerCase()) {
      case 'technology':
        return Icons.computer;
      case 'business':
        return Icons.business;
      case 'education':
        return Icons.school;
      case 'entertainment':
        return Icons.music_note;
      case 'sports':
        return Icons.sports;
      default:
        return Icons.event;
    }
  }

  String _formatEventDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;
    
    if (difference == 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Tomorrow';
    } else if (difference > 1 && difference <= 7) {
      return 'In $difference days';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
