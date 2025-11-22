import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../widgets/event_map_widget.dart';
import '../widgets/radius_selector.dart';
import '../widgets/events_near_me_list.dart';
import '../../../core/services/location_discovery_service.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/models/event_model.dart';
import '../../../core/utils/logger.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> with TickerProviderStateMixin {
  final LocationDiscoveryService _locationService = LocationDiscoveryService();
  final ApiClient _apiClient = ApiClient();
  
  List<EventModel> _events = [];
  List<EventModel> _filteredEvents = [];
  bool _isLoading = false;
  String _searchQuery = '';
  double _selectedRadius = 10.0;
  bool _showEventsList = false;
  EventModel? _selectedEvent;
  
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _loadEventsNearMe();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadEventsNearMe() async {
    setState(() {
      _isLoading = true;
    });

    try {
      AppLogger.info('Loading events near me with radius: ${_selectedRadius}km', 'MapPage');
      
      final events = await _locationService.getEventsNearMe(
        radiusKm: _selectedRadius,
        limit: 50,
      );
      
      setState(() {
        _events = events;
        _filteredEvents = events;
        _isLoading = false;
      });
      
      AppLogger.info('Loaded ${events.length} events near me', 'MapPage');
    } catch (e) {
      AppLogger.error('Failed to load events near me: $e', 'MapPage');
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load events: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredEvents = _events;
      } else {
        _filteredEvents = _events.where((event) {
          return event.title.toLowerCase().contains(query.toLowerCase()) ||
                 event.location.toLowerCase().contains(query.toLowerCase()) ||
                 event.description?.toLowerCase().contains(query.toLowerCase()) == true;
        }).toList();
      }
    });
  }

  void _onRadiusChanged(double radius) {
    setState(() {
      _selectedRadius = radius;
    });
    _loadEventsNearMe();
  }

  void _onEventTap(EventModel event) {
    setState(() {
      _selectedEvent = event;
    });
    
    // Navigate to event detail
    context.go('/events/detail/${event.id}');
  }

  void _onMapTap(LatLng position) {
    setState(() {
      _selectedEvent = null;
    });
  }

  void _toggleEventsList() {
    setState(() {
      _showEventsList = !_showEventsList;
    });
    
    if (_showEventsList) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
  }

  void _refreshEvents() {
    _loadEventsNearMe();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Events Near Me',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: Container(
          margin: const EdgeInsets.only(left: 8, top: 8, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: IconButton(
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go('/home');
              }
            },
            icon: const Icon(
              Icons.arrow_back_ios_new,
              color: Colors.black87,
              size: 20,
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Map
          EventMapWidget(
            events: _filteredEvents,
            onEventTap: _onEventTap,
            onMapTap: _onMapTap,
            showCurrentLocation: true,
            showEventMarkers: true,
          ),
          
          // Top controls
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Column(
              children: [
                // Search bar (styled like home page)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextField(
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: 'Search events or location...',
                      prefixIcon: const Icon(Icons.search, color: Colors.grey),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Radius selector
                RadiusSelector(
                  selectedRadius: _selectedRadius,
                  onRadiusChanged: _onRadiusChanged,
                ),
              ],
            ),
          ),
          
          // Events list toggle button
          Positioned(
            bottom: 20,
            left: 20,
            child: FloatingActionButton(
              mini: true,
              onPressed: _toggleEventsList,
              backgroundColor: Colors.white,
              child: Icon(
                _showEventsList ? Icons.map : Icons.list,
                color: Colors.blue,
              ),
            ),
          ),
          
          // Refresh button
          Positioned(
            bottom: 20,
            right: 20,
            child: FloatingActionButton(
              mini: true,
              onPressed: _refreshEvents,
              backgroundColor: Colors.white,
              child: Icon(
                Icons.refresh,
                color: Colors.blue,
              ),
            ),
          ),
          
          // Loading indicator
          if (_isLoading)
            const Center(
              child: Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(width: 16),
                      Text('Loading events...'),
                    ],
                  ),
                ),
              ),
            ),
          
          // Events list
          if (_showEventsList)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: AnimatedBuilder(
                animation: _slideAnimation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, (1 - _slideAnimation.value) * 400),
                    child: EventsNearMeList(
                      events: _filteredEvents,
                      onEventTap: _onEventTap,
                      onClose: () {
                        setState(() {
                          _showEventsList = false;
                        });
                        _animationController.reverse();
                      },
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
