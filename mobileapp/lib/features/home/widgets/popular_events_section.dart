import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:geolocator/geolocator.dart';

import '../../events/bloc/event_bloc.dart';
import '../../../shared/widgets/skeleton_loading.dart';

/// Popular events section widget for homepage
class PopularEventsSection extends StatefulWidget {
  final Position? userLocation;
  final bool isLoadingLocation;
  
  const PopularEventsSection({
    super.key,
    this.userLocation,
    this.isLoadingLocation = false,
  });

  @override
  State<PopularEventsSection> createState() => _PopularEventsSectionState();
}

class _PopularEventsSectionState extends State<PopularEventsSection> 
    with AutomaticKeepAliveClientMixin {
  String _selectedFilter = 'Popular'; // Default filter

  @override
  bool get wantKeepAlive => true; // Keep state alive for performance

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Popular Events',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/events'),
                child: const Text(
                  'View all',
                  style: TextStyle(
                    color: Color(0xFF1E293B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Filter Buttons
          Row(
            children: [
              Flexible(
                child: _buildFilterButton('Popular', _selectedFilter == 'Popular'),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: _buildFilterButton(
                  'Nearby', 
                  _selectedFilter == 'Nearby', 
                  isLoading: widget.isLoadingLocation,
                  hasLocation: widget.userLocation != null,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: _buildFilterButton('Latest', _selectedFilter == 'Latest'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Events List
          BlocBuilder<EventBloc, EventState>(
            builder: (context, state) {
              if (state is EventLoading) {
                return _buildLoadingEvents();
              } else if (state is EventLoaded) {
                // Apply client-side filtering for Popular and Nearby
                final filteredEvents = _applyClientSideFiltering(state.events);
                
                return SizedBox(
                  height: 280,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: filteredEvents.length,
                    itemBuilder: (context, index) {
                      final event = filteredEvents[index];
                      return _buildPopularEventCard(context, event);
                    },
                  ),
                );
              } else if (state is EventFailure) {
                return _buildErrorEvents(state.message);
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }

  // Filter Button Widget
  Widget _buildFilterButton(String title, bool isSelected, {bool isLoading = false, bool hasLocation = true}) {
    return GestureDetector(
      onTap: isLoading ? null : () => _handleFilterChange(title),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1E293B) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isSelected ? Colors.white : const Color(0xFF64748B),
                  ),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (title == 'Nearby') ...[
                    Icon(
                      hasLocation ? Icons.location_on : Icons.location_off,
                      size: 14,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    title,
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  // Handle filter change with API call
  Future<void> _handleFilterChange(String filter) async {
    setState(() {
      _selectedFilter = filter;
    });

    // Debug logging for location data
    if (filter == 'Nearby') {
      print('🔍 NEARBY FILTER: User location = ${widget.userLocation?.latitude}, ${widget.userLocation?.longitude}');
      print('🔍 NEARBY FILTER: Loading location = ${widget.isLoadingLocation}');
      
      // Show message if location is not available
      if (widget.userLocation == null && !widget.isLoadingLocation) {
        _showLocationError('Location not available. Showing latest events instead.');
      }
    }

    // Trigger API call with appropriate parameters
    if (filter == 'Nearby' && widget.userLocation != null) {
      // Get more events for better nearby + recent filtering
      context.read<EventBloc>().add(
        EventLoadRequested(
          page: 1,
          limit: 20, // Get more events for better filtering
          isPublished: true,
          sortBy: 'createdAt', // Get newest events first
          sortOrder: 'desc', // Newest first
          latitude: widget.userLocation!.latitude,
          longitude: widget.userLocation!.longitude,
          radius: 100.0, // Larger radius to get more options, then filter client-side
        ),
      );
    } else {
      // Regular API call without location parameters
      context.read<EventBloc>().add(
        EventLoadRequested(
          page: 1,
          limit: 10,
          isPublished: true,
          sortBy: _getSortBy(filter),
          sortOrder: _getSortOrder(filter),
        ),
      );
    }
  }

  // Get sort by parameter based on filter
  String _getSortBy(String filter) {
    switch (filter) {
      case 'Popular':
        return 'eventDate'; // Sort by event date for popular events
      case 'Nearby':
        return 'createdAt'; // Get newest events first, then sort by distance client-side
      case 'Latest':
        return 'createdAt'; // Sort by creation date for latest events
      default:
        return 'eventDate';
    }
  }

  // Get sort order based on filter
  String _getSortOrder(String filter) {
    switch (filter) {
      case 'Popular':
        return 'asc'; // Upcoming events first
      case 'Nearby':
        return 'desc'; // Newest first
      case 'Latest':
        return 'desc'; // Newest first
      default:
        return 'asc';
    }
  }


  // Show location error
  void _showLocationError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }
  
  // Check if registration is still open
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
  
  // Parse event date
  DateTime _parseEventDate(dynamic event) {
    try {
      if (event.eventDate is DateTime) {
        return event.eventDate;
      } else {
        return DateTime.parse(event.eventDate.toString());
      }
    } catch (e) {
      return DateTime.now().add(const Duration(days: 365)); // Far future as fallback
    }
  }
  
  // Parse created date
  DateTime _parseCreatedDate(dynamic event) {
    try {
      if (event.createdAt is DateTime) {
        return event.createdAt;
      } else {
        return DateTime.parse(event.createdAt.toString());
      }
    } catch (e) {
      return DateTime.now().subtract(const Duration(days: 365)); // Far past as fallback
    }
  }
  
  // Apply smart filtering to hide old registration closed events
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
            return false;
          }
        }
        
        // Show the event if it passes all checks
        return true;
        
      } catch (e) {
        // If parsing fails, show the event (safe fallback)
        return true;
      }
    }).toList();
  }

  // Apply client-side filtering and sorting
  List<dynamic> _applyClientSideFiltering(List<dynamic> events) {
    // First apply smart filtering to hide old events
    final filteredEvents = _applySmartFiltering(events);
    
    switch (_selectedFilter) {
      case 'Popular':
        // Show newest and upcoming events first
        final now = DateTime.now();
        return List.from(filteredEvents)
          ..sort((a, b) {
            // Check if registration is open
            bool aRegistrationOpen = _isRegistrationOpen(a, now);
            bool bRegistrationOpen = _isRegistrationOpen(b, now);
            
            // Active events come first
            if (aRegistrationOpen && !bRegistrationOpen) return -1;
            if (!aRegistrationOpen && bRegistrationOpen) return 1;
            
            // If both have same registration status, prioritize by:
            // 1. Upcoming events (closer event date)
            // 2. Recently created events
            try {
              DateTime aEventDate = _parseEventDate(a);
              DateTime bEventDate = _parseEventDate(b);
              DateTime aCreatedDate = _parseCreatedDate(a);
              DateTime bCreatedDate = _parseCreatedDate(b);
              
              bool aIsUpcoming = aEventDate.isAfter(now);
              bool bIsUpcoming = bEventDate.isAfter(now);
              
              // Both upcoming: prioritize closer event date
              if (aIsUpcoming && bIsUpcoming) {
                return aEventDate.compareTo(bEventDate); // Closer first
              }
              
              // Both past: prioritize recently created
              if (!aIsUpcoming && !bIsUpcoming) {
                return bCreatedDate.compareTo(aCreatedDate); // Newer first
              }
              
              // One upcoming, one past: upcoming first
              if (aIsUpcoming && !bIsUpcoming) return -1;
              if (!aIsUpcoming && bIsUpcoming) return 1;
              
              // Fallback: sort by created date (newest first)
              return bCreatedDate.compareTo(aCreatedDate);
            } catch (e) {
              // Fallback to registration count if date parsing fails
              final aRegistrations = a.registrationCount ?? 0;
              final bRegistrations = b.registrationCount ?? 0;
              return bRegistrations.compareTo(aRegistrations);
            }
          });
      
      case 'Nearby':
        // If user location is available, calculate distances and sort
        if (widget.userLocation != null) {
          final now = DateTime.now();
          final eventsWithDistance = List.from(filteredEvents);
          
          // Calculate distance for each event
          for (var event in eventsWithDistance) {
            if (event.latitude != null && event.longitude != null) {
              event.distance = Geolocator.distanceBetween(
                widget.userLocation!.latitude,
                widget.userLocation!.longitude,
                event.latitude!,
                event.longitude!,
              ) / 1000; // Convert to kilometers
            } else {
              event.distance = double.infinity; // Events without coordinates go to end
            }
          }
          
          // Smart sorting: prioritize active + nearby + recent events
          eventsWithDistance.sort((a, b) {
            // Check if registration is open
            bool aRegistrationOpen = _isRegistrationOpen(a, now);
            bool bRegistrationOpen = _isRegistrationOpen(b, now);
            
            // Active events come first
            if (aRegistrationOpen && !bRegistrationOpen) return -1;
            if (!aRegistrationOpen && bRegistrationOpen) return 1;
            
            // For events with same registration status
            final aDistance = a.distance ?? double.infinity;
            final bDistance = b.distance ?? double.infinity;
            
            // If both are nearby (within 25km), prioritize by creation date (newest first)
            if (aDistance <= 25 && bDistance <= 25) {
              try {
                DateTime aCreatedDate = _parseCreatedDate(a);
                DateTime bCreatedDate = _parseCreatedDate(b);
                return bCreatedDate.compareTo(aCreatedDate); // Newest first
              } catch (e) {
                return aDistance.compareTo(bDistance); // Fallback to distance
              }
            }
            
            // If one is nearby and one is far, prioritize nearby
            if (aDistance <= 25 && bDistance > 25) return -1;
            if (bDistance <= 25 && aDistance > 25) return 1;
            
            // If both are far, sort by distance
            return aDistance.compareTo(bDistance);
          });
          
          return eventsWithDistance;
        } else {
          // Fallback: show latest events if no location
          final now = DateTime.now();
          return List.from(filteredEvents)
            ..sort((a, b) {
              // Check if registration is open
              bool aRegistrationOpen = _isRegistrationOpen(a, now);
              bool bRegistrationOpen = _isRegistrationOpen(b, now);
              
              // Active events come first
              if (aRegistrationOpen && !bRegistrationOpen) return -1;
              if (!aRegistrationOpen && bRegistrationOpen) return 1;
              
              // Sort by creation date (newest first)
              try {
                DateTime aCreatedDate = _parseCreatedDate(a);
                DateTime bCreatedDate = _parseCreatedDate(b);
                return bCreatedDate.compareTo(aCreatedDate); // Newest first
              } catch (e) {
                return 0;
              }
            });
        }
      
      case 'Latest':
        // Sort by creation date (newest first) and prioritize active events
        final now = DateTime.now();
        return List.from(filteredEvents)
          ..sort((a, b) {
            // Check if registration is open
            bool aRegistrationOpen = _isRegistrationOpen(a, now);
            bool bRegistrationOpen = _isRegistrationOpen(b, now);
            
            // Active events come first
            if (aRegistrationOpen && !bRegistrationOpen) return -1;
            if (!aRegistrationOpen && bRegistrationOpen) return 1;
            
            // Sort by creation date (newest first)
            try {
              DateTime aCreatedDate = _parseCreatedDate(a);
              DateTime bCreatedDate = _parseCreatedDate(b);
              return bCreatedDate.compareTo(aCreatedDate); // Newest first
            } catch (e) {
              return 0;
            }
          });
      
      default:
        return filteredEvents;
    }
  }



  // Popular Event Card with Image Overlay
  Widget _buildPopularEventCard(BuildContext context, dynamic event) {
    return Container(
      width: 200,
      height: 280,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.go('/events/detail/${event.id}'),
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              // Event Image
              if (event.thumbnailUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: CachedNetworkImage(
                    imageUrl: event.thumbnailUrl,
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: const Color(0xFFF1F5F9),
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.event, color: Color(0xFF94A3B8), size: 48),
                    ),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Icon(Icons.event, color: Color(0xFF94A3B8), size: 48),
                  ),
                ),
              
              // Dark Overlay
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.black.withValues(alpha: 0.7),
                ),
              ),
              
              // Registration Closed Badge Overlay
              if (!_isRegistrationOpen(event, DateTime.now()))
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade600,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.event_busy,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Registration Closed',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              
              // Event Info Overlay
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          Shadow(
                            offset: Offset(1, 1),
                            blurRadius: 2,
                            color: Colors.black54,
                          ),
                        ],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            event.location,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              shadows: [
                                Shadow(
                                  offset: Offset(1, 1),
                                  blurRadius: 2,
                                  color: Colors.black54,
                                ),
                              ],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    
                    // Show distance for nearby events
                    if (_selectedFilter == 'Nearby' && event.distance != null && event.distance != double.infinity) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.near_me,
                            color: Colors.white70,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${event.distance!.toStringAsFixed(1)} km away',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.w400,
                              shadows: [
                                Shadow(
                                  offset: Offset(1, 1),
                                  blurRadius: 2,
                                  color: Colors.black54,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Loading Events
  Widget _buildLoadingEvents() {
    return SizedBox(
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        itemBuilder: (context, index) {
          return Container(
            width: 200,
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03), // Lighter shadow
                  blurRadius: 6, // Reduced blur
                  offset: const Offset(0, 1), // Reduced offset
                ),
              ],
            ),
            child: SkeletonLoading.shimmer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image skeleton
                  Container(
                    height: 120,
                    decoration: const BoxDecoration(
                      color: Colors.grey,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title skeleton
                        Container(
                          height: 16,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Subtitle skeleton
                        Container(
                          height: 14,
                          width: 120,
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Date skeleton
                        Container(
                          height: 12,
                          width: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Error Events
  Widget _buildErrorEvents(String message) {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03), // Lighter shadow
            blurRadius: 6, // Reduced blur
            offset: const Offset(0, 1), // Reduced offset
          ),
        ],
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(50),
              ),
              child: const Icon(
                Icons.error_outline,
                size: 48,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Gagal memuat event',
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
