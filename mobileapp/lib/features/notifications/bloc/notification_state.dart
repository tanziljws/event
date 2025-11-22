import 'package:equatable/equatable.dart';
import '../../../shared/models/notification_model.dart';

abstract class NotificationState extends Equatable {
  const NotificationState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class NotificationInitial extends NotificationState {
  const NotificationInitial();
}

/// Loading state
class NotificationLoading extends NotificationState {
  const NotificationLoading();
}

/// Loaded state
class NotificationLoaded extends NotificationState {
  final List<NotificationModel> notifications;
  final int unreadCount;
  final bool hasMore;
  final int currentPage;
  final String? filterType;
  final String? searchQuery;
  final Map<String, bool> settings;

  const NotificationLoaded({
    required this.notifications,
    required this.unreadCount,
    required this.hasMore,
    required this.currentPage,
    this.filterType,
    this.searchQuery,
    required this.settings,
  });

  NotificationLoaded copyWith({
    List<NotificationModel>? notifications,
    int? unreadCount,
    bool? hasMore,
    int? currentPage,
    String? filterType,
    String? searchQuery,
    Map<String, bool>? settings,
  }) {
    return NotificationLoaded(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      filterType: filterType ?? this.filterType,
      searchQuery: searchQuery ?? this.searchQuery,
      settings: settings ?? this.settings,
    );
  }

  @override
  List<Object?> get props => [
        notifications,
        unreadCount,
        hasMore,
        currentPage,
        filterType,
        searchQuery,
        settings,
      ];
}

/// Failure state
class NotificationFailure extends NotificationState {
  final String message;

  const NotificationFailure(this.message);

  @override
  List<Object?> get props => [message];
}

/// Unread count loaded
class UnreadCountLoaded extends NotificationState {
  final int unreadCount;

  const UnreadCountLoaded(this.unreadCount);

  @override
  List<Object?> get props => [unreadCount];
}

/// Notification marked as read
class NotificationMarkedAsRead extends NotificationState {
  final String notificationId;

  const NotificationMarkedAsRead(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

/// All notifications marked as read
class AllNotificationsMarkedAsRead extends NotificationState {
  const AllNotificationsMarkedAsRead();
}

/// Notification deleted
class NotificationDeleted extends NotificationState {
  final String notificationId;

  const NotificationDeleted(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

/// All notifications cleared
class AllNotificationsCleared extends NotificationState {
  const AllNotificationsCleared();
}

/// Settings updated
class NotificationSettingsUpdated extends NotificationState {
  final Map<String, bool> settings;

  const NotificationSettingsUpdated(this.settings);

  @override
  List<Object?> get props => [settings];
}

/// FCM token registered
class FCMTokenRegistered extends NotificationState {
  final String fcmToken;

  const FCMTokenRegistered(this.fcmToken);

  @override
  List<Object?> get props => [fcmToken];
}

/// Push notification handled
class PushNotificationHandled extends NotificationState {
  final Map<String, dynamic> data;

  const PushNotificationHandled(this.data);

  @override
  List<Object?> get props => [data];
}
