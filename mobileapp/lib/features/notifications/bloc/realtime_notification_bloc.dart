import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/services/websocket_service.dart';
import '../../../shared/models/notification_model.dart';

// Events
abstract class RealtimeNotificationEvent extends Equatable {
  const RealtimeNotificationEvent();

  @override
  List<Object?> get props => [];
}

class InitializeRealtimeNotifications extends RealtimeNotificationEvent {
  final String userId;
  final String accessToken;

  const InitializeRealtimeNotifications({
    required this.userId,
    required this.accessToken,
  });

  @override
  List<Object?> get props => [userId, accessToken];
}

class RealtimeNotificationReceived extends RealtimeNotificationEvent {
  final Map<String, dynamic> notification;

  const RealtimeNotificationReceived(this.notification);

  @override
  List<Object?> get props => [notification];
}

class RealtimeEventUpdateReceived extends RealtimeNotificationEvent {
  final Map<String, dynamic> eventUpdate;

  const RealtimeEventUpdateReceived(this.eventUpdate);

  @override
  List<Object?> get props => [eventUpdate];
}

class RealtimeRegistrationUpdateReceived extends RealtimeNotificationEvent {
  final Map<String, dynamic> registrationUpdate;

  const RealtimeRegistrationUpdateReceived(this.registrationUpdate);

  @override
  List<Object?> get props => [registrationUpdate];
}

class JoinEventRoom extends RealtimeNotificationEvent {
  final String eventId;

  const JoinEventRoom(this.eventId);

  @override
  List<Object?> get props => [eventId];
}

class LeaveEventRoom extends RealtimeNotificationEvent {
  final String eventId;

  const LeaveEventRoom(this.eventId);

  @override
  List<Object?> get props => [eventId];
}

class DisconnectRealtimeNotifications extends RealtimeNotificationEvent {}

// States
abstract class RealtimeNotificationState extends Equatable {
  const RealtimeNotificationState();

  @override
  List<Object?> get props => [];
}

class RealtimeNotificationInitial extends RealtimeNotificationState {}

class RealtimeNotificationConnected extends RealtimeNotificationState {
  final String connectionStatus;
  final List<NotificationModel> recentNotifications;
  final Map<String, dynamic>? lastEventUpdate;
  final Map<String, dynamic>? lastRegistrationUpdate;

  const RealtimeNotificationConnected({
    required this.connectionStatus,
    this.recentNotifications = const [],
    this.lastEventUpdate,
    this.lastRegistrationUpdate,
  });

  @override
  List<Object?> get props => [
        connectionStatus,
        recentNotifications,
        lastEventUpdate,
        lastRegistrationUpdate,
      ];

  RealtimeNotificationConnected copyWith({
    String? connectionStatus,
    List<NotificationModel>? recentNotifications,
    Map<String, dynamic>? lastEventUpdate,
    Map<String, dynamic>? lastRegistrationUpdate,
  }) {
    return RealtimeNotificationConnected(
      connectionStatus: connectionStatus ?? this.connectionStatus,
      recentNotifications: recentNotifications ?? this.recentNotifications,
      lastEventUpdate: lastEventUpdate ?? this.lastEventUpdate,
      lastRegistrationUpdate: lastRegistrationUpdate ?? this.lastRegistrationUpdate,
    );
  }
}

class RealtimeNotificationDisconnected extends RealtimeNotificationState {
  final String reason;

  const RealtimeNotificationDisconnected(this.reason);

  @override
  List<Object?> get props => [reason];
}

class RealtimeNotificationError extends RealtimeNotificationState {
  final String message;

  const RealtimeNotificationError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class RealtimeNotificationBloc
    extends Bloc<RealtimeNotificationEvent, RealtimeNotificationState> {
  final WebSocketService _webSocketService = WebSocketService();

  RealtimeNotificationBloc() : super(RealtimeNotificationInitial()) {
    on<InitializeRealtimeNotifications>(_onInitializeRealtimeNotifications);
    on<RealtimeNotificationReceived>(_onRealtimeNotificationReceived);
    on<RealtimeEventUpdateReceived>(_onRealtimeEventUpdateReceived);
    on<RealtimeRegistrationUpdateReceived>(_onRealtimeRegistrationUpdateReceived);
    on<JoinEventRoom>(_onJoinEventRoom);
    on<LeaveEventRoom>(_onLeaveEventRoom);
    on<DisconnectRealtimeNotifications>(_onDisconnectRealtimeNotifications);
  }

  Future<void> _onInitializeRealtimeNotifications(
    InitializeRealtimeNotifications event,
    Emitter<RealtimeNotificationState> emit,
  ) async {
    try {
      // Initialize WebSocket connection
      await _webSocketService.initialize(event.userId, event.accessToken);

      // Set up listeners
      _webSocketService.addListener('notification_received', (data) {
        add(RealtimeNotificationReceived(data['data']));
      });

      _webSocketService.addListener('event_updated', (data) {
        add(RealtimeEventUpdateReceived(data['data']));
      });

      _webSocketService.addListener('registration_updated', (data) {
        add(RealtimeRegistrationUpdateReceived(data['data']));
      });

      emit(RealtimeNotificationConnected(
        connectionStatus: _webSocketService.connectionStatus,
      ));
    } catch (e) {
      emit(RealtimeNotificationError('Failed to initialize real-time notifications: $e'));
    }
  }

  void _onRealtimeNotificationReceived(
    RealtimeNotificationReceived event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    if (state is RealtimeNotificationConnected) {
      final currentState = state as RealtimeNotificationConnected;
      
      // Convert to NotificationModel
      final notification = NotificationModel.fromJson(event.notification);
      
      // Add to recent notifications (keep only last 10)
      final updatedNotifications = [
        notification,
        ...currentState.recentNotifications,
      ].take(10).toList();

      emit(currentState.copyWith(
        recentNotifications: updatedNotifications,
      ));
    }
  }

  void _onRealtimeEventUpdateReceived(
    RealtimeEventUpdateReceived event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    if (state is RealtimeNotificationConnected) {
      final currentState = state as RealtimeNotificationConnected;
      
      emit(currentState.copyWith(
        lastEventUpdate: event.eventUpdate,
      ));
    }
  }

  void _onRealtimeRegistrationUpdateReceived(
    RealtimeRegistrationUpdateReceived event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    if (state is RealtimeNotificationConnected) {
      final currentState = state as RealtimeNotificationConnected;
      
      emit(currentState.copyWith(
        lastRegistrationUpdate: event.registrationUpdate,
      ));
    }
  }

  void _onJoinEventRoom(
    JoinEventRoom event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    _webSocketService.joinEventRoom(event.eventId);
  }

  void _onLeaveEventRoom(
    LeaveEventRoom event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    _webSocketService.leaveEventRoom(event.eventId);
  }

  void _onDisconnectRealtimeNotifications(
    DisconnectRealtimeNotifications event,
    Emitter<RealtimeNotificationState> emit,
  ) {
    _webSocketService.disconnect();
    emit(const RealtimeNotificationDisconnected('User disconnected'));
  }

  @override
  Future<void> close() {
    _webSocketService.disconnect();
    return super.close();
  }
}
