import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../network/api_client.dart';
import '../constants/api_constants.dart';
import '../../shared/models/user_model.dart';
import '../../shared/services/auth_service.dart';

class AuthStateManager {
  static final AuthStateManager _instance = AuthStateManager._internal();
  factory AuthStateManager() => _instance;
  AuthStateManager._internal();

  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();
  
  UserModel? _currentUser;
  bool _isLoggedIn = false;
  Timer? _tokenValidationTimer;
  
  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;

  // Initialize auth state manager
  Future<void> initialize() async {
    await _loadAuthState();
    
    if (_isLoggedIn && _currentUser != null) {
      // Start periodic token validation
      _startTokenValidation();
      
      // Validate token immediately
      await _validateAndRefreshToken();
    }
  }

  // Load authentication state from storage
  Future<void> _loadAuthState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataString = prefs.getString('user_data');
      final isLoggedIn = prefs.getBool('is_logged_in') ?? false;
      
      if (userDataString != null && isLoggedIn) {
        final userData = json.decode(userDataString);
        _currentUser = UserModel.fromJson(userData);
        _isLoggedIn = true;
        print('✅ AuthStateManager: Loaded user from storage: ${_currentUser?.fullName}');
      }
    } catch (e) {
      print('❌ AuthStateManager: Error loading auth state: $e');
      await _clearAuthState();
    }
  }

  // Save authentication state to storage
  Future<void> _saveAuthState(UserModel user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', json.encode(user.toJson()));
      await prefs.setBool('is_logged_in', true);
      await prefs.setString('user_role', user.role);
      
      _currentUser = user;
      _isLoggedIn = true;
      print('✅ AuthStateManager: Saved user to storage: ${user.fullName}');
    } catch (e) {
      print('❌ AuthStateManager: Error saving auth state: $e');
    }
  }

  // Clear authentication state
  Future<void> _clearAuthState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');
      await prefs.setBool('is_logged_in', false);
      await prefs.remove('user_role');
      
      _currentUser = null;
      _isLoggedIn = false;
      print('✅ AuthStateManager: Cleared auth state');
    } catch (e) {
      print('❌ AuthStateManager: Error clearing auth state: $e');
    }
  }

  // Start periodic token validation
  void _startTokenValidation() {
    _tokenValidationTimer?.cancel();
    _tokenValidationTimer = Timer.periodic(Duration(minutes: 2), (timer) async {
      await _validateAndRefreshToken();
    });
  }

  // Stop token validation
  void _stopTokenValidation() {
    _tokenValidationTimer?.cancel();
    _tokenValidationTimer = null;
  }

  // Validate and refresh token
  Future<bool> _validateAndRefreshToken() async {
    try {
      print('🔍 AuthStateManager: Validating token...');
      
      // Check if we have tokens
      String? accessToken = await _apiClient.getAccessToken();
      if (accessToken == null) {
        print('❌ AuthStateManager: No access token found');
        await _handleTokenInvalid();
        return false;
      }

      // Try to get current user data
      final response = await _apiClient.get(ApiConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          // Update user data - use same parsing logic as AuthService
          final userData = data['data']['user'] ?? data['data'];
          final user = UserModel.fromJson(userData);
          await _saveAuthState(user);
          print('✅ AuthStateManager: Token validation successful - User: ${user.fullName} (${user.email})');
          return true;
        }
      }
      
      print('❌ AuthStateManager: Token validation failed with status: ${response.statusCode}');
      await _handleTokenInvalid();
      return false;
    } catch (e) {
      print('❌ AuthStateManager: Token validation error: $e');
      await _handleTokenInvalid();
      return false;
    }
  }

  // Handle invalid token
  Future<void> _handleTokenInvalid() async {
    print('🔄 AuthStateManager: Handling invalid token...');
    
    // Stop token validation
    _stopTokenValidation();
    
    // Clear auth state
    await _clearAuthState();
    
    // Clear tokens
    await _apiClient.clearTokens();
    
    // Stop background services
    _authService.logout();
  }

  // Update user data after successful API call
  Future<void> updateUserData(UserModel user) async {
await _saveAuthState(user);
  }

  // Refresh user data from API
  Future<UserModel?> refreshUserData() async {
    try {
      print('🔄 AuthStateManager: Refreshing user data...');
      
      // Get current user data from API
      final response = await _apiClient.get(ApiConstants.me);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          // Update user data - use same parsing logic as AuthService
          final userData = data['data']['user'] ?? data['data'];
          final user = UserModel.fromJson(userData);
          await _saveAuthState(user);
          print('✅ AuthStateManager: User data refreshed successfully - User: ${user.fullName} (${user.email})');
          return user;
        }
      }
      
      print('❌ AuthStateManager: Failed to refresh user data with status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('❌ AuthStateManager: Error refreshing user data: $e');
      return null;
    }
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    if (!_isLoggedIn || _currentUser == null) {
      return false;
    }
    
    // Validate token
    return await _validateAndRefreshToken();
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

  // Force logout
  Future<void> forceLogout() async {
    print('🔄 AuthStateManager: Force logout requested');
    await _handleTokenInvalid();
  }

  // Dispose
  void dispose() {
    _stopTokenValidation();
  }
}
