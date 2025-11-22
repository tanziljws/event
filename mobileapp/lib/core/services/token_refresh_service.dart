import 'dart:async';
import '../network/api_client.dart';

class TokenRefreshService {
  static final TokenRefreshService _instance = TokenRefreshService._internal();
  factory TokenRefreshService() => _instance;
  TokenRefreshService._internal();

  final ApiClient _apiClient = ApiClient();
  Timer? _refreshTimer;
  bool _isActive = false;

  // Start background token refresh
  void startBackgroundRefresh() {
    if (_isActive) return;
    
    _isActive = true;
    print('🔄 Starting background token refresh service...');
    
    // Check token every 5 minutes
    _refreshTimer = Timer.periodic(Duration(minutes: 5), (timer) async {
      await _checkAndRefreshToken();
    });
    
    // Also check when app resumes
    _setupAppLifecycleListener();
  }

  // Stop background token refresh
  void stopBackgroundRefresh() {
    if (!_isActive) return;
    
    _isActive = false;
    _refreshTimer?.cancel();
    _refreshTimer = null;
    print('⏹️ Stopped background token refresh service');
  }

  // Setup app lifecycle listener
  void _setupAppLifecycleListener() {
    // This would require app lifecycle package
    // For now, we'll rely on periodic checks
  }

  // Check and refresh token if needed
  Future<void> _checkAndRefreshToken() async {
    try {
      bool needsRefresh = await _apiClient.needsTokenRefresh();
      if (needsRefresh) {
        print('🔄 Background: Token needs refresh, refreshing...');
        bool success = await _apiClient.forceTokenRefresh();
        if (success) {
          print('✅ Background: Token refreshed successfully');
        } else {
          print('❌ Background: Token refresh failed');
        }
      } else {
        print('✅ Background: Token is still valid');
      }
    } catch (e) {
      print('❌ Background token check error: $e');
    }
  }

  // Manual token refresh
  Future<bool> refreshTokenNow() async {
    try {
      print('🔄 Manual token refresh requested...');
      bool success = await _apiClient.forceTokenRefresh();
      if (success) {
        print('✅ Manual token refresh successful');
      } else {
        print('❌ Manual token refresh failed');
      }
      return success;
    } catch (e) {
      print('❌ Manual token refresh error: $e');
      return false;
    }
  }

  // Check if service is active
  bool get isActive => _isActive;
}
