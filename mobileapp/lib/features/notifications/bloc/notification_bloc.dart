import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/logger.dart';
import '../../../shared/models/notification_model.dart';
import 'notification_event.dart';
import 'notification_state.dart';

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final ApiClient _apiClient;
  final NotificationService _notificationService;

  NotificationBloc({
    required ApiClient apiClient,
    required NotificationService notificationService,
  })  : _apiClient = apiClient,
        _notificationService = notificationService,
        super(const NotificationInitial()) {
    
    on<LoadNotifications>(_onLoadNotifications);
    on<LoadUnreadCount>(_onLoadUnreadCount);
    on<MarkNotificationAsRead>(_onMarkNotificationAsRead);
    on<MarkAllNotificationsAsRead>(_onMarkAllNotificationsAsRead);
    on<DeleteNotification>(_onDeleteNotification);
    on<ClearAllNotifications>(_onClearAllNotifications);
    on<RefreshNotifications>(_onRefreshNotifications);
    on<LoadMoreNotifications>(_onLoadMoreNotifications);
    on<FilterNotificationsByType>(_onFilterNotificationsByType);
    on<SearchNotifications>(_onSearchNotifications);
    on<ClearSearch>(_onClearSearch);
    on<UpdateNotificationSettings>(_onUpdateNotificationSettings);
    on<LoadNotificationSettings>(_onLoadNotificationSettings);
    on<RegisterFCMToken>(_onRegisterFCMToken);
    on<HandlePushNotification>(_onHandlePushNotification);
  }

  Future<void> _onLoadNotifications(
    LoadNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      if (event.page == 1) {
        emit(const NotificationLoading());
      }

      AppLogger.info('Loading notifications: page ${event.page}', 'NotificationBloc');

      final response = await _apiClient.get('/notifications', queryParameters: {
        'page': event.page,
        'limit': event.limit,
        'type': event.forceRefresh ? 'refresh' : 'load',
      });

      if (response.data['success'] == true) {
        final notificationsData = response.data['data']['notifications'] as List<dynamic>;
        final notifications = notificationsData
            .map((json) => NotificationModel.fromJson(json as Map<String, dynamic>))
            .toList();

        final unreadCount = response.data['data']['unreadCount'] as int;
        final hasMore = response.data['data']['hasMore'] as bool;
        final currentPage = response.data['data']['currentPage'] as int;

        // Get current state
        final currentState = state;
        List<NotificationModel> allNotifications = notifications;

        if (currentState is NotificationLoaded && event.page > 1) {
          allNotifications = [...currentState.notifications, ...notifications];
        }

        emit(NotificationLoaded(
          notifications: allNotifications,
          unreadCount: unreadCount,
          hasMore: hasMore,
          currentPage: currentPage,
          settings: currentState is NotificationLoaded ? currentState.settings : {},
        ));

        AppLogger.info('Loaded ${notifications.length} notifications', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to load notifications'));
      }
    } catch (e) {
      AppLogger.error('Failed to load notifications: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to load notifications: $e'));
    }
  }

  Future<void> _onLoadUnreadCount(
    LoadUnreadCount event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Loading unread count', 'NotificationBloc');

      final response = await _apiClient.get('/notifications/unread-count');

      if (response.data['success'] == true) {
        final unreadCount = response.data['data']['unreadCount'] as int;
        emit(UnreadCountLoaded(unreadCount));
        AppLogger.info('Unread count: $unreadCount', 'NotificationBloc');
      } else {
        AppLogger.error('Failed to load unread count: ${response.data['message']}', 'NotificationBloc');
      }
    } catch (e) {
      AppLogger.error('Failed to load unread count: $e', 'NotificationBloc');
    }
  }

  Future<void> _onMarkNotificationAsRead(
    MarkNotificationAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Marking notification as read: ${event.notificationId}', 'NotificationBloc');

      final response = await _apiClient.patch('/notifications/${event.notificationId}/read');

      if (response.data['success'] == true) {
        emit(NotificationMarkedAsRead(event.notificationId));
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          final updatedNotifications = currentState.notifications.map((notification) {
            if (notification.id == event.notificationId) {
              return notification.copyWith(isRead: true, readAt: DateTime.now());
            }
            return notification;
          }).toList();

          final newUnreadCount = currentState.unreadCount > 0 ? currentState.unreadCount - 1 : 0;

          emit(currentState.copyWith(
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          ));
        }

        AppLogger.info('Notification marked as read successfully', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to mark notification as read'));
      }
    } catch (e) {
      AppLogger.error('Failed to mark notification as read: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to mark notification as read: $e'));
    }
  }

  Future<void> _onMarkAllNotificationsAsRead(
    MarkAllNotificationsAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Marking all notifications as read', 'NotificationBloc');

      final response = await _apiClient.patch('/notifications/mark-all-read');

      if (response.data['success'] == true) {
        emit(const AllNotificationsMarkedAsRead());
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          final updatedNotifications = currentState.notifications.map((notification) {
            return notification.copyWith(isRead: true, readAt: DateTime.now());
          }).toList();

          emit(currentState.copyWith(
            notifications: updatedNotifications,
            unreadCount: 0,
          ));
        }

        AppLogger.info('All notifications marked as read successfully', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to mark all notifications as read'));
      }
    } catch (e) {
      AppLogger.error('Failed to mark all notifications as read: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to mark all notifications as read: $e'));
    }
  }

  Future<void> _onDeleteNotification(
    DeleteNotification event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Deleting notification: ${event.notificationId}', 'NotificationBloc');

      final response = await _apiClient.delete('/notifications/${event.notificationId}');

      if (response.data['success'] == true) {
        emit(NotificationDeleted(event.notificationId));
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          final updatedNotifications = currentState.notifications
              .where((notification) => notification.id != event.notificationId)
              .toList();

          final wasUnread = currentState.notifications
              .any((notification) => notification.id == event.notificationId && !notification.isRead);
          
          final newUnreadCount = wasUnread && currentState.unreadCount > 0 
              ? currentState.unreadCount - 1 
              : currentState.unreadCount;

          emit(currentState.copyWith(
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          ));
        }

        AppLogger.info('Notification deleted successfully', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to delete notification'));
      }
    } catch (e) {
      AppLogger.error('Failed to delete notification: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to delete notification: $e'));
    }
  }

  Future<void> _onClearAllNotifications(
    ClearAllNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Clearing all notifications', 'NotificationBloc');

      final response = await _apiClient.delete('/notifications/clear-all');

      if (response.data['success'] == true) {
        emit(const AllNotificationsCleared());
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          emit(currentState.copyWith(
            notifications: [],
            unreadCount: 0,
          ));
        }

        AppLogger.info('All notifications cleared successfully', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to clear all notifications'));
      }
    } catch (e) {
      AppLogger.error('Failed to clear all notifications: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to clear all notifications: $e'));
    }
  }

  Future<void> _onRefreshNotifications(
    RefreshNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    add(const LoadNotifications(page: 1, forceRefresh: true));
  }

  Future<void> _onLoadMoreNotifications(
    LoadMoreNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is NotificationLoaded && currentState.hasMore) {
      add(LoadNotifications(page: currentState.currentPage + 1));
    }
  }

  Future<void> _onFilterNotificationsByType(
    FilterNotificationsByType event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is NotificationLoaded) {
      emit(currentState.copyWith(filterType: event.type));
      // Reload notifications with filter
      add(const LoadNotifications(page: 1, forceRefresh: true));
    }
  }

  Future<void> _onSearchNotifications(
    SearchNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is NotificationLoaded) {
      emit(currentState.copyWith(searchQuery: event.query));
      // Reload notifications with search
      add(const LoadNotifications(page: 1, forceRefresh: true));
    }
  }

  Future<void> _onClearSearch(
    ClearSearch event,
    Emitter<NotificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is NotificationLoaded) {
      emit(currentState.copyWith(searchQuery: null));
      // Reload notifications without search
      add(const LoadNotifications(page: 1, forceRefresh: true));
    }
  }

  Future<void> _onUpdateNotificationSettings(
    UpdateNotificationSettings event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Updating notification settings', 'NotificationBloc');

      final response = await _apiClient.patch('/notifications/settings', data: event.settings);

      if (response.data['success'] == true) {
        emit(NotificationSettingsUpdated(event.settings));
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          emit(currentState.copyWith(settings: event.settings));
        }

        AppLogger.info('Notification settings updated successfully', 'NotificationBloc');
      } else {
        emit(NotificationFailure(response.data['message'] ?? 'Failed to update notification settings'));
      }
    } catch (e) {
      AppLogger.error('Failed to update notification settings: $e', 'NotificationBloc');
      emit(NotificationFailure('Failed to update notification settings: $e'));
    }
  }

  Future<void> _onLoadNotificationSettings(
    LoadNotificationSettings event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Loading notification settings', 'NotificationBloc');

      final response = await _apiClient.get('/notifications/settings');

      if (response.data['success'] == true) {
        final settings = Map<String, bool>.from(response.data['data']['settings']);
        emit(NotificationSettingsUpdated(settings));
        
        // Update the current state
        final currentState = state;
        if (currentState is NotificationLoaded) {
          emit(currentState.copyWith(settings: settings));
        }

        AppLogger.info('Notification settings loaded successfully', 'NotificationBloc');
      } else {
        AppLogger.error('Failed to load notification settings: ${response.data['message']}', 'NotificationBloc');
      }
    } catch (e) {
      AppLogger.error('Failed to load notification settings: $e', 'NotificationBloc');
    }
  }

  Future<void> _onRegisterFCMToken(
    RegisterFCMToken event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Registering FCM token', 'NotificationBloc');

      final response = await _apiClient.post('/notifications/register-token', data: {
        'fcmToken': event.fcmToken,
        'platform': 'mobile',
      });

      if (response.data['success'] == true) {
        emit(FCMTokenRegistered(event.fcmToken));
        AppLogger.info('FCM token registered successfully', 'NotificationBloc');
      } else {
        AppLogger.error('Failed to register FCM token: ${response.data['message']}', 'NotificationBloc');
      }
    } catch (e) {
      AppLogger.error('Failed to register FCM token: $e', 'NotificationBloc');
    }
  }

  Future<void> _onHandlePushNotification(
    HandlePushNotification event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      AppLogger.info('Handling push notification: ${event.data}', 'NotificationBloc');
      
      emit(PushNotificationHandled(event.data));
      
      // Refresh notifications to show the new one
      add(const LoadNotifications(page: 1, forceRefresh: true));
      
      AppLogger.info('Push notification handled successfully', 'NotificationBloc');
    } catch (e) {
      AppLogger.error('Failed to handle push notification: $e', 'NotificationBloc');
    }
  }
}