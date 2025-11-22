import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../shared/services/upgrade_service.dart';
import '../../../shared/models/upgrade_model.dart';

/// Events for upgrade functionality
abstract class UpgradeEvent extends Equatable {
  const UpgradeEvent();

  @override
  List<Object?> get props => [];
}

/// Check upgrade status
class UpgradeStatusRequested extends UpgradeEvent {
  const UpgradeStatusRequested();
}

/// Upgrade user to organizer
class UpgradeRequested extends UpgradeEvent {
  final String organizerType;
  final Map<String, dynamic> profileData;

  const UpgradeRequested({
    required this.organizerType,
    required this.profileData,
  });

  @override
  List<Object?> get props => [organizerType, profileData];
}

/// Validate profile data
class UpgradeValidationRequested extends UpgradeEvent {
  final String organizerType;
  final Map<String, dynamic> profileData;

  const UpgradeValidationRequested({
    required this.organizerType,
    required this.profileData,
  });

  @override
  List<Object?> get props => [organizerType, profileData];
}

/// Reset upgrade state
class UpgradeReset extends UpgradeEvent {
  const UpgradeReset();
}

/// States for upgrade functionality
abstract class UpgradeState extends Equatable {
  const UpgradeState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class UpgradeInitial extends UpgradeState {
  const UpgradeInitial();
}

/// Loading state
class UpgradeLoading extends UpgradeState {
  const UpgradeLoading();
}

/// Status loaded state
class UpgradeStatusLoaded extends UpgradeState {
  final UpgradeStatus status;

  const UpgradeStatusLoaded({required this.status});

  @override
  List<Object?> get props => [status];
}

/// Upgrade successful state
class UpgradeSuccess extends UpgradeState {
  final UpgradeResponse response;

  const UpgradeSuccess({required this.response});

  @override
  List<Object?> get props => [response];
}

/// Validation result state
class UpgradeValidationResult extends UpgradeState {
  final UpgradeValidation validation;

  const UpgradeValidationResult({required this.validation});

  @override
  List<Object?> get props => [validation];
}

/// Error state
class UpgradeFailure extends UpgradeState {
  final String message;

  const UpgradeFailure({required this.message});

  @override
  List<Object?> get props => [message];
}

/// Bloc for upgrade functionality
class UpgradeBloc extends Bloc<UpgradeEvent, UpgradeState> {
  UpgradeBloc() : super(const UpgradeInitial()) {
    on<UpgradeStatusRequested>(_onUpgradeStatusRequested);
    on<UpgradeRequested>(_onUpgradeRequested);
    on<UpgradeValidationRequested>(_onUpgradeValidationRequested);
    on<UpgradeReset>(_onUpgradeReset);
  }

  /// Handle upgrade status request
  Future<void> _onUpgradeStatusRequested(
    UpgradeStatusRequested event,
    Emitter<UpgradeState> emit,
  ) async {
    emit(const UpgradeLoading());

    try {
      final result = await UpgradeService.getUpgradeStatus();
      
      if (result['success'] == true) {
        final status = UpgradeStatus.fromJson(result);
        emit(UpgradeStatusLoaded(status: status));
      } else {
        emit(UpgradeFailure(message: result['message'] ?? 'Failed to get upgrade status'));
      }
    } catch (e) {
      emit(UpgradeFailure(message: 'An unexpected error occurred: $e'));
    }
  }

  /// Handle upgrade request
  Future<void> _onUpgradeRequested(
    UpgradeRequested event,
    Emitter<UpgradeState> emit,
  ) async {
    emit(const UpgradeLoading());

    try {
      // Validate profile data first
      final validation = UpgradeService.validateProfileData(
        organizerType: event.organizerType,
        profileData: event.profileData,
      );

      if (!validation['isValid']) {
        emit(UpgradeFailure(
          message: 'Validation failed: ${validation['errors'].join(', ')}'
        ));
        return;
      }

      // Proceed with upgrade
      final result = await UpgradeService.upgradeToBusiness(
        organizerType: event.organizerType,
        profileData: event.profileData,
      );

      if (result['success'] == true) {
        final response = UpgradeResponse.fromJson(result);
        emit(UpgradeSuccess(response: response));
      } else {
        emit(UpgradeFailure(message: result['message'] ?? 'Upgrade failed'));
      }
    } catch (e) {
      emit(UpgradeFailure(message: 'An unexpected error occurred: $e'));
    }
  }

  /// Handle validation request
  Future<void> _onUpgradeValidationRequested(
    UpgradeValidationRequested event,
    Emitter<UpgradeState> emit,
  ) async {
    try {
      final validation = UpgradeService.validateProfileData(
        organizerType: event.organizerType,
        profileData: event.profileData,
      );

      emit(UpgradeValidationResult(
        validation: UpgradeValidation.fromJson(validation)
      ));
    } catch (e) {
      emit(UpgradeFailure(message: 'Validation error: $e'));
    }
  }

  /// Handle reset
  void _onUpgradeReset(
    UpgradeReset event,
    Emitter<UpgradeState> emit,
  ) {
    emit(const UpgradeInitial());
  }
}
