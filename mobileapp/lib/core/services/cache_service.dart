import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static const String _cachePrefix = 'cache_';
  static const int _defaultCacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

  /// Cache data with a key and optional expiration time
  static Future<void> setCache(String key, dynamic data, {int? expirationMs}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'expiration': expirationMs ?? _defaultCacheDuration,
      };
      
      await prefs.setString('$_cachePrefix$key', jsonEncode(cacheData));
      print('📦 CACHE: Stored data for key: $key');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to store data for key $key: $e');
    }
  }

  /// Get cached data if it exists and hasn't expired
  static Future<dynamic> getCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedString = prefs.getString('$_cachePrefix$key');
      
      if (cachedString == null) {
        print('📦 CACHE: No data found for key: $key');
        return null;
      }

      final cacheData = jsonDecode(cachedString);
      final timestamp = cacheData['timestamp'] as int;
      final expiration = cacheData['expiration'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      // Check if cache has expired
      if (now - timestamp > expiration) {
        print('📦 CACHE: Data expired for key: $key');
        await removeCache(key);
        return null;
      }

      print('📦 CACHE: Retrieved data for key: $key');
      return cacheData['data'];
    } catch (e) {
      print('❌ CACHE ERROR: Failed to retrieve data for key $key: $e');
      return null;
    }
  }

  /// Remove specific cache entry
  static Future<void> removeCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_cachePrefix$key');
      print('📦 CACHE: Removed data for key: $key');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to remove data for key $key: $e');
    }
  }

  /// Clear all cache
  static Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          await prefs.remove(key);
        }
      }
      
      print('📦 CACHE: Cleared all cache');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to clear cache: $e');
    }
  }

  /// Check if cache exists and is valid
  static Future<bool> hasValidCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedString = prefs.getString('$_cachePrefix$key');
      
      if (cachedString == null) return false;

      final cacheData = jsonDecode(cachedString);
      final timestamp = cacheData['timestamp'] as int;
      final expiration = cacheData['expiration'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      return (now - timestamp) <= expiration;
    } catch (e) {
      print('❌ CACHE ERROR: Failed to check cache validity for key $key: $e');
      return false;
    }
  }

  /// Get cache age in minutes
  static Future<int?> getCacheAge(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedString = prefs.getString('$_cachePrefix$key');
      
      if (cachedString == null) return null;

      final cacheData = jsonDecode(cachedString);
      final timestamp = cacheData['timestamp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      return ((now - timestamp) / (1000 * 60)).round();
    } catch (e) {
      print('❌ CACHE ERROR: Failed to get cache age for key $key: $e');
      return null;
    }
  }
}
