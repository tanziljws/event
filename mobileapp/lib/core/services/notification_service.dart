// Temporarily disabled for location discovery testing
// This file will be re-enabled after location discovery features are tested

import '../network/api_client.dart';
import '../utils/logger.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final ApiClient _apiClient = ApiClient();
  bool _isInitialized = false;

  /// Initialize notification service
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    AppLogger.info('NotificationService: Initialization disabled for location discovery testing', 'NotificationService');
    _isInitialized = true;
  }

  /// Get FCM token
  Future<String?> getFCMToken() async {
    AppLogger.info('NotificationService: FCM token disabled for location discovery testing', 'NotificationService');
    return null;
  }

  /// Send notification to backend
  Future<void> sendNotificationToBackend({
    required String title,
    required String body,
    required String type,
    Map<String, dynamic>? data,
  }) async {
    AppLogger.info('NotificationService: Backend notification disabled for location discovery testing', 'NotificationService');
  }

  /// Show local notification
  Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    AppLogger.info('NotificationService: Local notification disabled for location discovery testing', 'NotificationService');
  }

  /// Schedule notification
  Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    AppLogger.info('NotificationService: Scheduled notification disabled for location discovery testing', 'NotificationService');
  }

  /// Cancel notification
  Future<void> cancelNotification(int id) async {
    AppLogger.info('NotificationService: Cancel notification disabled for location discovery testing', 'NotificationService');
  }

  /// Cancel all notifications
  Future<void> cancelAllNotifications() async {
    AppLogger.info('NotificationService: Cancel all notifications disabled for location discovery testing', 'NotificationService');
  }

  /// Request notification permissions
  Future<bool> requestPermissions() async {
    AppLogger.info('NotificationService: Permission request disabled for location discovery testing', 'NotificationService');
    return false;
  }

  /// Check if notifications are enabled
  Future<bool> areNotificationsEnabled() async {
    AppLogger.info('NotificationService: Notification check disabled for location discovery testing', 'NotificationService');
    return false;
  }

  /// Dispose resources
  void dispose() {
    AppLogger.info('NotificationService: Dispose disabled for location discovery testing', 'NotificationService');
  }
}

// Background message handler (disabled)
// Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
//   AppLogger.info('Handling background message: ${message.messageId}', 'NotificationService');
// }