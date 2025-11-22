import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/event_analytics_models.dart';
import '../services/event_analytics_service.dart';

// Events
abstract class EventAnalyticsEvent extends Equatable {
  const EventAnalyticsEvent();

  @override
  List<Object?> get props => [];
}

class LoadEventAnalytics extends EventAnalyticsEvent {
  final String eventId;

  const LoadEventAnalytics({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class RefreshEventAnalytics extends EventAnalyticsEvent {
  final String eventId;

  const RefreshEventAnalytics({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class LoadEventRegistrations extends EventAnalyticsEvent {
  final String eventId;

  const LoadEventRegistrations({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class LoadEventAttendance extends EventAnalyticsEvent {
  final String eventId;

  const LoadEventAttendance({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class LoadEventCheckIns extends EventAnalyticsEvent {
  final String eventId;

  const LoadEventCheckIns({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

// States
abstract class EventAnalyticsState extends Equatable {
  const EventAnalyticsState();

  @override
  List<Object?> get props => [];
}

class EventAnalyticsInitial extends EventAnalyticsState {}

class EventAnalyticsLoading extends EventAnalyticsState {}

class EventAnalyticsDataLoaded extends EventAnalyticsState {
  final EventAnalyticsData analyticsData;

  const EventAnalyticsDataLoaded({required this.analyticsData});

  @override
  List<Object?> get props => [analyticsData];
}

class EventRegistrationsLoaded extends EventAnalyticsState {
  final List<RegistrationAnalytics> registrations;

  const EventRegistrationsLoaded({required this.registrations});

  @override
  List<Object?> get props => [registrations];
}

class EventAttendanceLoaded extends EventAnalyticsState {
  final List<AttendanceAnalytics> attendance;

  const EventAttendanceLoaded({required this.attendance});

  @override
  List<Object?> get props => [attendance];
}

class EventCheckInsLoaded extends EventAnalyticsState {
  final List<CheckInAnalytics> checkIns;

  const EventCheckInsLoaded({required this.checkIns});

  @override
  List<Object?> get props => [checkIns];
}

class EventAnalyticsFailure extends EventAnalyticsState {
  final String message;
  final String? details;

  const EventAnalyticsFailure({required this.message, this.details});

  @override
  List<Object?> get props => [message, details];
}

// BLoC
class EventAnalyticsBloc extends Bloc<EventAnalyticsEvent, EventAnalyticsState> {
  final EventAnalyticsService _eventAnalyticsService = EventAnalyticsService();

  EventAnalyticsBloc() : super(EventAnalyticsInitial()) {
    on<LoadEventAnalytics>(_onLoadEventAnalytics);
    on<RefreshEventAnalytics>(_onRefreshEventAnalytics);
    on<LoadEventRegistrations>(_onLoadEventRegistrations);
    on<LoadEventAttendance>(_onLoadEventAttendance);
    on<LoadEventCheckIns>(_onLoadEventCheckIns);
  }

  Future<void> _onLoadEventAnalytics(
    LoadEventAnalytics event,
    Emitter<EventAnalyticsState> emit,
  ) async {
    emit(EventAnalyticsLoading());
    try {
      final result = await _eventAnalyticsService.getEventAnalytics(event.eventId);
      if (result['success'] == true) {
        emit(EventAnalyticsDataLoaded(analyticsData: result['analyticsData']));
      } else {
        emit(EventAnalyticsFailure(message: result['message'] ?? 'Failed to load event analytics'));
      }
    } catch (e) {
      emit(EventAnalyticsFailure(message: 'Failed to load event analytics: $e'));
    }
  }

  Future<void> _onRefreshEventAnalytics(
    RefreshEventAnalytics event,
    Emitter<EventAnalyticsState> emit,
  ) async {
    add(LoadEventAnalytics(eventId: event.eventId));
  }

  Future<void> _onLoadEventRegistrations(
    LoadEventRegistrations event,
    Emitter<EventAnalyticsState> emit,
  ) async {
    emit(EventAnalyticsLoading());
    try {
      final result = await _eventAnalyticsService.getEventRegistrations(event.eventId);
      if (result['success'] == true) {
        emit(EventRegistrationsLoaded(registrations: result['registrations']));
      } else {
        emit(EventAnalyticsFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventAnalyticsFailure(message: 'Failed to load event registrations: $e'));
    }
  }

  Future<void> _onLoadEventAttendance(
    LoadEventAttendance event,
    Emitter<EventAnalyticsState> emit,
  ) async {
    emit(EventAnalyticsLoading());
    try {
      final result = await _eventAnalyticsService.getEventAttendance(event.eventId);
      if (result['success'] == true) {
        emit(EventAttendanceLoaded(attendance: result['attendance']));
      } else {
        emit(EventAnalyticsFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventAnalyticsFailure(message: 'Failed to load event attendance: $e'));
    }
  }

  Future<void> _onLoadEventCheckIns(
    LoadEventCheckIns event,
    Emitter<EventAnalyticsState> emit,
  ) async {
    emit(EventAnalyticsLoading());
    try {
      final result = await _eventAnalyticsService.getEventCheckIns(event.eventId);
      if (result['success'] == true) {
        emit(EventCheckInsLoaded(checkIns: result['checkIns']));
      } else {
        emit(EventAnalyticsFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventAnalyticsFailure(message: 'Failed to load event check-ins: $e'));
    }
  }
}
