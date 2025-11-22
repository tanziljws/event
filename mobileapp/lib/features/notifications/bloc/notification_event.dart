import 'package:equatable/equatable.dart';

abstract class NotificationEvent extends Equatable {
  const NotificationEvent();

  @override
  List<Object?> get props => [];
}

/// Load notifications
class LoadNotifications extends NotificationEvent {
  final int page;
  final int limit;
  final bool forceRefresh;

  const LoadNotifications({
    this.page = 1,
    this.limit = 20,
    this.forceRefresh = false,
  });

  @override
  List<Object?> get props => [page, limit, forceRefresh];
}

/// Load unread count
class LoadUnreadCount extends NotificationEvent {
  const LoadUnreadCount();
}

/// Mark notification as read
class MarkNotificationAsRead extends NotificationEvent {
  final String notificationId;

  const MarkNotificationAsRead(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

/// Mark all notifications as read
class MarkAllNotificationsAsRead extends NotificationEvent {
  const MarkAllNotificationsAsRead();
}

/// Delete notification
class DeleteNotification extends NotificationEvent {
  final String notificationId;

  const DeleteNotification(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

/// Clear all notifications
class ClearAllNotifications extends NotificationEvent {
  const ClearAllNotifications();
}

/// Refresh notifications
class RefreshNotifications extends NotificationEvent {
  const RefreshNotifications();
}

/// Load more notifications
class LoadMoreNotifications extends NotificationEvent {
  const LoadMoreNotifications();
}

/// Filter notifications by type
class FilterNotificationsByType extends NotificationEvent {
  final String? type;

  const FilterNotificationsByType(this.type);

  @override
  List<Object?> get props => [type];
}

/// Search notifications
class SearchNotifications extends NotificationEvent {
  final String query;

  const SearchNotifications(this.query);

  @override
  List<Object?> get props => [query];
}

/// Clear search
class ClearSearch extends NotificationEvent {
  const ClearSearch();
}

/// Update notification settings
class UpdateNotificationSettings extends NotificationEvent {
  final Map<String, bool> settings;

  const UpdateNotificationSettings(this.settings);

  @override
  List<Object?> get props => [settings];
}

/// Load notification settings
class LoadNotificationSettings extends NotificationEvent {
  const LoadNotificationSettings();
}

/// Register FCM token
class RegisterFCMToken extends NotificationEvent {
  final String fcmToken;

  const RegisterFCMToken(this.fcmToken);

  @override
  List<Object?> get props => [fcmToken];
}

/// Handle push notification
class HandlePushNotification extends NotificationEvent {
  final Map<String, dynamic> data;

  const HandlePushNotification(this.data);

  @override
  List<Object?> get props => [data];
}
