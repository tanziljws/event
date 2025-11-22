import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../shared/services/registration_service.dart';
import '../../../shared/models/registration_model.dart';

// Events
abstract class RegistrationEvent extends Equatable {
  const RegistrationEvent();

  @override
  List<Object?> get props => [];
}

class RegisterForEventRequested extends RegistrationEvent {
  final String eventId;

  const RegisterForEventRequested(this.eventId);

  @override
  List<Object?> get props => [eventId];
}

class CancelRegistrationRequested extends RegistrationEvent {
  final String eventId;

  const CancelRegistrationRequested(this.eventId);

  @override
  List<Object?> get props => [eventId];
}

class CheckRegistrationStatusRequested extends RegistrationEvent {
  final String eventId;

  const CheckRegistrationStatusRequested(this.eventId);

  @override
  List<Object?> get props => [eventId];
}

// States
abstract class RegistrationState extends Equatable {
  const RegistrationState();

  @override
  List<Object?> get props => [];
}

class RegistrationInitial extends RegistrationState {}

class RegistrationLoading extends RegistrationState {}

class RegistrationSuccess extends RegistrationState {
  final String message;
  final RegistrationModel? registration;

  const RegistrationSuccess({
    required this.message,
    this.registration,
  });

  @override
  List<Object?> get props => [message, registration];
}

class RegistrationFailure extends RegistrationState {
  final String message;

  const RegistrationFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class RegistrationStatusChecked extends RegistrationState {
  final bool isRegistered;
  final RegistrationModel? registration;

  const RegistrationStatusChecked({
    required this.isRegistered,
    this.registration,
  });

  @override
  List<Object?> get props => [isRegistered, registration];
}

// BLoC
class RegistrationBloc extends Bloc<RegistrationEvent, RegistrationState> {
  RegistrationBloc() : super(RegistrationInitial()) {
    on<RegisterForEventRequested>(_onRegisterForEventRequested);
    on<CancelRegistrationRequested>(_onCancelRegistrationRequested);
    on<CheckRegistrationStatusRequested>(_onCheckRegistrationStatusRequested);
  }

  Future<void> _onRegisterForEventRequested(
    RegisterForEventRequested event,
    Emitter<RegistrationState> emit,
  ) async {
    try {
      emit(RegistrationLoading());
      
      final result = await RegistrationService.registerForEvent(event.eventId);
      
      if (result['success'] == true) {
        final registrationData = result['registration'] as Map<String, dynamic>?;
        final registration = registrationData != null 
            ? RegistrationModel.fromJson(registrationData)
            : null;
            
        emit(RegistrationSuccess(
          message: result['message'] ?? 'Registration successful',
          registration: registration,
        ));
      } else {
        emit(RegistrationFailure(
          result['message'] ?? 'Registration failed',
        ));
      }
    } catch (e) {
      emit(RegistrationFailure('Registration failed: $e'));
    }
  }

  Future<void> _onCancelRegistrationRequested(
    CancelRegistrationRequested event,
    Emitter<RegistrationState> emit,
  ) async {
    try {
      emit(RegistrationLoading());
      
      final result = await RegistrationService.cancelRegistration(event.eventId);
      
      if (result['success'] == true) {
        emit(RegistrationSuccess(
          message: result['message'] ?? 'Registration canceled',
          registration: null,
        ));
      } else {
        emit(RegistrationFailure(
          result['message'] ?? 'Failed to cancel registration',
        ));
      }
    } catch (e) {
      emit(RegistrationFailure('Failed to cancel registration: $e'));
    }
  }

  Future<void> _onCheckRegistrationStatusRequested(
    CheckRegistrationStatusRequested event,
    Emitter<RegistrationState> emit,
  ) async {
    try {
      emit(RegistrationLoading());
      
      final registration = await RegistrationService.getUserRegistrationForEvent(event.eventId);
      final isRegistered = registration != null;
      
      emit(RegistrationStatusChecked(
        isRegistered: isRegistered,
        registration: registration,
      ));
    } catch (e) {
      emit(RegistrationFailure('Failed to check registration status: $e'));
    }
  }
}
