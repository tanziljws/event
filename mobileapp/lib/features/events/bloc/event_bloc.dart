import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../shared/services/event_service.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/models/registration_model.dart';

// Events
abstract class EventEvent extends Equatable {
  const EventEvent();

  @override
  List<Object?> get props => [];
}

class EventInitialized extends EventEvent {}

class EventLoadRequested extends EventEvent {
  final int page;
  final int limit;
  final String? category;
  final String? search;
  final String? status;
  final bool? isPublished;
  final String? sortBy;
  final String? sortOrder;
  final double? latitude;
  final double? longitude;
  final double? radius;

  const EventLoadRequested({
    this.page = 1,
    this.limit = 20,
    this.category,
    this.search,
    this.status,
    this.isPublished,
    this.sortBy = 'eventDate',
    this.sortOrder = 'asc',
    this.latitude,
    this.longitude,
    this.radius,
  });

  @override
  List<Object?> get props => [page, limit, category, search, status, isPublished, sortBy, sortOrder, latitude, longitude, radius];
}

class EventLoadByIdRequested extends EventEvent {
  final String eventId;

  const EventLoadByIdRequested({
    required this.eventId,
  });

  @override
  List<Object> get props => [eventId];
}

class EventRegisterRequested extends EventEvent {
  final String eventId;

  const EventRegisterRequested({
    required this.eventId,
  });

  @override
  List<Object> get props => [eventId];
}

class EventCreateRequested extends EventEvent {
  final String title;
  final DateTime eventDate;
  final String eventTime;
  final String location;
  final String description;
  final int maxParticipants;
  final DateTime registrationDeadline;
  final String category;
  final bool isFree;
  final double? price;
  final bool generateCertificate;
  final String? thumbnailUrl;
  final List<String>? galleryUrls;
  final String? flyerUrl;
  final String? certificateTemplateUrl;

  const EventCreateRequested({
    required this.title,
    required this.eventDate,
    required this.eventTime,
    required this.location,
    required this.description,
    required this.maxParticipants,
    required this.registrationDeadline,
    required this.category,
    required this.isFree,
    this.price,
    this.generateCertificate = false,
    this.thumbnailUrl,
    this.galleryUrls,
    this.flyerUrl,
    this.certificateTemplateUrl,
  });

  @override
  List<Object?> get props => [
    title, eventDate, eventTime, location, description, maxParticipants,
    registrationDeadline, category, isFree, price, generateCertificate,
    thumbnailUrl, galleryUrls, flyerUrl, certificateTemplateUrl
  ];
}

class EventUpdateRequested extends EventEvent {
  final String eventId;
  final Map<String, dynamic> eventData;

  const EventUpdateRequested({
    required this.eventId,
    required this.eventData,
  });

  @override
  List<Object> get props => [eventId, eventData];
}

class EventPublishRequested extends EventEvent {
  final String eventId;

  const EventPublishRequested({
    required this.eventId,
  });

  @override
  List<Object> get props => [eventId];
}

class EventDeleteRequested extends EventEvent {
  final String eventId;

  const EventDeleteRequested({
    required this.eventId,
  });

  @override
  List<Object> get props => [eventId];
}

class MyEventsLoadRequested extends EventEvent {
  final int page;
  final int limit;
  final String? status;
  final String? sortBy;
  final String? sortOrder;

  const MyEventsLoadRequested({
    this.page = 1,
    this.limit = 20,
    this.status,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  @override
  List<Object?> get props => [page, limit, status, sortBy, sortOrder];
}

class MyRegistrationsLoadRequested extends EventEvent {
  final int page;
  final int limit;
  final String? status;
  final String? sortBy;
  final String? sortOrder;

  const MyRegistrationsLoadRequested({
    this.page = 1,
    this.limit = 20,
    this.status,
    this.sortBy = 'registeredAt',
    this.sortOrder = 'desc',
  });

  @override
  List<Object?> get props => [page, limit, status, sortBy, sortOrder];
}

class EventCheckInRequested extends EventEvent {
  final String registrationToken;
  final String eventId;

  const EventCheckInRequested({
    required this.registrationToken,
    required this.eventId,
  });

  @override
  List<Object> get props => [registrationToken, eventId];
}

class EventQrScanRequested extends EventEvent {
  final String qrCodeData;

  const EventQrScanRequested({
    required this.qrCodeData,
  });

  @override
  List<Object> get props => [qrCodeData];
}

class EventAttendanceLoadRequested extends EventEvent {
  final String eventId;

  const EventAttendanceLoadRequested({
    required this.eventId,
  });

  @override
  List<Object> get props => [eventId];
}

class EventImageUploadRequested extends EventEvent {
  final String filePath;
  final String eventId;
  final String type;

  const EventImageUploadRequested({
    required this.filePath,
    required this.eventId,
    required this.type,
  });

  @override
  List<Object> get props => [filePath, eventId, type];
}

// States
abstract class EventState extends Equatable {
  const EventState();

  @override
  List<Object?> get props => [];
}

class EventInitial extends EventState {}

class EventLoading extends EventState {}

class EventLoaded extends EventState {
  final List<EventModel> events;
  final Map<String, dynamic>? pagination;
  final int total;

  const EventLoaded({
    required this.events,
    this.pagination,
    required this.total,
  });

  @override
  List<Object?> get props => [events, pagination, total];
}

class EventDetailLoaded extends EventState {
  final EventModel event;

  const EventDetailLoaded({
    required this.event,
  });

  @override
  List<Object> get props => [event];
}

class MyEventsLoaded extends EventState {
  final List<EventModel> events;
  final Map<String, dynamic>? pagination;
  final int total;

  const MyEventsLoaded({
    required this.events,
    this.pagination,
    required this.total,
  });

  @override
  List<Object?> get props => [events, pagination, total];
}

class MyRegistrationsLoaded extends EventState {
  final List<RegistrationModel> registrations;
  final Map<String, dynamic>? pagination;
  final int total;

  const MyRegistrationsLoaded({
    required this.registrations,
    this.pagination,
    required this.total,
  });

  @override
  List<Object?> get props => [registrations, pagination, total];
}

class EventAttendanceLoaded extends EventState {
  final List<EventRegistration> registrations;

  const EventAttendanceLoaded({
    required this.registrations,
  });

  @override
  List<Object> get props => [registrations];
}

class EventSuccess extends EventState {
  final String message;
  final EventModel? event;
  final EventRegistration? registration;

  const EventSuccess({
    required this.message,
    this.event,
    this.registration,
  });

  @override
  List<Object?> get props => [message, event, registration];
}

class EventFailure extends EventState {
  final String message;

  const EventFailure({
    required this.message,
  });

  @override
  List<Object> get props => [message];
}

// BLoC
class EventBloc extends Bloc<EventEvent, EventState> {
  final EventService _eventService = EventService();

  EventBloc() : super(EventInitial()) {
    on<EventInitialized>(_onInitialized);
    on<EventLoadRequested>(_onLoadRequested);
    on<EventLoadByIdRequested>(_onLoadByIdRequested);
    on<EventRegisterRequested>(_onRegisterRequested);
    on<EventCreateRequested>(_onCreateRequested);
    on<EventUpdateRequested>(_onUpdateRequested);
    on<EventPublishRequested>(_onPublishRequested);
    on<EventDeleteRequested>(_onDeleteRequested);
    on<MyEventsLoadRequested>(_onMyEventsLoadRequested);
    on<MyRegistrationsLoadRequested>(_onMyRegistrationsLoadRequested);
    on<EventCheckInRequested>(_onCheckInRequested);
    on<EventQrScanRequested>(_onQrScanRequested);
    on<EventAttendanceLoadRequested>(_onAttendanceLoadRequested);
    on<EventImageUploadRequested>(_onImageUploadRequested);
  }

  Future<void> _onInitialized(
    EventInitialized event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.getEvents();
      
      if (result['success'] == true) {
        final events = result['events'] as List<EventModel>;
        emit(EventLoaded(
          events: events,
          pagination: result['pagination'],
          total: result['total'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to load events'));
    }
  }

  Future<void> _onLoadRequested(
    EventLoadRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.getEvents(
        page: event.page,
        limit: event.limit,
        category: event.category,
        search: event.search,
        status: event.status,
        isPublished: event.isPublished,
        sortBy: event.sortBy,
        sortOrder: event.sortOrder,
        latitude: event.latitude,
        longitude: event.longitude,
        radius: event.radius,
        forceRefresh: event.page == 1, // Force refresh for first page
      );
      
      if (result['success'] == true) {
        final events = result['events'] as List<EventModel>;
        emit(EventLoaded(
          events: events,
          pagination: result['pagination'],
          total: result['total'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to load events'));
    }
  }

  Future<void> _onLoadByIdRequested(
    EventLoadByIdRequested event,
    Emitter<EventState> emit,
  ) async {
    print('🔄 EventBloc: Loading event by ID: ${event.eventId}');
    emit(EventLoading());
    
    try {
      final result = await _eventService.getEventById(event.eventId);
      print('🔄 EventBloc: Service result: $result');
      
      if (result['success'] == true) {
        final eventData = result['event'] as EventModel;
        print('✅ EventBloc: Event loaded successfully: ${eventData.title}');
        emit(EventDetailLoaded(event: eventData));
      } else {
        print('❌ EventBloc: Service returned error: ${result['message']}');
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      print('❌ EventBloc: Exception occurred: $e');
      emit(EventFailure(message: 'Failed to load event details: $e'));
    }
  }

  Future<void> _onRegisterRequested(
    EventRegisterRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.registerForEvent(event.eventId);
      
      if (result['success'] == true) {
        emit(EventSuccess(
          message: result['message'],
          registration: result['registration'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to register for event'));
    }
  }

  Future<void> _onCreateRequested(
    EventCreateRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.createEvent(
        title: event.title,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        description: event.description,
        maxParticipants: event.maxParticipants,
        registrationDeadline: event.registrationDeadline,
        category: event.category,
        isFree: event.isFree,
        price: event.price,
        generateCertificate: event.generateCertificate,
        thumbnailUrl: event.thumbnailUrl,
        galleryUrls: event.galleryUrls,
        flyerUrl: event.flyerUrl,
        certificateTemplateUrl: event.certificateTemplateUrl,
      );
      
      if (result['success'] == true) {
        emit(EventSuccess(
          message: result['message'],
          event: result['event'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to create event'));
    }
  }

  Future<void> _onUpdateRequested(
    EventUpdateRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.updateEvent(
        eventId: event.eventId,
        eventData: event.eventData,
      );
      
      if (result['success'] == true) {
        emit(EventSuccess(
          message: result['message'],
          event: result['event'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to update event'));
    }
  }

  Future<void> _onPublishRequested(
    EventPublishRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.publishEvent(event.eventId);
      
      if (result['success'] == true) {
        emit(EventSuccess(message: result['message']));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to publish event'));
    }
  }

  Future<void> _onDeleteRequested(
    EventDeleteRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.deleteEvent(event.eventId);
      
      if (result['success'] == true) {
        emit(EventSuccess(message: result['message']));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to delete event'));
    }
  }

  Future<void> _onMyEventsLoadRequested(
    MyEventsLoadRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.getMyEvents(
        page: event.page,
        limit: event.limit,
        status: event.status,
        sortBy: event.sortBy,
        sortOrder: event.sortOrder,
      );
      
      if (result['success'] == true) {
        final events = result['events'] as List<EventModel>;
        emit(MyEventsLoaded(
          events: events,
          pagination: result['pagination'],
          total: result['total'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to load your events'));
    }
  }

  Future<void> _onMyRegistrationsLoadRequested(
    MyRegistrationsLoadRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.getMyRegistrations(
        page: event.page,
        limit: event.limit,
        status: event.status,
        sortBy: event.sortBy,
        sortOrder: event.sortOrder,
      );
      
      if (result['success'] == true) {
        final registrations = result['registrations'] as List<RegistrationModel>;
        emit(MyRegistrationsLoaded(
          registrations: registrations,
          pagination: result['pagination'],
          total: result['total'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to load your registrations'));
    }
  }

  Future<void> _onCheckInRequested(
    EventCheckInRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.checkInParticipant(
        registrationToken: event.registrationToken,
        eventId: event.eventId,
      );
      
      if (result['success'] == true) {
        emit(EventSuccess(message: result['message']));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to check-in participant'));
    }
  }

  Future<void> _onQrScanRequested(
    EventQrScanRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.scanQrCode(
        qrCodeData: event.qrCodeData,
      );
      
      if (result['success'] == true) {
        emit(EventSuccess(
          message: result['message'],
          registration: result['registration'],
        ));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to scan QR code'));
    }
  }

  Future<void> _onAttendanceLoadRequested(
    EventAttendanceLoadRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.getEventAttendance(event.eventId);
      
      if (result['success'] == true) {
        final registrations = result['registrations'] as List<EventRegistration>;
        emit(EventAttendanceLoaded(registrations: registrations));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to load attendance'));
    }
  }

  Future<void> _onImageUploadRequested(
    EventImageUploadRequested event,
    Emitter<EventState> emit,
  ) async {
    emit(EventLoading());
    
    try {
      final result = await _eventService.uploadEventImage(
        filePath: event.filePath,
        eventId: event.eventId,
        type: event.type,
      );
      
      if (result['success'] == true) {
        emit(EventSuccess(message: result['message']));
      } else {
        emit(EventFailure(message: result['message']));
      }
    } catch (e) {
      emit(EventFailure(message: 'Failed to upload image'));
    }
  }
}

