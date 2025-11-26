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
  // Production Railway backend
  static const String baseUrl = 'https://backend-nasa.up.railway.app/api';
  // Local development (uncomment for local testing):
  // static const String baseUrl = 'http://10.0.2.2:5002/api'; // Android emulator localhost
  
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
