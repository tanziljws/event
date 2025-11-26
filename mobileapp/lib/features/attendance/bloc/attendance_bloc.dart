import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/attendance_models.dart';
import '../services/attendance_service.dart';

// Events
abstract class AttendanceBlocEvent extends Equatable {
  const AttendanceBlocEvent();

  @override
  List<Object?> get props => [];
}

class LoadOrganizerEvents extends AttendanceBlocEvent {
  final int page;
  final int limit;
  final String? search;
  final String? category;
  final String? status;
  final String? sortBy;
  final String? sortOrder;

  const LoadOrganizerEvents({
    this.page = 1,
    this.limit = 100,
    this.search,
    this.category,
    this.status,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  @override
  List<Object?> get props => [page, limit, search, category, status, sortBy, sortOrder];
}

class LoadEventAttendance extends AttendanceBlocEvent {
  final String eventId;

  const LoadEventAttendance({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

class CheckInParticipant extends AttendanceBlocEvent {
  final String eventId;
  final String qrCodeData;

  const CheckInParticipant({
    required this.eventId,
    required this.qrCodeData,
  });

  @override
  List<Object?> get props => [eventId, qrCodeData];
}

class DetectEventFromToken extends AttendanceBlocEvent {
  final String token;

  const DetectEventFromToken({required this.token});

  @override
  List<Object?> get props => [token];
}

// States
abstract class AttendanceState extends Equatable {
  const AttendanceState();

  @override
  List<Object?> get props => [];
}

class AttendanceInitial extends AttendanceState {}

class AttendanceLoading extends AttendanceState {}

class OrganizerEventsLoaded extends AttendanceState {
  final List<AttendanceEvent> events;
  final Map<String, dynamic> pagination;

  const OrganizerEventsLoaded({
    required this.events,
    required this.pagination,
  });

  @override
  List<Object?> get props => [events, pagination];
}

class EventAttendanceLoaded extends AttendanceState {
  final AttendanceData attendanceData;

  const EventAttendanceLoaded({required this.attendanceData});

  @override
  List<Object?> get props => [attendanceData];
}

class ParticipantCheckedIn extends AttendanceState {
  final String message;
  final Map<String, dynamic>? data;

  const ParticipantCheckedIn({
    required this.message,
    this.data,
  });

  @override
  List<Object?> get props => [message, data];
}

class EventDetected extends AttendanceState {
  final DetectedEventData detectedData;
  final String message;

  const EventDetected({
    required this.detectedData,
    required this.message,
  });

  @override
  List<Object?> get props => [detectedData, message];
}

class AttendanceSuccess extends AttendanceState {
  final String message;

  const AttendanceSuccess({required this.message});

  @override
  List<Object?> get props => [message];
}

class AttendanceFailure extends AttendanceState {
  final String message;
  final String? details;

  const AttendanceFailure({required this.message, this.details});

  @override
  List<Object?> get props => [message, details];
}

// BLoC
class AttendanceBloc extends Bloc<AttendanceBlocEvent, AttendanceState> {
  final AttendanceService _attendanceService = AttendanceService();

  AttendanceBloc() : super(AttendanceInitial()) {
    on<LoadOrganizerEvents>(_onLoadOrganizerEvents);
    on<LoadEventAttendance>(_onLoadEventAttendance);
    on<CheckInParticipant>(_onCheckInParticipant);
    on<DetectEventFromToken>(_onDetectEventFromToken);
  }

  Future<void> _onLoadOrganizerEvents(
    LoadOrganizerEvents event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());

    try {
      final result = await _attendanceService.getOrganizerEvents(
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
        emit(AttendanceFailure(message: result['message']));
      }
    } catch (e) {
      emit(AttendanceFailure(message: 'Failed to load organizer events: $e'));
    }
  }

  Future<void> _onLoadEventAttendance(
    LoadEventAttendance event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());

    try {
      final result = await _attendanceService.getEventAttendance(event.eventId);

      if (result['success'] == true) {
        emit(EventAttendanceLoaded(attendanceData: result['data']));
      } else {
        emit(AttendanceFailure(message: result['message']));
      }
    } catch (e) {
      emit(AttendanceFailure(message: 'Failed to load event attendance: $e'));
    }
  }

  Future<void> _onCheckInParticipant(
    CheckInParticipant event,
    Emitter<AttendanceState> emit,
  ) async {
    print('🔵 BLOC: Check-in participant started');
    print('🔵 BLOC: Event ID: ${event.eventId}');
    print('🔵 BLOC: QR Code Data: ${event.qrCodeData}');
    
    emit(AttendanceLoading());

    try {
      final result = await _attendanceService.checkInParticipant(
        event.eventId,
        event.qrCodeData,
      );

      print('🔵 BLOC: Check-in result: ${result['success']}');
      print('🔵 BLOC: Check-in message: ${result['message']}');
      
      if (result['success'] == true) {
        print('✅ BLOC: Check-in successful, emitting ParticipantCheckedIn');
        emit(ParticipantCheckedIn(
          message: result['message'],
          data: result['data'],
        ));
      } else {
        print('❌ BLOC: Check-in failed: ${result['message']}');
        emit(AttendanceFailure(message: result['message']));
      }
    } catch (e) {
      print('❌ BLOC: Exception during check-in: $e');
      emit(AttendanceFailure(message: 'Failed to check in participant: $e'));
    }
  }

  Future<void> _onDetectEventFromToken(
    DetectEventFromToken event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());

    try {
      print('🔍 BLOC: Starting event detection for token: ${event.token}');
      final result = await _attendanceService.detectEventFromToken(event.token);

      if (result['success'] == true) {
        print('✅ BLOC: Event detected successfully');
        print('📦 BLOC: Result data type: ${result['data'].runtimeType}');
        print('📦 BLOC: Result data: ${result['data']}');
        
        // Parse the data into DetectedEventData
        DetectedEventData detectedData;
        try {
          if (result['data'] is DetectedEventData) {
            detectedData = result['data'] as DetectedEventData;
            print('✅ BLOC: Data is already DetectedEventData');
          } else {
            detectedData = DetectedEventData.fromJson(result['data'] as Map<String, dynamic>);
            print('✅ BLOC: Data parsed from JSON');
          }
          print('📦 BLOC: Parsed detectedData: event=${detectedData.event.id}, participant=${detectedData.participant.fullName}, hasAttended=${detectedData.registration?.hasAttended}');
        } catch (e) {
          print('❌ BLOC: Error parsing DetectedEventData: $e');
          emit(AttendanceFailure(message: 'Failed to parse event data: $e'));
          return;
        }
        
        print('🚀 BLOC: Emitting EventDetected state...');
        final eventDetectedState = EventDetected(
          detectedData: detectedData,
          message: result['message'] ?? 'Event detected successfully',
        );
        print('📦 BLOC: EventDetected state object created: ${eventDetectedState.runtimeType}');
        print('📦 BLOC: EventDetected state details: event=${eventDetectedState.detectedData.event.id}, participant=${eventDetectedState.detectedData.participant.fullName}');
        print('🔍 BLOC: Current state before emit: ${state.runtimeType}');
        print('🔍 BLOC: State equality check: ${state == eventDetectedState}');
        print('🔍 BLOC: State props comparison: ${state.props} vs ${eventDetectedState.props}');
        
        // Force emit by using emit directly
        emit(eventDetectedState);
        
        print('✅ BLOC: EventDetected state emitted!');
        print('🔍 BLOC: Current state after emit: ${state.runtimeType}');
        print('🔍 BLOC: Stream state check - should be EventDetected');
      } else {
        print('❌ BLOC: Event detection failed: ${result['message']}');
        emit(AttendanceFailure(message: result['message']));
      }
    } catch (e) {
      print('❌ BLOC: Exception during event detection: $e');
      emit(AttendanceFailure(message: 'Failed to detect event from token: $e'));
    }
  }
}