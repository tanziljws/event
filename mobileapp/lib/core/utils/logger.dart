import 'package:flutter/foundation.dart';

/// Professional logger utility for conditional logging
class AppLogger {
  static const bool _isDebug = kDebugMode;
  
  /// Debug level logging
  static void debug(String message, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('🐛 DEBUG$tagPrefix: $message');
    }
  }
  
  /// Info level logging
  static void info(String message, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('ℹ️ INFO$tagPrefix: $message');
    }
  }
  
  /// Warning level logging
  static void warning(String message, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('⚠️ WARNING$tagPrefix: $message');
    }
  }
  
  /// Error level logging
  static void error(String message, [String? tag, Object? error, StackTrace? stackTrace]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('❌ ERROR$tagPrefix: $message');
      if (error != null) {
        print('❌ ERROR$tagPrefix: Error details: $error');
      }
      if (stackTrace != null) {
        print('❌ ERROR$tagPrefix: Stack trace: $stackTrace');
      }
    }
  }
  
  /// Success level logging
  static void success(String message, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('✅ SUCCESS$tagPrefix: $message');
    }
  }
  
  /// Network request logging
  static void network(String method, String url, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('🌐 NETWORK$tagPrefix: $method $url');
    }
  }
  
  /// Network response logging
  static void networkResponse(String method, String url, int statusCode, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('📥 RESPONSE$tagPrefix: $method $url -> $statusCode');
    }
  }
  
  /// Performance logging
  static void performance(String operation, Duration duration, [String? tag]) {
    if (_isDebug) {
      final tagPrefix = tag != null ? '[$tag]' : '';
      print('⚡ PERFORMANCE$tagPrefix: $operation took ${duration.inMilliseconds}ms');
    }
  }
}
