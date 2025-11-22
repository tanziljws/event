import '../models/notification_model.dart';
import '../../core/network/api_client.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final ApiClient _apiClient = ApiClient();

  /// Get user notifications with pagination
  Future<NotificationResponse> getUserNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
    String? type,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        if (unreadOnly) 'unreadOnly': 'true',
        if (type != null) 'type': type,
      };

      final response = await _apiClient.get(
        '/notifications',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final notifications = (data['notifications'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
        
        final pagination = data['pagination'] as Map<String, dynamic>;

        return NotificationResponse(
          notifications: notifications,
          pagination: PaginationInfo.fromJson(pagination),
        );
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get notifications');
      }
    } catch (e) {
      print('❌ API Error: $e');
      throw Exception('Failed to load notifications: $e');
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get('/notifications/unread-count');

      if (response.data['success'] == true) {
        return response.data['data']['unreadCount'] as int;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to get unread count');
      }
    } catch (e) {
      print('❌ API Error: $e');
      throw Exception('Failed to get unread count: $e');
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      final response = await _apiClient.put('/notifications/$notificationId/read');

      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to mark notification as read');
      }
    } catch (e) {
      throw Exception('Error marking notification as read: $e');
    }
  }

  /// Mark all notifications as read
  Future<int> markAllAsRead() async {
    try {
      final response = await _apiClient.put('/notifications/mark-all-read');

      if (response.data['success'] == true) {
        return response.data['data']['count'] as int;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to mark all notifications as read');
      }
    } catch (e) {
      throw Exception('Error marking all notifications as read: $e');
    }
  }

  /// Get notifications by type
  Future<List<NotificationModel>> getNotificationsByType(String type) async {
    try {
      final response = await getUserNotifications(type: type);
      return response.notifications;
    } catch (e) {
      throw Exception('Error getting notifications by type: $e');
    }
  }

  /// Get only unread notifications
  Future<List<NotificationModel>> getUnreadNotifications() async {
    try {
      final response = await getUserNotifications(unreadOnly: true);
      return response.notifications;
    } catch (e) {
      throw Exception('Error getting unread notifications: $e');
    }
  }

  /// Refresh notifications (get latest)
  Future<List<NotificationModel>> refreshNotifications() async {
    try {
      final response = await getUserNotifications(page: 1, limit: 20);
      return response.notifications;
    } catch (e) {
      throw Exception('Error refreshing notifications: $e');
    }
  }
}

/// Response model for notifications with pagination
class NotificationResponse {
  final List<NotificationModel> notifications;
  final PaginationInfo pagination;

  NotificationResponse({
    required this.notifications,
    required this.pagination,
  });
}

/// Pagination information
class PaginationInfo {
  final int page;
  final int limit;
  final int total;
  final int pages;
  final bool hasMore;

  PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
    required this.hasMore,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      pages: json['pages'] as int,
      hasMore: json['hasMore'] as bool,
    );
  }
}

