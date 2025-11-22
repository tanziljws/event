import 'package:nusa/core/network/api_client.dart';
import 'package:nusa/core/constants/api_constants.dart';
import 'package:nusa/features/organizer/models/organizer_models.dart';

class OrganizerService {
  final ApiClient _apiClient = ApiClient();

  // Get organizer dashboard data
  Future<Map<String, dynamic>> getOrganizerDashboard(String organizerId) async {
    try {
      print('🔍 DEBUG: Getting organizer dashboard for ID: $organizerId');
      
      // Get organizer events to calculate statistics
      final eventsResponse = await _apiClient.get(
        ApiConstants.organizerEvents,
        queryParameters: {
          'page': 1,
          'limit': 100, // Get all events for statistics
          'sortBy': 'createdAt',
          'sortOrder': 'desc',
        },
      );
      
      print('🔍 DEBUG: Events response status: ${eventsResponse.statusCode}');

      if (eventsResponse.statusCode == 200) {
        final data = eventsResponse.data;
        if (data['success'] == true) {
          final events = (data['data']['events'] as List)
              .map((event) => OrganizerEvent.fromJson(event))
              .toList();

          // Calculate statistics from events
          final stats = _calculateDashboardStats(events);
          
          print('🔍 DEBUG: Calculated stats - Total Events: ${stats.totalEvents}, Published: ${stats.publishedEvents}, Registrations: ${stats.totalRegistrations}, Revenue: ${stats.totalRevenue}');
          
          // Get recent events (last 5)
          final recentEvents = events.take(5).toList();

          final dashboardData = OrganizerDashboardData(
            stats: stats,
            recentEvents: recentEvents,
          );

          print('🔍 DEBUG: Dashboard data created successfully');
          return {
            'success': true,
            'data': dashboardData,
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get dashboard data',
      };
    } catch (e) {
      print('Get organizer dashboard error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Calculate dashboard statistics from events
  OrganizerDashboardStats _calculateDashboardStats(List<OrganizerEvent> events) {
    print('🔍 DEBUG: Calculating stats for ${events.length} events');
    
    int totalEvents = events.length;
    int publishedEvents = events.where((e) => e.isPublished).length;
    int totalRegistrations = events.fold(0, (sum, e) => sum + e.registrationCount);
    
    print('🔍 DEBUG: Events breakdown:');
    for (final event in events) {
      print('  - ${event.title}: published=${event.isPublished}, registrations=${event.registrationCount}, free=${event.isFree}, price=${event.price}');
    }
    
    // Calculate total revenue from paid events
    double totalRevenue = 0;
    for (final event in events) {
      if (!event.isFree && event.price != null) {
        totalRevenue += (event.price ?? 0.0) * event.registrationCount;
      }
    }

    print('🔍 DEBUG: Final stats - Total: $totalEvents, Published: $publishedEvents, Registrations: $totalRegistrations, Revenue: $totalRevenue');

    return OrganizerDashboardStats(
      totalEvents: totalEvents,
      publishedEvents: publishedEvents,
      totalRegistrations: totalRegistrations,
      totalRevenue: totalRevenue,
    );
  }

  // Get organizer events
  Future<Map<String, dynamic>> getOrganizerEvents({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? status,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (category != null && category != 'all') {
        queryParams['category'] = category;
      }
      if (status != null && status != 'all') {
        queryParams['status'] = status;
      }

      final response = await _apiClient.get(
        ApiConstants.organizerEvents,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          final events = (data['data']['events'] as List)
              .map((event) => OrganizerEvent.fromJson(event))
              .toList();

          return {
            'success': true,
            'data': {
              'events': events,
              'pagination': data['data']['pagination'],
            },
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get organizer events',
      };
    } catch (e) {
      print('Get organizer events error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Create event
  Future<Map<String, dynamic>> createEvent(Map<String, dynamic> eventData) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.events,
        data: eventData,
      );

      if (response.statusCode == 201) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event created successfully',
            'data': data['data'],
          };
        }
      }

      // Handle validation errors (400 status)
      if (response.statusCode == 400 && response.data['errors'] != null) {
        final errors = response.data['errors'] as List;
        final errorMessages = errors.map((e) => e['message'] ?? 'Validation error').join('\n');
        return {
          'success': false,
          'message': errorMessages.isNotEmpty ? errorMessages : (response.data['message'] ?? 'Validation failed'),
          'errors': errors,
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to create event',
      };
    } catch (e) {
      print('Create event error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Update event
  Future<Map<String, dynamic>> updateEvent(String eventId, Map<String, dynamic> eventData) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.events}/$eventId',
        data: eventData,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event updated successfully',
            'data': data['data'],
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to update event',
      };
    } catch (e) {
      print('Update event error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Delete event
  Future<Map<String, dynamic>> deleteEvent(String eventId) async {
    try {
      final response = await _apiClient.delete('${ApiConstants.events}/$eventId');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event deleted successfully',
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to delete event',
      };
    } catch (e) {
      print('Delete event error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Get event analytics
  Future<Map<String, dynamic>> getEventAnalytics(String eventId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.events}/$eventId/analytics');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': EventAnalytics.fromJson(data['data']),
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get event analytics',
      };
    } catch (e) {
      print('Get event analytics error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Get event attendance
  Future<Map<String, dynamic>> getEventAttendance(String eventId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.events}/$eventId/attendance');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'],
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get event attendance',
      };
    } catch (e) {
      print('Get event attendance error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Check-in participant
  Future<Map<String, dynamic>> checkInParticipant(String eventId, String qrData) async {
    try {
      final response = await _apiClient.post(
        '${ApiConstants.events}/$eventId/check-in',
        data: {'qrData': qrData},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Participant checked in successfully',
            'data': data['data'],
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to check in participant',
      };
    } catch (e) {
      print('Check-in participant error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Upload image
  Future<Map<String, dynamic>> uploadImage(dynamic file) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.uploadImage,
        data: file,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'],
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to upload image',
      };
    } catch (e) {
      print('Upload image error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Publish event
  Future<Map<String, dynamic>> publishEvent(String eventId) async {
    try {
      final response = await _apiClient.patch(
        '${ApiConstants.publishEvent}$eventId/publish',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event published successfully',
            'data': data['data'],
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to publish event',
      };
    } catch (e) {
      print('Publish event error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }
}
