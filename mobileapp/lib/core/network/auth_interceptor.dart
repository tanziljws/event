import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../../shared/services/auth_service.dart';

class AuthInterceptor extends Interceptor {
  final AuthService _authService = AuthService();
  bool _isRefreshing = false;
  final List<RequestOptions> _pendingRequests = [];
  
  // Secure storage instance
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Add authorization header if we have a token
    final token = await _authService.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle 401 and 404 (backend returns 404 for security)
    if (err.response?.statusCode == 401 || err.response?.statusCode == 404) {
      print('🔒 AuthInterceptor: Token expired (${err.response?.statusCode}), attempting refresh...');
      
      // If we're already refreshing, queue this request
      if (_isRefreshing) {
        _pendingRequests.add(err.requestOptions);
        handler.next(err);
        return;
      }
      
      _isRefreshing = true;
      
      try {
        // Try to refresh token
        bool refreshed = await _refreshToken();
        
        if (refreshed) {
          print('✅ AuthInterceptor: Token refreshed successfully');
          
          // Retry the original request
          final options = err.requestOptions;
          final token = await _authService.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          try {
            final response = await Dio().fetch(options);
            handler.resolve(response);
            
            // Process pending requests
            await _processPendingRequests();
            
            return;
          } catch (e) {
            print('❌ AuthInterceptor: Retry failed after refresh: $e');
          }
        } else {
          print('❌ AuthInterceptor: Token refresh failed');
        }
      } catch (e) {
        print('❌ AuthInterceptor: Token refresh error: $e');
      } finally {
        _isRefreshing = false;
      }
      
      // If refresh failed, clear tokens and redirect to login
      await _authService.logout();
    }
    
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final response = await Dio().post(
        '${ApiConstants.baseUrl}${ApiConstants.refreshToken}',
        data: {'refreshToken': await _getRefreshToken()},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true && data['data'] != null) {
          // Save new tokens
          await _authService.setTokens(
            data['data']['accessToken'],
            data['data']['refreshToken'],
          );
          return true;
        }
      }
      
      return false;
    } catch (e) {
      print('❌ AuthInterceptor: Refresh token error: $e');
      return false;
    }
  }

  Future<String?> _getRefreshToken() async {
    // Get refresh token from secure storage
    return await _secureStorage.read(key: 'refresh_token');
  }

  Future<void> _processPendingRequests() async {
    final requests = List<RequestOptions>.from(_pendingRequests);
    _pendingRequests.clear();
    
    for (final options in requests) {
      try {
        final token = await _authService.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        await Dio().fetch(options);
      } catch (e) {
        print('❌ AuthInterceptor: Pending request failed: $e');
      }
    }
  }
}
