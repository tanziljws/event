import 'package:shared_preferences/shared_preferences.dart';

class ClearCacheHelper {
  static const String _cachePrefix = 'cache_';
  
  /// Clear all cache data
  static Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      int clearedCount = 0;
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          await prefs.remove(key);
          clearedCount++;
        }
      }
      
      print('📦 CACHE: Cleared $clearedCount cache entries');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to clear cache: $e');
    }
  }
  
  /// Clear specific cache key
  static Future<void> clearCacheKey(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_cachePrefix$key');
      print('📦 CACHE: Cleared cache for key: $key');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to clear cache key: $e');
    }
  }
  
  /// Clear events cache specifically
  static Future<void> clearEventsCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      int clearedCount = 0;
      for (final key in keys) {
        if (key.startsWith(_cachePrefix) && key.contains('events_')) {
          await prefs.remove(key);
          clearedCount++;
        }
      }
      
      print('📦 CACHE: Cleared $clearedCount events cache entries');
    } catch (e) {
      print('❌ CACHE ERROR: Failed to clear events cache: $e');
    }
  }
}
