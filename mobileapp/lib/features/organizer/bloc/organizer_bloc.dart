import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../models/organizer_models.dart';
import '../services/organizer_service.dart';

// Events
abstract class OrganizerBlocEvent extends Equatable {
  const OrganizerBlocEvent();

  @override
  List<Object?> get props => [];
}

class LoadOrganizerDashboard extends OrganizerBlocEvent {
  final String organizerId;

  const LoadOrganizerDashboard({required this.organizerId});

  @override
  List<Object?> get props => [organizerId];
}

class LoadOrganizerEvents extends OrganizerBlocEvent {
  final int page;
  final int limit;
  final String? search;
  final String? category;
  final String? status;
  final String sortBy;
  final String sortOrder;

  const LoadOrganizerEvents({
    this.page = 1,
    this.limit = 10,
    this.search,
    this.category,
    this.status,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  @override
  List<Object?> get props => [page, limit, search, category, status, sortBy, sortOrder];
}

class CreateOrganizerEvent extends OrganizerBlocEvent {
  final Map<String, dynamic> eventData;

  const CreateOrganizerEvent({required this.eventData});

  @override
  List<Object?> get props => [eventData];
}

class UpdateOrganizerEvent extends OrganizerBlocEvent {
  final String eventId;
  final Map<String, dynamic> eventData;

  const UpdateOrganizerEvent({
    required this.eventId,
    required this.eventData,
  });

  @override
  List<Object?> get props => [eventId, eventData];
}

class DeleteOrganizerEvent extends OrganizerBlocEvent {
  final String eventId;

  const DeleteOrganizerEvent({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class PublishOrganizerEvent extends OrganizerBlocEvent {
  final String eventId;

  const PublishOrganizerEvent({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class LoadEventAnalytics extends OrganizerBlocEvent {
  final String eventId;

  const LoadEventAnalytics({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class LoadEventAttendance extends OrganizerBlocEvent {
  final String eventId;

  const LoadEventAttendance({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class CheckInParticipant extends OrganizerBlocEvent {
  final String eventId;
  final String qrData;

  const CheckInParticipant({
    required this.eventId,
    required this.qrData,
  });

  @override
  List<Object?> get props => [eventId, qrData];
}

// States
abstract class OrganizerState extends Equatable {
  const OrganizerState();

  @override
  List<Object?> get props => [];
}

class OrganizerInitial extends OrganizerState {}

class OrganizerLoading extends OrganizerState {}

class OrganizerDashboardLoaded extends OrganizerState {
  final OrganizerDashboardData dashboardData;

  const OrganizerDashboardLoaded({required this.dashboardData});

  @override
  List<Object?> get props => [dashboardData];
}

class OrganizerEventsLoaded extends OrganizerState {
  final List<OrganizerEvent> events;
  final Map<String, dynamic> pagination;

  const OrganizerEventsLoaded({
    required this.events,
    required this.pagination,
  });

  @override
  List<Object?> get props => [events, pagination];
}

class EventAnalyticsLoaded extends OrganizerState {
  final EventAnalytics analytics;

  const EventAnalyticsLoaded({required this.analytics});

  @override
  List<Object?> get props => [analytics];
}

class EventAttendanceLoaded extends OrganizerState {
  final Map<String, dynamic> attendanceData;

  const EventAttendanceLoaded({required this.attendanceData});

  @override
  List<Object?> get props => [attendanceData];
}

class OrganizerSuccess extends OrganizerState {
  final String message;

  const OrganizerSuccess({required this.message});

  @override
  List<Object?> get props => [message];
}

class OrganizerEventPublished extends OrganizerState {
  final String eventId;
  final String message;

  const OrganizerEventPublished({
    required this.eventId,
    required this.message,
  });

  @override
  List<Object?> get props => [eventId, message];
}

class OrganizerFailure extends OrganizerState {
  final String message;

  const OrganizerFailure({required this.message});

  @override
  List<Object?> get props => [message];
}

// Bloc
class OrganizerBloc extends Bloc<OrganizerBlocEvent, OrganizerState> {
  final OrganizerService _organizerService;

  OrganizerBloc({required OrganizerService organizerService})
      : _organizerService = organizerService,
        super(OrganizerInitial()) {
    
    on<LoadOrganizerDashboard>(_onLoadDashboard);
    on<LoadOrganizerEvents>(_onLoadEvents);
    on<CreateOrganizerEvent>(_onCreateEvent);
    on<UpdateOrganizerEvent>(_onUpdateEvent);
    on<DeleteOrganizerEvent>(_onDeleteEvent);
    on<PublishOrganizerEvent>(_onPublishEvent);
    on<LoadEventAnalytics>(_onLoadAnalytics);
    on<LoadEventAttendance>(_onLoadAttendance);
    on<CheckInParticipant>(_onCheckInParticipant);
  }

  Future<void> _onLoadDashboard(
    LoadOrganizerDashboard event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.getOrganizerDashboard(event.organizerId);
      
      if (result['success'] == true) {
        emit(OrganizerDashboardLoaded(dashboardData: result['data']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to load dashboard: $e'));
    }
  }

  Future<void> _onLoadEvents(
    LoadOrganizerEvents event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.getOrganizerEvents(
        page: event.page,
        limit: event.limit,
        search: event.search,
        category: event.category,
        status: event.status,
        sortBy: event.sortBy,
        sortOrder: event.sortOrder,
      );
      
      if (result['success'] == true) {
        emit(OrganizerEventsLoaded(
          events: result['data']['events'],
          pagination: result['data']['pagination'],
        ));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to load events: $e'));
    }
  }

  Future<void> _onCreateEvent(
    CreateOrganizerEvent event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.createEvent(event.eventData);
      
      if (result['success'] == true) {
        emit(OrganizerSuccess(message: result['message']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to create event: $e'));
    }
  }

  Future<void> _onUpdateEvent(
    UpdateOrganizerEvent event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.updateEvent(event.eventId, event.eventData);
      
      if (result['success'] == true) {
        emit(OrganizerSuccess(message: result['message']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to update event: $e'));
    }
  }

  Future<void> _onDeleteEvent(
    DeleteOrganizerEvent event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.deleteEvent(event.eventId);
      
      if (result['success'] == true) {
        emit(OrganizerSuccess(message: result['message']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to delete event: $e'));
    }
  }

  Future<void> _onPublishEvent(
    PublishOrganizerEvent event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.publishEvent(event.eventId);
      
      if (result['success'] == true) {
        emit(OrganizerEventPublished(
          eventId: event.eventId,
          message: result['message'] ?? 'Event published successfully',
        ));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to publish event: $e'));
    }
  }

  Future<void> _onLoadAnalytics(
    LoadEventAnalytics event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.getEventAnalytics(event.eventId);
      
      if (result['success'] == true) {
        emit(EventAnalyticsLoaded(analytics: result['data']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to load analytics: $e'));
    }
  }

  Future<void> _onLoadAttendance(
    LoadEventAttendance event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.getEventAttendance(event.eventId);
      
      if (result['success'] == true) {
        emit(EventAttendanceLoaded(attendanceData: result['data']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to load attendance: $e'));
    }
  }

  Future<void> _onCheckInParticipant(
    CheckInParticipant event,
    Emitter<OrganizerState> emit,
  ) async {
    emit(OrganizerLoading());
    
    try {
      final result = await _organizerService.checkInParticipant(event.eventId, event.qrData);
      
      if (result['success'] == true) {
        emit(OrganizerSuccess(message: result['message']));
      } else {
        emit(OrganizerFailure(message: result['message']));
      }
    } catch (e) {
      emit(OrganizerFailure(message: 'Failed to check in participant: $e'));
    }
  }
}
