import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';

/// Network cache service for better performance and UX
class NetworkCacheService {
  static final NetworkCacheService _instance = NetworkCacheService._internal();
  factory NetworkCacheService() => _instance;
  NetworkCacheService._internal();

  static const String _cachePrefix = 'network_cache_';
  static const Duration _defaultCacheDuration = Duration(minutes: 5);
  static const Duration _longCacheDuration = Duration(hours: 1);

  /// Cache GET request response
  Future<void> cacheResponse(String url, dynamic data, {Duration? duration}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix${_hashUrl(url)}';
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'expiry': DateTime.now().add(duration ?? _defaultCacheDuration).millisecondsSinceEpoch,
      };
      
      await prefs.setString(cacheKey, json.encode(cacheData));
      AppLogger.debug('Cached response for: $url', 'NetworkCache');
    } catch (e) {
      AppLogger.error('Failed to cache response: $e', 'NetworkCache');
    }
  }

  /// Get cached response if available and not expired
  Future<dynamic> getCachedResponse(String url) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix${_hashUrl(url)}';
      final cachedString = prefs.getString(cacheKey);
      
      if (cachedString == null) return null;
      
      final cacheData = json.decode(cachedString) as Map<String, dynamic>;
      final expiry = DateTime.fromMillisecondsSinceEpoch(cacheData['expiry'] as int);
      
      if (DateTime.now().isAfter(expiry)) {
        // Cache expired, remove it
        await prefs.remove(cacheKey);
        AppLogger.debug('Cache expired for: $url', 'NetworkCache');
        return null;
      }
      
      AppLogger.debug('Cache hit for: $url', 'NetworkCache');
      return cacheData['data'];
    } catch (e) {
      AppLogger.error('Failed to get cached response: $e', 'NetworkCache');
      return null;
    }
  }

  /// Check if response is cached and not expired
  Future<bool> hasCachedResponse(String url) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix${_hashUrl(url)}';
      final cachedString = prefs.getString(cacheKey);
      
      if (cachedString == null) return false;
      
      final cacheData = json.decode(cachedString) as Map<String, dynamic>;
      final expiry = DateTime.fromMillisecondsSinceEpoch(cacheData['expiry'] as int);
      
      if (DateTime.now().isAfter(expiry)) {
        await prefs.remove(cacheKey);
        return false;
      }
      
      return true;
    } catch (e) {
      AppLogger.error('Failed to check cached response: $e', 'NetworkCache');
      return false;
    }
  }

  /// Clear specific cache entry
  Future<void> clearCache(String url) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '$_cachePrefix${_hashUrl(url)}';
      await prefs.remove(cacheKey);
      AppLogger.debug('Cleared cache for: $url', 'NetworkCache');
    } catch (e) {
      AppLogger.error('Failed to clear cache: $e', 'NetworkCache');
    }
  }

  /// Clear all network cache
  Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final cacheKeys = keys.where((key) => key.startsWith(_cachePrefix));
      
      for (final key in cacheKeys) {
        await prefs.remove(key);
      }
      
      AppLogger.info('Cleared all network cache', 'NetworkCache');
    } catch (e) {
      AppLogger.error('Failed to clear all cache: $e', 'NetworkCache');
    }
  }

  /// Clean expired cache entries
  Future<void> cleanExpiredCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final cacheKeys = keys.where((key) => key.startsWith(_cachePrefix));
      
      for (final key in cacheKeys) {
        final cachedString = prefs.getString(key);
        if (cachedString != null) {
          try {
            final cacheData = json.decode(cachedString) as Map<String, dynamic>;
            final expiry = DateTime.fromMillisecondsSinceEpoch(cacheData['expiry'] as int);
            
            if (DateTime.now().isAfter(expiry)) {
              await prefs.remove(key);
            }
          } catch (e) {
            // Invalid cache data, remove it
            await prefs.remove(key);
          }
        }
      }
      
      AppLogger.debug('Cleaned expired cache entries', 'NetworkCache');
    } catch (e) {
      AppLogger.error('Failed to clean expired cache: $e', 'NetworkCache');
    }
  }

  /// Get cache statistics
  Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final cacheKeys = keys.where((key) => key.startsWith(_cachePrefix));
      
      int totalEntries = 0;
      int expiredEntries = 0;
      int totalSize = 0;
      
      for (final key in cacheKeys) {
        final cachedString = prefs.getString(key);
        if (cachedString != null) {
          totalEntries++;
          totalSize += cachedString.length;
          
          try {
            final cacheData = json.decode(cachedString) as Map<String, dynamic>;
            final expiry = DateTime.fromMillisecondsSinceEpoch(cacheData['expiry'] as int);
            
            if (DateTime.now().isAfter(expiry)) {
              expiredEntries++;
            }
          } catch (e) {
            expiredEntries++;
          }
        }
      }
      
      return {
        'totalEntries': totalEntries,
        'expiredEntries': expiredEntries,
        'activeEntries': totalEntries - expiredEntries,
        'totalSizeBytes': totalSize,
        'totalSizeKB': (totalSize / 1024).toStringAsFixed(2),
      };
    } catch (e) {
      AppLogger.error('Failed to get cache stats: $e', 'NetworkCache');
      return {
        'totalEntries': 0,
        'expiredEntries': 0,
        'activeEntries': 0,
        'totalSizeBytes': 0,
        'totalSizeKB': '0.00',
      };
    }
  }

  /// Hash URL for cache key
  String _hashUrl(String url) {
    return url.hashCode.toString();
  }

  /// Cache duration for different types of data
  static Duration getCacheDuration(String endpoint) {
    // Short cache for events to ensure fresh data
    if (endpoint.contains('/events') && !endpoint.contains('/my-events')) {
      return Duration(seconds: 30); // 30 seconds instead of 1 hour
    }
    
    // Medium cache for user data
    if (endpoint.contains('/profile') || endpoint.contains('/user')) {
      return Duration(minutes: 10);
    }
    
    // Short cache for dynamic data
    if (endpoint.contains('/notifications') || endpoint.contains('/dashboard')) {
      return Duration(minutes: 2);
    }
    
    // Default cache
    return _defaultCacheDuration;
  }
}
