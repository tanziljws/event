/// Performance constants for optimization
class PerformanceConstants {
  // Network optimization
  static const Duration networkTimeout = Duration(seconds: 30);
  static const Duration networkRetryDelay = Duration(seconds: 2);
  static const int maxNetworkRetries = 3;
  static const Duration cacheDuration = Duration(minutes: 5);
  static const Duration longCacheDuration = Duration(hours: 1);
  
  // Memory optimization
  static const int maxImageCacheSize = 100; // MB
  static const int maxNetworkCacheSize = 50; // MB
  static const Duration memoryCheckInterval = Duration(minutes: 2);
  static const Duration gcInterval = Duration(minutes: 5);
  
  // UI optimization
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration fastAnimationDuration = Duration(milliseconds: 150);
  static const Duration slowAnimationDuration = Duration(milliseconds: 500);
  
  // List optimization
  static const int listItemExtent = 200; // pixels
  static const int gridItemExtent = 150; // pixels
  static const int maxVisibleItems = 20;
  
  // Image optimization
  static const int maxImageWidth = 800;
  static const int maxImageHeight = 600;
  static const int imageQuality = 85; // percentage
  
  // Cache optimization
  static const int maxCacheEntries = 1000;
  static const Duration cacheCleanupInterval = Duration(hours: 1);
  static const Duration cacheExpiryCheckInterval = Duration(minutes: 30);
  
  // Performance thresholds
  static const int lowMemoryThreshold = 50 * 1024 * 1024; // 50MB
  static const int criticalMemoryThreshold = 100 * 1024 * 1024; // 100MB
  static const double maxCpuUsage = 80.0; // percentage
  static const int maxFrameTime = 16; // milliseconds (60 FPS)
  
  // Network optimization
  static const int maxConcurrentRequests = 5;
  static const Duration requestDebounceDelay = Duration(milliseconds: 300);
  static const Duration connectionTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Image loading optimization
  static const Duration imageFadeInDuration = Duration(milliseconds: 200);
  static const Duration imageFadeOutDuration = Duration(milliseconds: 100);
  static const bool enableImagePreloading = true;
  static const int imagePreloadCount = 3;
  
  // List performance
  static const bool enableListVirtualization = true;
  static const bool enableListCaching = true;
  static const int listCacheSize = 10;
  
  // Animation performance
  static const bool enableAnimationOptimization = true;
  static const bool enableRepaintBoundary = true;
  static const bool enableAutomaticKeepAlive = true;
  
  // Memory management
  static const bool enableMemoryOptimization = true;
  static const bool enableGarbageCollection = true;
  static const Duration memoryOptimizationInterval = Duration(minutes: 5);
  
  // Network caching
  static const bool enableNetworkCaching = true;
  static const bool enableOfflineSupport = true;
  static const Duration offlineCacheDuration = Duration(hours: 24);
  
  // Performance monitoring
  static const bool enablePerformanceMonitoring = false; // Disabled for production
  static const Duration performanceCheckInterval = Duration(minutes: 1);
  static const int maxPerformanceLogs = 100;
}
