import 'package:shared_preferences/shared_preferences.dart';
import '../models/event_model.dart';
import '../../core/network/api_client.dart';

class SearchService {
  final ApiClient _apiClient = ApiClient();

  /// Search events with query and filters
  Future<Map<String, dynamic>> searchEvents({
    required String query,
    String? category,
    String? priceRange,
    DateTime? startDate,
    DateTime? endDate,
    String? location,
    bool? isFree,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'search': query,
        'page': page,
        'limit': limit,
        'isPublished': true,
      };

      // Add filters if provided
      if (category != null && category.isNotEmpty && category != 'All') {
        queryParams['category'] = category;
      }
      
      if (priceRange != null && priceRange.isNotEmpty && priceRange != 'All') {
        if (priceRange == 'free') {
          queryParams['isFree'] = true;
        } else if (priceRange == 'paid') {
          queryParams['isFree'] = false;
        }
      }
      
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      
      if (location != null && location.isNotEmpty && location != 'All') {
        queryParams['location'] = location;
      }

      print('🔍 Search params: $queryParams');

      final response = await _apiClient.get('/events', queryParameters: queryParams);
      
      if (response.data['success'] == true) {
        final eventsData = response.data['data']['events'] as List<dynamic>? ?? [];
        final events = eventsData
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();

        print('✅ Found ${events.length} events');

        return {
          'success': true,
          'events': events,
          'pagination': response.data['data']['pagination'],
          'totalResults': response.data['data']['pagination']['total'] ?? 0,
        };
      } else {
        print('❌ API returned error: ${response.data}');
        // Fallback to mock data for testing
        final mockEvents = _getMockEvents(query, category, priceRange, location);
        return {
          'success': true,
          'events': mockEvents,
          'pagination': {'total': mockEvents.length, 'page': 1, 'pages': 1},
          'totalResults': mockEvents.length,
        };
      }
    } catch (e) {
      print('❌ Search error: $e');
      // Fallback to mock data for testing
      final mockEvents = _getMockEvents(query, category, priceRange, location);
      return {
        'success': true,
        'events': mockEvents,
        'pagination': {'total': mockEvents.length, 'page': 1, 'pages': 1},
        'totalResults': mockEvents.length,
      };
    }
  }

  List<EventModel> _getMockEvents(String query, String? category, String? priceRange, String? location) {
    final allMockEvents = [
      EventModel(
        id: '1',
        title: 'Tech Conference 2025',
        description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing.',
        eventDate: DateTime.now().add(const Duration(days: 30)),
        eventTime: '09:00',
        location: 'Jakarta Convention Center',
        thumbnailUrl: 'https://example.com/tech-conference.jpg',
        galleryUrls: ['https://example.com/gallery1.jpg'],
        maxParticipants: 500,
        registrationDeadline: DateTime.now().add(const Duration(days: 25)),
        isPublished: true,
        generateCertificate: true,
        isPrivate: false,
        hasMultipleTicketTypes: false,
        status: 'APPROVED',
        category: 'TECHNOLOGY',
        price: 150000,
        isFree: false,
        platformFee: 15,
        createdBy: 'organizer1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      EventModel(
        id: '2',
        title: 'Flutter Workshop',
        description: 'Learn Flutter development from basics to advanced concepts.',
        eventDate: DateTime.now().add(const Duration(days: 15)),
        eventTime: '14:00',
        location: 'Bandung Tech Hub',
        thumbnailUrl: 'https://example.com/flutter-workshop.jpg',
        galleryUrls: ['https://example.com/gallery2.jpg'],
        maxParticipants: 50,
        registrationDeadline: DateTime.now().add(const Duration(days: 10)),
        isPublished: true,
        generateCertificate: true,
        isPrivate: false,
        hasMultipleTicketTypes: false,
        status: 'APPROVED',
        category: 'TECHNOLOGY',
        price: 0,
        isFree: true,
        platformFee: 15,
        createdBy: 'organizer2',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      EventModel(
        id: '3',
        title: 'Music Festival Jakarta',
        description: 'The biggest music festival in Jakarta featuring international artists.',
        eventDate: DateTime.now().add(const Duration(days: 45)),
        eventTime: '18:00',
        location: 'Jakarta International Stadium',
        thumbnailUrl: 'https://example.com/music-festival.jpg',
        galleryUrls: ['https://example.com/gallery3.jpg'],
        maxParticipants: 10000,
        registrationDeadline: DateTime.now().add(const Duration(days: 40)),
        isPublished: true,
        generateCertificate: false,
        isPrivate: false,
        hasMultipleTicketTypes: false,
        status: 'APPROVED',
        category: 'ENTERTAINMENT',
        price: 250000,
        isFree: false,
        platformFee: 15,
        createdBy: 'organizer3',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    // Apply filters
    var filteredEvents = allMockEvents.where((event) {
      // Category filter
      if (category != null && category != 'All') {
        if (event.category.toLowerCase() != category.toLowerCase()) {
          return false;
        }
      }
      
      // Price filter
      if (priceRange != null && priceRange != 'All') {
        if (priceRange == 'free' && !event.isFree) {
          return false;
        } else if (priceRange == 'paid' && event.isFree) {
          return false;
        }
      }
      
      // Location filter
      if (location != null && location != 'All') {
        if (location == 'Online') {
          if (!event.location.toLowerCase().contains('online')) {
            return false;
          }
        } else {
          if (!event.location.toLowerCase().contains(location.toLowerCase())) {
            return false;
          }
        }
      }
      
      return true;
    }).toList();

    // Filter based on query
    if (query.isNotEmpty) {
      filteredEvents = filteredEvents.where((event) => 
        event.title.toLowerCase().contains(query.toLowerCase()) ||
        event.description?.toLowerCase().contains(query.toLowerCase()) == true ||
        event.location.toLowerCase().contains(query.toLowerCase()) ||
        event.category.toLowerCase().contains(query.toLowerCase()) == true
      ).toList();
    }

    return filteredEvents.cast<EventModel>();
  }

  /// Get popular search suggestions
  Future<List<String>> getPopularSearches() async {
    try {
      // Mock popular searches - in real app, this would come from API
      return [
        'Tech Conference',
        'Music Festival',
        'Workshop',
        'Seminar',
        'Networking',
        'Free Events',
        'Jakarta',
        'Bandung',
        'Surabaya',
        'Online Events',
      ];
    } catch (e) {
      return [];
    }
  }

  /// Get recent searches from local storage
  Future<List<String>> getRecentSearches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recentSearches = prefs.getStringList('recent_searches') ?? [];
      return recentSearches;
    } catch (e) {
      return [];
    }
  }

  /// Save search to recent searches
  Future<void> saveRecentSearch(String query) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> recentSearches = prefs.getStringList('recent_searches') ?? [];
      
      // Remove if already exists to avoid duplicates
      recentSearches.remove(query);
      
      // Add to beginning
      recentSearches.insert(0, query);
      
      // Keep only last 10 searches
      if (recentSearches.length > 10) {
        recentSearches = recentSearches.take(10).toList();
      }
      
      await prefs.setStringList('recent_searches', recentSearches);
    } catch (e) {
      // Ignore errors
    }
  }

  /// Clear all recent searches
  Future<void> clearRecentSearches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('recent_searches');
    } catch (e) {
      // Ignore errors
    }
  }

  /// Get search suggestions based on partial query
  Future<List<String>> getSearchSuggestions(String query) async {
    try {
      if (query.length < 2) return [];

      // Mock suggestions - in real app, this would come from API
      final allSuggestions = [
        'Tech Conference 2025',
        'Music Festival Jakarta',
        'Flutter Workshop',
        'Design Thinking Seminar',
        'Networking Event',
        'Startup Pitch Competition',
        'AI Conference',
        'Blockchain Workshop',
        'UX Design Bootcamp',
        'Digital Marketing Seminar',
      ];

      return allSuggestions
          .where((suggestion) => 
              suggestion.toLowerCase().contains(query.toLowerCase()))
          .take(5)
          .toList();
    } catch (e) {
      return [];
    }
  }
}
