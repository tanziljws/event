class NetworkConfig {
  // Timeout configurations
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds

  // Retry configurations
  static const int maxRetries = 3;
  static const int retryDelay = 1000; // 1 second

  // Cache configurations
  static const int cacheMaxAge = 300000; // 5 minutes
  static const int cacheMaxSize = 50; // 50 items

  // Request configurations
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Nusa-Mobile/1.0.0',
  };

  // API endpoints
  // Use local backend for development
  // NOTE: Backend runs on port 5002 (not 5000) because port 5000 is used by macOS AirPlay
  static const String baseUrl = 'http://10.0.2.2:5002/api'; // Android emulator localhost
  // Production: static const String baseUrl = 'https://web-production-38c7.up.railway.app/api';
  
  // Endpoint paths
  static const String auth = '/auth';
  static const String events = '/events';
  static const String users = '/users';
  static const String notifications = '/notifications';
  static const String uploads = '/upload';
  
  // Full endpoint URLs
  static String get authUrl => '$baseUrl$auth';
  static String get eventsUrl => '$baseUrl$events';
  static String get usersUrl => '$baseUrl$users';
  static String get notificationsUrl => '$baseUrl$notifications';
  static String get uploadsUrl => '$baseUrl$uploads';
}
