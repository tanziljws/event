import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../shared/services/auth_service.dart';
import '../../../shared/models/user_model.dart';
import '../../../core/services/auth_state_manager.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthInitialized extends AuthEvent {}

class AuthRefreshRequested extends AuthEvent {}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object> get props => [email, password];
}

class AuthRegisterParticipantRequested extends AuthEvent {
  final String fullName;
  final String email;
  final String password;
  final String? phoneNumber;
  final String? address;
  final String? lastEducation;

  const AuthRegisterParticipantRequested({
    required this.fullName,
    required this.email,
    required this.password,
    this.phoneNumber,
    this.address,
    this.lastEducation,
  });

  @override
  List<Object?> get props => [fullName, email, password, phoneNumber, address, lastEducation];
}

class AuthRegisterOrganizerRequested extends AuthEvent {
  final String fullName;
  final String email;
  final String password;
  final String organizerType;
  final Map<String, dynamic> profileData;
  final String? phoneNumber;
  final String? address;
  final String? lastEducation;

  const AuthRegisterOrganizerRequested({
    required this.fullName,
    required this.email,
    required this.password,
    required this.organizerType,
    required this.profileData,
    this.phoneNumber,
    this.address,
    this.lastEducation,
  });

  @override
  List<Object?> get props => [fullName, email, password, organizerType, profileData, phoneNumber, address, lastEducation];
}

class AuthRegisterRequested extends AuthEvent {
  final String fullName;
  final String email;
  final String password;
  final String? phone;
  final String? address;
  final String? education;
  final String role;
  final String? organizerType;
  final String? businessName;
  final String? communityName;
  final String? institutionName;
  final String? contactPerson;
  final String? website;

  const AuthRegisterRequested({
    required this.fullName,
    required this.email,
    required this.password,
    this.phone,
    this.address,
    this.education,
    required this.role,
    this.organizerType,
    this.businessName,
    this.communityName,
    this.institutionName,
    this.contactPerson,
    this.website,
  });

  @override
  List<Object?> get props => [
    fullName, email, password, phone, address, education, role, 
    organizerType, businessName, communityName, institutionName, 
    contactPerson, website
  ];
}

class AuthVerifyEmailRequested extends AuthEvent {
  final String email;
  final String otpCode;

  const AuthVerifyEmailRequested({
    required this.email,
    required this.otpCode,
  });

  @override
  List<Object> get props => [email, otpCode];
}

class AuthResendOtpRequested extends AuthEvent {
  final String email;

  const AuthResendOtpRequested({
    required this.email,
  });

  @override
  List<Object> get props => [email];
}

class AuthForgotPasswordRequested extends AuthEvent {
  final String email;

  const AuthForgotPasswordRequested({
    required this.email,
  });

  @override
  List<Object> get props => [email];
}

class AuthResetPasswordRequested extends AuthEvent {
  final String token;
  final String password;

  const AuthResetPasswordRequested({
    required this.token,
    required this.password,
  });

  @override
  List<Object> get props => [token, password];
}

class AuthLogoutRequested extends AuthEvent {}

class AuthUpdateProfileRequested extends AuthEvent {
  final Map<String, dynamic> profileData;

  const AuthUpdateProfileRequested({
    required this.profileData,
  });

  @override
  List<Object> get props => [profileData];
}

// States
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final UserModel user;
  final String accessToken;

  const AuthAuthenticated({
    required this.user,
    required this.accessToken,
  });

  @override
  List<Object> get props => [user, accessToken];
}

class AuthUnauthenticated extends AuthState {}

class AuthEmailVerificationRequired extends AuthState {
  final String email;

  const AuthEmailVerificationRequired({
    required this.email,
  });

  @override
  List<Object> get props => [email];
}

class AuthSuccess extends AuthState {
  final String message;

  const AuthSuccess({
    required this.message,
  });

  @override
  List<Object> get props => [message];
}

class AuthFailure extends AuthState {
  final String message;

  const AuthFailure({
    required this.message,
  });

  @override
  List<Object> get props => [message];
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService = AuthService();
  final AuthStateManager _authStateManager = AuthStateManager();

  AuthBloc() : super(AuthInitial()) {
    on<AuthInitialized>(_onInitialized);
    on<AuthRefreshRequested>(_onRefreshRequested);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterParticipantRequested>(_onRegisterParticipantRequested);
    on<AuthRegisterOrganizerRequested>(_onRegisterOrganizerRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthVerifyEmailRequested>(_onVerifyEmailRequested);
    on<AuthResendOtpRequested>(_onResendOtpRequested);
    on<AuthForgotPasswordRequested>(_onForgotPasswordRequested);
    on<AuthResetPasswordRequested>(_onResetPasswordRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthUpdateProfileRequested>(_onUpdateProfileRequested);
  }

  Future<void> _onInitialized(
    AuthInitialized event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      // Initialize auth state manager
      await _authStateManager.initialize();
      
      // Check if user is authenticated
      bool isAuthenticated = await _authStateManager.isAuthenticated();
      
      if (isAuthenticated && _authStateManager.currentUser != null) {
        final accessToken = await _authService.getAccessToken();
        if (accessToken != null) {
          emit(AuthAuthenticated(
            user: _authStateManager.currentUser!, 
            accessToken: accessToken
          ));
        } else {
          emit(AuthUnauthenticated());
        }
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      print('❌ AuthBloc initialization error: $e');
      // If initialization fails, clear everything and show unauthenticated
      await _authStateManager.forceLogout();
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onRefreshRequested(
    AuthRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      // Refresh user data from API
      final user = await _authStateManager.refreshUserData();
      if (user != null) {
        final accessToken = await _authService.getAccessToken();
        if (accessToken != null) {
          emit(AuthAuthenticated(user: user, accessToken: accessToken));
        } else {
          emit(AuthUnauthenticated());
        }
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      print('❌ AuthBloc refresh error: $e');
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.login(
        email: event.email,
        password: event.password,
      );
      
      if (result['success'] == true) {
        final user = result['user'] as UserModel;
        
        // Update auth state manager
        await _authStateManager.updateUserData(user);
        
        final accessToken = await _authService.getAccessToken();
        if (accessToken != null) {
          emit(AuthAuthenticated(user: user, accessToken: accessToken));
        } else {
          emit(AuthFailure(message: 'Failed to get access token'));
        }
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Login failed. Please try again.'));
    }
  }

  Future<void> _onRegisterParticipantRequested(
    AuthRegisterParticipantRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.registerParticipant(
        fullName: event.fullName,
        email: event.email,
        password: event.password,
        phoneNumber: event.phoneNumber,
        address: event.address,
        lastEducation: event.lastEducation,
      );
      
      if (result['success'] == true) {
        emit(AuthEmailVerificationRequired(email: event.email));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Registration failed. Please try again.'));
    }
  }

  Future<void> _onRegisterOrganizerRequested(
    AuthRegisterOrganizerRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.registerOrganizer(
        fullName: event.fullName,
        email: event.email,
        password: event.password,
        organizerType: event.organizerType,
        profileData: event.profileData,
        phoneNumber: event.phoneNumber,
        address: event.address,
        lastEducation: event.lastEducation,
      );
      
      if (result['success'] == true) {
        emit(AuthEmailVerificationRequired(email: event.email));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Registration failed. Please try again.'));
    }
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      if (event.role == 'PARTICIPANT') {
        final result = await _authService.registerParticipant(
          fullName: event.fullName,
          email: event.email,
          password: event.password,
          phoneNumber: event.phone,
          address: event.address,
          lastEducation: event.education,
        );
        
        if (result['success'] == true) {
          emit(AuthEmailVerificationRequired(email: event.email));
        } else {
          emit(AuthFailure(message: result['message']));
        }
      } else if (event.role == 'ORGANIZER') {
        // Prepare profile data based on organizer type
        Map<String, dynamic> profileData = {};
        
        if (event.organizerType == 'BUSINESS') {
          profileData = {
            'businessName': event.businessName,
            'contactPerson': event.contactPerson,
            'website': event.website,
          };
        } else if (event.organizerType == 'COMMUNITY') {
          profileData = {
            'communityName': event.communityName,
            'contactPerson': event.contactPerson,
            'website': event.website,
          };
        } else if (event.organizerType == 'INSTITUTION') {
          profileData = {
            'institutionName': event.institutionName,
            'contactPerson': event.contactPerson,
            'website': event.website,
          };
        }
        
        final result = await _authService.registerOrganizer(
          fullName: event.fullName,
          email: event.email,
          password: event.password,
          organizerType: event.organizerType!,
          profileData: profileData,
          phoneNumber: event.phone,
          address: event.address,
          lastEducation: event.education,
        );
        
        if (result['success'] == true) {
          emit(AuthEmailVerificationRequired(email: event.email));
        } else {
          emit(AuthFailure(message: result['message']));
        }
      } else {
        emit(AuthFailure(message: 'Invalid role selected'));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Registration failed. Please try again.'));
    }
  }

  Future<void> _onVerifyEmailRequested(
    AuthVerifyEmailRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.verifyEmail(
        email: event.email,
        otpCode: event.otpCode,
      );
      
      if (result['success'] == true) {
        emit(AuthSuccess(message: result['message']));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Email verification failed. Please try again.'));
    }
  }

  Future<void> _onResendOtpRequested(
    AuthResendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.resendOtp(
        email: event.email,
      );
      
      if (result['success'] == true) {
        emit(AuthSuccess(message: result['message']));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Failed to resend OTP. Please try again.'));
    }
  }

  Future<void> _onForgotPasswordRequested(
    AuthForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.forgotPassword(email: event.email);
      
      if (result['success'] == true) {
        emit(AuthSuccess(message: result['message']));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Failed to send reset email. Please try again.'));
    }
  }

  Future<void> _onResetPasswordRequested(
    AuthResetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.resetPassword(
        token: event.token,
        password: event.password,
      );
      
      if (result['success'] == true) {
        emit(AuthSuccess(message: result['message']));
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Password reset failed. Please try again.'));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      // Logout from auth service
      await _authService.logout();
      
      // Force logout from auth state manager
      await _authStateManager.forceLogout();
      
      emit(AuthUnauthenticated());
    } catch (e) {
      emit(AuthFailure(message: 'Logout failed. Please try again.'));
    }
  }

  Future<void> _onUpdateProfileRequested(
    AuthUpdateProfileRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final result = await _authService.updateProfile(
        profileData: event.profileData,
      );
      
      if (result['success'] == true) {
        final user = result['user'] as UserModel;
        
        // Update auth state manager
        await _authStateManager.updateUserData(user);
        
        final accessToken = await _authService.getAccessToken();
        if (accessToken != null) {
          emit(AuthAuthenticated(user: user, accessToken: accessToken));
        } else {
          emit(AuthFailure(message: 'Failed to get access token'));
        }
      } else {
        emit(AuthFailure(message: result['message']));
      }
    } catch (e) {
      emit(AuthFailure(message: 'Profile update failed. Please try again.'));
    }
  }
}

