import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/token_refresh_service.dart';
import '../../core/services/websocket_service.dart';
import '../../core/utils/logger.dart';
import '../models/user_model.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiClient _apiClient = ApiClient();
  final TokenRefreshService _tokenRefreshService = TokenRefreshService();
  UserModel? _currentUser;
  bool _isLoggedIn = false;

  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;
  
  // Get current access token
  Future<String?> getAccessToken() async {
    return await _apiClient.getAccessToken();
  }

  // Initialize service
  Future<void> initialize() async {
    await _loadUserFromStorage();
    
    // Set up token refresh callback
    ApiClient.setOnTokenRefreshed(() async {
      await refreshUserData();
    });
    
    // If user is logged in, validate token and start refresh service
    if (_isLoggedIn && _currentUser != null) {
      // Check if we have tokens first
      String? accessToken = await _apiClient.getAccessToken();
      if (accessToken != null) {
        // Try to refresh token if needed
        await _checkAndRefreshTokenIfNeeded();
        
        // Validate token after potential refresh
        bool isValidToken = await _validateTokenWithAPI();
        if (isValidToken) {
          _tokenRefreshService.startBackgroundRefresh();
          print('✅ AuthService: Initialization successful');
        } else {
          // Token is invalid, logout user
          AppLogger.warning('Token validation failed during initialization, logging out...', 'AuthService');
          await logout();
        }
      } else {
        // No tokens, logout user
        AppLogger.warning('No tokens found during initialization, logging out...', 'AuthService');
        await logout();
      }
    } else if (_isLoggedIn && _currentUser == null) {
      // User marked as logged in but no user data, try to get from API
      print('🔄 AuthService: User marked as logged in but no user data, fetching from API...');
      await _fetchUserFromAPI();
    }
  }

  // Validate token with API call
  Future<bool> _validateTokenWithAPI() async {
    try {
      print('🔍 AuthService: Validating token with API...');
      
      // Check if we have tokens first
      String? accessToken = await _apiClient.getAccessToken();
      if (accessToken == null) {
        print('❌ AuthService: No access token found');
        return false;
      }
      
      // Try to validate with API call
      final response = await _apiClient.get(ApiConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        print('🔍 AuthService: API response data structure: ${data.toString()}');
        if (data['success'] == true) {
          print('✅ AuthService: Token is valid');
          // Update user data from API response
          // Backend returns data in nested structure: data.data.user
          final userData = data['data']['user'] ?? data['data'];
          print('🔍 AuthService: Parsed userData: ${userData.toString()}');
          _currentUser = UserModel.fromJson(userData);
          await _saveUserToStorage(_currentUser!);
          print('✅ AuthService: User data updated: ${_currentUser?.fullName} (${_currentUser?.email}) - Role: ${_currentUser?.role}');
          return true;
        }
      }
      
      print('❌ AuthService: Token validation failed with status: ${response.statusCode}');
      return false;
    } catch (e) {
      print('❌ AuthService: Token validation error: $e');
      return false;
    }
  }

  // Check and refresh token if needed
  Future<void> _checkAndRefreshTokenIfNeeded() async {
    try {
      bool needsRefresh = await _apiClient.needsTokenRefresh();
      if (needsRefresh) {
        print('🔄 AuthService: Token needs refresh, refreshing...');
        bool success = await _apiClient.forceTokenRefresh();
        if (success) {
          print('✅ AuthService: Token refreshed successfully');
        } else {
          print('❌ AuthService: Token refresh failed');
        }
      }
    } catch (e) {
      print('❌ AuthService token check error: $e');
    }
  }

  // Fetch user data from API when user data is missing
  Future<void> _fetchUserFromAPI() async {
    try {
      print('🔄 AuthService: Fetching user data from API...');
      
      final response = await _apiClient.get(ApiConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        print('🔍 AuthService: _fetchUserFromAPI response: ${data.toString()}');
        if (data['success'] == true) {
          // Backend returns data in nested structure: data.data.user
          final userData = data['data']['user'] ?? data['data'];
          print('🔍 AuthService: _fetchUserFromAPI parsed userData: ${userData.toString()}');
          _currentUser = UserModel.fromJson(userData);
          _isLoggedIn = true;
          await _saveUserToStorage(_currentUser!);
          print('✅ AuthService: User data fetched and saved: ${_currentUser?.fullName} (${_currentUser?.email}) - Role: ${_currentUser?.role}');
          
          // Start background token refresh service
          _tokenRefreshService.startBackgroundRefresh();
        } else {
          print('❌ AuthService: Failed to fetch user data from API');
          await logout();
        }
      } else {
        print('❌ AuthService: API call failed with status: ${response.statusCode}');
        await logout();
      }
    } catch (e) {
      print('❌ AuthService: Error fetching user from API: $e');
      await logout();
    }
  }

  // Load user data from storage
  Future<void> _loadUserFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataString = prefs.getString('user_data');
      final isLoggedIn = prefs.getBool('is_logged_in') ?? false;
      
      print('🔍 AuthService: Loading from storage - userDataString: ${userDataString?.substring(0, userDataString.length > 100 ? 100 : userDataString.length)}...');
      print('🔍 AuthService: Loading from storage - isLoggedIn: $isLoggedIn');
      
      if (userDataString != null && isLoggedIn) {
        final userData = json.decode(userDataString);
        print('🔍 AuthService: Parsed userData: ${userData.toString()}');
        _currentUser = UserModel.fromJson(userData);
        _isLoggedIn = true;
        print('✅ AuthService: User data loaded from storage: ${_currentUser?.fullName} (${_currentUser?.email}) - Role: ${_currentUser?.role}');
      } else {
        print('⚠️ AuthService: No user data found in storage or not logged in');
        _currentUser = null;
        _isLoggedIn = false;
      }
    } catch (e) {
      print('❌ Error loading user from storage: $e');
      _currentUser = null;
      _isLoggedIn = false;
      await logout();
    }
  }

  // Save user data to storage
  Future<void> _saveUserToStorage(UserModel user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', json.encode(user.toJson()));
      await prefs.setBool('is_logged_in', true);
      await prefs.setString('user_role', user.role);
    } catch (e) {
      print('Error saving user to storage: $e');
    }
  }

  // Clear user data from storage
  Future<void> _clearUserFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');
      await prefs.setBool('is_logged_in', false);
      await prefs.remove('user_role');
    } catch (e) {
      print('Error clearing user from storage: $e');
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        
        if (data['success'] == true) {
          // Save tokens with expiry
          await _apiClient.setTokens(
            data['data']['accessToken'],
            data['data']['refreshToken'], // Include refresh token
          );
          
          // Get user data from login response
          _currentUser = UserModel.fromJson(data['data']['user']);
          _isLoggedIn = true;
          await _saveUserToStorage(_currentUser!);
          
          // Start background token refresh service
          _tokenRefreshService.startBackgroundRefresh();
          
          // Initialize WebSocket connection
          await WebSocketService().initialize(
            _currentUser!.id,
            data['data']['accessToken']
          );
          
          return {
            'success': true,
            'message': 'Login successful',
            'user': _currentUser,
          };
        }
        
        return {
          'success': false,
          'message': data['message'] ?? 'Login failed',
        };
      }
      
      return {
        'success': false,
        'message': 'Login failed. Please try again.',
      };
    } catch (e) {
      print('Login error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Register Participant
  Future<Map<String, dynamic>> registerParticipant({
    required String fullName,
    required String email,
    required String password,
    String? phoneNumber,
    String? address,
    String? lastEducation,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.register,
        data: {
          'fullName': fullName,
          'email': email,
          'password': password,
          'phoneNumber': phoneNumber,
          'address': address,
          'lastEducation': lastEducation,
        },
      );

      if (response.statusCode == 201) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Registration successful. Please check your email for verification.',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Registration failed',
      };
    } catch (e) {
      print('Register participant error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Register Organizer
  Future<Map<String, dynamic>> registerOrganizer({
    required String fullName,
    required String email,
    required String password,
    required String organizerType,
    required Map<String, dynamic> profileData,
    String? phoneNumber,
    String? address,
    String? lastEducation,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.registerOrganizer,
        data: {
          'fullName': fullName,
          'email': email,
          'password': password,
          'phoneNumber': phoneNumber,
          'address': address,
          'lastEducation': lastEducation,
          'organizerType': organizerType,
          'profileData': profileData,
        },
      );

      if (response.statusCode == 201) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Organizer registration successful. Please check your email for verification.',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Registration failed',
      };
    } catch (e) {
      print('Register organizer error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Verify Email
  Future<Map<String, dynamic>> verifyEmail({
    required String email,
    required String otpCode,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.verifyEmail,
        data: {
          'email': email,
          'otpCode': otpCode,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Email verified successfully',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Email verification failed',
      };
    } catch (e) {
      print('Verify email error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Resend OTP
  Future<Map<String, dynamic>> resendOtp({
    required String email,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.resendOtp,
        data: {
          'email': email,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'OTP sent successfully',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to resend OTP',
      };
    } catch (e) {
      print('Resend OTP error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Forgot Password
  Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.forgotPassword,
        data: {
          'email': email,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Password reset email sent',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to send reset email',
      };
    } catch (e) {
      print('Forgot password error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Reset Password
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.resetPassword,
        data: {
          'token': token,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Password reset successful',
        };
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Password reset failed',
      };
    } catch (e) {
      print('Reset password error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Get Current User
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _apiClient.get(ApiConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          // Backend returns data in nested structure: data.data.user
          final userData = data['data']['user'] ?? data['data'];
          _currentUser = UserModel.fromJson(userData);
          _isLoggedIn = true;
          await _saveUserToStorage(_currentUser!);
          
          return {
            'success': true,
            'user': _currentUser,
          };
        }
      }
      
      return {
        'success': false,
        'message': 'Failed to get user data',
      };
    } catch (e) {
      print('Get current user error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Update Profile
  Future<Map<String, dynamic>> updateProfile({
    required Map<String, dynamic> profileData,
  }) async {
    try {
      final response = await _apiClient.put(
        ApiConstants.updateProfile,
        data: profileData,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          // Backend returns data in nested structure: data.data.user
          final userData = data['data']['user'] ?? data['data'];
          _currentUser = UserModel.fromJson(userData);
          await _saveUserToStorage(_currentUser!);
          
          return {
            'success': true,
            'message': 'Profile updated successfully',
            'user': _currentUser,
          };
        }
      }
      
      return {
        'success': false,
        'message': response.data['message'] ?? 'Profile update failed',
      };
    } catch (e) {
      print('Update profile error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      // Stop background token refresh service
      _tokenRefreshService.stopBackgroundRefresh();
      
      // Disconnect WebSocket
      WebSocketService().disconnect();
      
      // Call logout API
      await _apiClient.post(ApiConstants.logout);
    } catch (e) {
      print('Logout API error: $e');
    } finally {
      // Clear local data
      _currentUser = null;
      _isLoggedIn = false;
      await _clearUserFromStorage();
      await _apiClient.clearTokens();
    }
  }

  // Check if user is logged in
  Future<bool> checkLoginStatus() async {
    await _loadUserFromStorage();
    return _isLoggedIn && _currentUser != null;
  }

  // Get user role
  String? get userRole => _currentUser?.role;

  // Check if user is organizer
  bool get isOrganizer => _currentUser?.isOrganizer ?? false;

  // Check if user is participant
  bool get isParticipant => _currentUser?.isParticipant ?? false;

  // Check if user is admin
  bool get isAdmin => _currentUser?.isAdmin ?? false;

  // Check if user is verified
  bool get isVerified => _currentUser?.isVerified ?? false;

  // Check if organizer is verified
  bool get isOrganizerVerified => _currentUser?.isOrganizerVerified ?? false;

  // Manual token validation (public method)
  Future<bool> validateToken() async {
    if (!_isLoggedIn || _currentUser == null) {
      return false;
    }
    
    return await _validateTokenWithAPI();
  }

  // Set tokens manually (for token refresh)
  Future<void> setTokens(String accessToken, String? refreshToken) async {
    await _apiClient.setTokens(accessToken, refreshToken);
    // Refresh user data after token update
    await refreshUserData();
  }

  // Refresh user data from API
  Future<void> refreshUserData() async {
    if (_isLoggedIn) {
      try {
        print('🔄 AuthService: Refreshing user data...');
        await _fetchUserFromAPI();
      } catch (e) {
        print('❌ AuthService: Error refreshing user data: $e');
      }
    }
  }

  // Force logout if token is invalid
  Future<void> forceLogoutIfInvalid() async {
    if (_isLoggedIn && _currentUser != null) {
      bool isValid = await _validateTokenWithAPI();
      if (!isValid) {
        print('🔄 Token is invalid, forcing logout...');
        await logout();
      }
    }
  }
}

