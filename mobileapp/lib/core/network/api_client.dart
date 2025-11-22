import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../utils/logger.dart';
import 'auth_interceptor.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  // Callback for token refresh events
  static Function()? _onTokenRefreshed;

  // Set callback for token refresh events
  static void setOnTokenRefreshed(Function()? callback) {
    _onTokenRefreshed = callback;
  }

  late Dio _dio;
  String? _accessToken;
  String? _refreshToken;
  DateTime? _tokenExpiry;
  bool _isRefreshing = false;
  
  // Secure storage instance
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  Dio get dio => _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: Duration(seconds: ApiConstants.timeoutDuration),
      receiveTimeout: Duration(seconds: ApiConstants.timeoutDuration),
      sendTimeout: Duration(seconds: ApiConstants.timeoutDuration),
      headers: ApiConstants.defaultHeaders,
      // Enable cookies for httpOnly refresh token
      followRedirects: true,
      validateStatus: (status) => status != null && status < 500,
      // Performance optimizations
      persistentConnection: true,
      maxRedirects: 3,
    ));

    // Add interceptors
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(_createLoggingInterceptor());
    _dio.interceptors.add(_createErrorInterceptor());
    _dio.interceptors.add(_createCacheInterceptor());
  }


  Interceptor _createLoggingInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        AppLogger.network(options.method, options.uri.toString(), 'API');
        AppLogger.debug('Headers: ${options.headers}', 'API');
        AppLogger.debug('Authorization: ${options.headers['Authorization']}', 'API');
        if (options.data != null) {
          AppLogger.debug('Data: ${options.data}', 'API');
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        AppLogger.networkResponse(
          response.requestOptions.method, 
          response.requestOptions.uri.toString(), 
          response.statusCode ?? 0, 
          'API'
        );
        AppLogger.debug('Response data: ${response.data}', 'API');
        handler.next(response);
      },
      onError: (error, handler) {
        AppLogger.error(
          'API Error: ${error.response?.statusCode} ${error.requestOptions.uri}',
          'API',
          error,
          error.stackTrace,
        );
        AppLogger.debug('Error data: ${error.response?.data}', 'API');
        handler.next(error);
      },
    );
  }

  Interceptor _createErrorInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) {
        if (error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout) {
          error = DioException(
            requestOptions: error.requestOptions,
            error: 'Connection timeout. Please check your internet connection.',
            type: DioExceptionType.connectionTimeout,
          );
        } else if (error.type == DioExceptionType.connectionError) {
          error = DioException(
            requestOptions: error.requestOptions,
            error: 'No internet connection. Please check your network.',
            type: DioExceptionType.connectionError,
          );
        }
        
        handler.next(error);
      },
    );
  }

  Interceptor _createCacheInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        // Add cache headers for GET requests
        if (options.method == 'GET') {
          options.headers['Cache-Control'] = 'max-age=300'; // 5 minutes cache
          options.headers['If-None-Match'] = ''; // Enable ETag support
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        // Handle 304 Not Modified responses
        if (response.statusCode == 304) {
          // Return cached response
          response.statusCode = 200;
        }
        handler.next(response);
      },
    );
  }

  Future<void> _loadTokens() async {
    // Load tokens from secure storage
    _accessToken = await _secureStorage.read(key: 'access_token');
    _refreshToken = await _secureStorage.read(key: 'refresh_token');
    
    // Load token expiry from secure storage
    final expiryString = await _secureStorage.read(key: 'token_expiry');
    if (expiryString != null) {
      _tokenExpiry = DateTime.parse(expiryString);
    }
  }

  // Get current access token
  Future<String?> getAccessToken() async {
    await _loadTokens();
    return _accessToken;
  }

  Future<void> _saveTokens(String accessToken, String? refreshToken, {DateTime? expiry}) async {
    // Save tokens to secure storage
    await _secureStorage.write(key: 'access_token', value: accessToken);
    if (refreshToken != null) {
      await _secureStorage.write(key: 'refresh_token', value: refreshToken);
      _refreshToken = refreshToken;
    }
    _accessToken = accessToken;
    
    // Decode JWT token to get actual expiry
    try {
      final decodedToken = _decodeJWT(accessToken);
      if (decodedToken != null && decodedToken['exp'] != null) {
        final expiryTimestamp = decodedToken['exp'] as int;
        _tokenExpiry = DateTime.fromMillisecondsSinceEpoch(expiryTimestamp * 1000);
        await _secureStorage.write(key: 'token_expiry', value: _tokenExpiry!.toIso8601String());
        print('✅ Token expiry decoded: $_tokenExpiry');
      } else {
        // Fallback: use provided expiry or default
        if (expiry != null) {
          _tokenExpiry = expiry;
          await _secureStorage.write(key: 'token_expiry', value: expiry.toIso8601String());
        } else {
          _tokenExpiry = DateTime.now().add(Duration(minutes: 15));
          await _secureStorage.write(key: 'token_expiry', value: _tokenExpiry!.toIso8601String());
        }
      }
    } catch (e) {
      print('❌ Error decoding JWT token: $e');
      // Fallback: use provided expiry or default
      if (expiry != null) {
        _tokenExpiry = expiry;
        await _secureStorage.write(key: 'token_expiry', value: expiry.toIso8601String());
      } else {
        _tokenExpiry = DateTime.now().add(Duration(minutes: 15));
        await _secureStorage.write(key: 'token_expiry', value: _tokenExpiry!.toIso8601String());
      }
    }
  }

  // Decode JWT token to get payload
  Map<String, dynamic>? _decodeJWT(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      final payload = parts[1];
      // Add padding if needed
      final normalizedPayload = base64Url.normalize(payload);
      final decodedBytes = base64Url.decode(normalizedPayload);
      final decodedString = utf8.decode(decodedBytes);
      
      return json.decode(decodedString);
    } catch (e) {
      print('❌ Error decoding JWT: $e');
      return null;
    }
  }

  Future<void> _clearTokens() async {
    // Clear tokens from secure storage
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
    await _secureStorage.delete(key: 'token_expiry');
    
    // Clear user data from SharedPreferences (non-sensitive data)
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    await prefs.setBool('is_logged_in', false);
    
    _accessToken = null;
    _refreshToken = null;
    _tokenExpiry = null;
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  bool _isTokenExpired() {
    if (_tokenExpiry == null) return true;
    return DateTime.now().add(Duration(minutes: 5)).isAfter(_tokenExpiry!);
  }

  // Check if token is completely expired (no grace period)
  bool _isTokenCompletelyExpired() {
    if (_tokenExpiry == null) return true;
    return DateTime.now().isAfter(_tokenExpiry!);
  }

  // Proactive token refresh
  Future<bool> _proactiveRefreshToken() async {
    if (_isRefreshing) {
      print('🔄 Token refresh already in progress...');
      return false;
    }
    
    // Load tokens first
    await _loadTokens();
    
    if (_refreshToken == null) {
      print('❌ No refresh token available');
      return false;
    }
    
    _isRefreshing = true;
    
    try {
      print('🔄 Proactively refreshing access token...');
      
      // Send refresh token in body for mobile apps
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': _refreshToken},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        print('✅ Proactive token refresh successful');
        
        if (data['success'] == true && data['data'] != null) {
          await _saveTokens(data['data']['accessToken'], data['data']['refreshToken']);
          _isRefreshing = false;
          
          // Notify callback about token refresh
          if (_onTokenRefreshed != null) {
            try {
              _onTokenRefreshed!();
            } catch (e) {
              print('⚠️ Token refresh callback failed: $e');
            }
          }
          
          return true;
        }
      } else {
        print('❌ Proactive token refresh failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Proactive token refresh failed: $e');
      // If refresh token is also expired/invalid, clear all tokens
      if (e is DioException && (e.response?.statusCode == 401 || e.response?.statusCode == 404)) {
        print('🔄 Refresh token expired during proactive refresh, clearing all tokens...');
        await _clearTokens();
      }
    }
    
    _isRefreshing = false;
    return false;
  }

  Future<bool> _refreshAccessToken() async {
    if (_isRefreshing) {
      print('🔄 Token refresh already in progress...');
      return false;
    }
    
    // Load tokens first
    await _loadTokens();
    
    if (_refreshToken == null) {
      print('❌ No refresh token available');
      return false;
    }
    
    _isRefreshing = true;
    
    try {
      print('🔄 Attempting to refresh access token...');
      
      // Send refresh token in body for mobile apps
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': _refreshToken},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        print('✅ Token refresh successful');
        
        if (data['success'] == true && data['data'] != null) {
          await _saveTokens(data['data']['accessToken'], data['data']['refreshToken']);
          _isRefreshing = false;
          
          // Notify callback about token refresh
          if (_onTokenRefreshed != null) {
            try {
              _onTokenRefreshed!();
            } catch (e) {
              print('⚠️ Token refresh callback failed: $e');
            }
          }
          
          return true;
        }
      } else {
        print('❌ Token refresh failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Token refresh failed: $e');
      // If refresh token is also expired/invalid, clear all tokens
      if (e is DioException && (e.response?.statusCode == 401 || e.response?.statusCode == 404)) {
        print('🔄 Refresh token expired, clearing all tokens...');
        await _clearTokens();
      }
    }
    
    _isRefreshing = false;
    return false;
  }

  // HTTP Methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters, Options? options}) async {
    return await _dio.get(path, queryParameters: queryParameters, options: options);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return await _dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.delete(path, queryParameters: queryParameters);
  }

  // File Upload
  Future<Response> uploadFile(
    String path,
    String filePath, {
    String fieldName = 'file',
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      ...?data,
    });

    return await _dio.post(
      path,
      data: formData,
      onSendProgress: onSendProgress,
    );
  }

  // Download File
  Future<Response> downloadFile(
    String url,
    String savePath, {
    ProgressCallback? onReceiveProgress,
  }) async {
    return await _dio.download(url, savePath, onReceiveProgress: onReceiveProgress);
  }

  // Set tokens manually (for login)
  Future<void> setTokens(String accessToken, String? refreshToken, {DateTime? expiry}) async {
    await _saveTokens(accessToken, refreshToken, expiry: expiry);
  }

  // Check if token needs refresh
  Future<bool> needsTokenRefresh() async {
    await _loadTokens();
    return _isTokenExpired();
  }

  // Force token refresh (public method)
  Future<bool> forceTokenRefresh() async {
    return await _refreshAccessToken();
  }

  // Clear tokens (for logout)
  Future<void> clearTokens() async {
    await _clearTokens();
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    await _loadTokens();
    return _accessToken != null;
  }

  // Get current access token
  String? get accessToken => _accessToken;

  // Validate current token with API
  Future<bool> validateToken() async {
    try {
      await _loadTokens();
      if (_accessToken == null) return false;
      
      // Check if token is completely expired
      if (_isTokenCompletelyExpired()) {
        print('❌ Token is completely expired during validation');
        return false;
      }
      
      // Try to refresh if needed
      if (_isTokenExpired()) {
        print('🔄 Token needs refresh during validation');
        bool refreshed = await _refreshAccessToken();
        if (!refreshed) {
          print('❌ Token refresh failed during validation');
          return false;
        }
      }
      
      return true;
    } catch (e) {
      print('❌ Token validation error: $e');
      return false;
    }
  }
}

