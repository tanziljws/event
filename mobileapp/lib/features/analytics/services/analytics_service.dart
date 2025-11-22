import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/analytics_models.dart';

class AnalyticsService {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> getOrganizerEvents({
    int page = 1,
    int limit = 100,
    String? search,
    String? category,
    String? status,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.organizerEvents,
        queryParameters: {
          'page': page,
          'limit': limit,
          'search': search,
          'category': category,
          'status': status,
          'sortBy': sortBy,
          'sortOrder': sortOrder,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Organizer events loaded successfully',
            'events': (data['data']['events'] as List)
                .map((e) => AnalyticsEvent.fromJson(e))
                .toList(),
            'pagination': data['data']['pagination'],
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to get organizer events',
      };
    } catch (e) {
      print('Get organizer events error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  Future<Map<String, dynamic>> getAnalyticsData({
    int page = 1,
    int limit = 100,
    String? search,
    String? category,
    String? status,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      // Get organizer events
      final eventsResult = await getOrganizerEvents(
        page: page,
        limit: limit,
        search: search,
        category: category,
        status: status,
        sortBy: sortBy,
        sortOrder: sortOrder,
      );

      if (eventsResult['success'] != true) {
        return eventsResult;
      }

      final events = eventsResult['events'] as List<AnalyticsEvent>;
      final pagination = eventsResult['pagination'] as Map<String, dynamic>;

      // Generate chart data
      final chartData = _generateChartData(events);
      
      // Generate status data
      final statusData = _generateStatusData(events);

      return {
        'success': true,
        'message': 'Analytics data loaded successfully',
        'analyticsData': AnalyticsData(
          events: events,
          chartData: chartData,
          statusData: statusData,
          pagination: pagination,
        ),
      };
    } catch (e) {
      print('Get analytics data error: $e');
      return {
        'success': false,
        'message': 'Failed to load analytics data: $e',
      };
    }
  }

  List<ChartData> _generateChartData(List<AnalyticsEvent> events) {
    final now = DateTime.now();
    final last6Months = <ChartData>[];
    
    for (int i = 5; i >= 0; i--) {
      final date = DateTime(now.year, now.month - i, 1);
      final monthName = _getMonthName(date.month);
      
      final monthEvents = events.where((event) {
        final eventDate = DateTime.parse(event.createdAt);
        return eventDate.month == date.month && 
               eventDate.year == date.year;
      }).toList();
      
      final monthParticipants = monthEvents.fold<int>(
        0, 
        (sum, event) => sum + event.registrationsCount,
      );
      
      last6Months.add(ChartData(
        month: monthName,
        events: monthEvents.length,
        participants: monthParticipants,
        revenue: 0.0, // Revenue calculation can be added later
      ));
    }
    
    return last6Months;
  }

  List<EventStatusData> _generateStatusData(List<AnalyticsEvent> events) {
    final statusCounts = <String, int>{};
    
    for (final event in events) {
      // Map status berdasarkan isPublished karena tidak ada rejected
      String mappedStatus;
      if (event.isPublished) {
        mappedStatus = 'PUBLISHED';
      } else {
        mappedStatus = 'DRAFT';
      }
      statusCounts[mappedStatus] = (statusCounts[mappedStatus] ?? 0) + 1;
    }
    
    return statusCounts.entries.map((entry) {
      final status = entry.key;
      final count = entry.value;
      
      String displayName;
      String color;
      
      switch (status) {
        case 'PUBLISHED':
          displayName = 'Published';
          color = '#10B981';
          break;
        case 'DRAFT':
          displayName = 'Draft';
          color = '#6B7280';
          break;
        default:
          displayName = status;
          color = '#9CA3AF';
      }
      
      return EventStatusData(
        name: displayName,
        value: count,
        color: color,
      );
    }).toList();
  }

  String _getMonthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }

  List<String> getUniqueCategories(List<AnalyticsEvent> events) {
    return events.map((event) => event.category).toSet().toList();
  }

  List<AnalyticsEvent> filterEvents(
    List<AnalyticsEvent> events,
    AnalyticsFilters filters,
  ) {
    var filtered = events;

    // Search filter
    if (filters.searchQuery.isNotEmpty) {
      filtered = filtered.where((event) =>
        event.title.toLowerCase().contains(filters.searchQuery.toLowerCase()) ||
        event.location.toLowerCase().contains(filters.searchQuery.toLowerCase()) ||
        event.category.toLowerCase().contains(filters.searchQuery.toLowerCase())
      ).toList();
    }

    // Status filter
    if (filters.statusFilter != 'all') {
      filtered = filtered.where((event) => event.status == filters.statusFilter).toList();
    }

    // Category filter
    if (filters.categoryFilter != 'all') {
      filtered = filtered.where((event) => event.category == filters.categoryFilter).toList();
    }

    return filtered;
  }
}
