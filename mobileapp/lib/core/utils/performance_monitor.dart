import 'dart:developer' as developer;

class PerformanceMonitor {
  static final Map<String, DateTime> _startTimes = {};
  static final Map<String, List<Duration>> _measurements = {};

  /// Start timing a performance measurement
  static void startTiming(String operation) {
    _startTimes[operation] = DateTime.now();
    developer.log('⏱️ PERF START: $operation', name: 'Performance');
  }

  /// End timing and log the duration
  static Duration endTiming(String operation) {
    final startTime = _startTimes.remove(operation);
    if (startTime == null) {
      developer.log('❌ PERF ERROR: No start time found for $operation', name: 'Performance');
      return Duration.zero;
    }

    final duration = DateTime.now().difference(startTime);
    
    // Store measurement for averaging
    _measurements.putIfAbsent(operation, () => []).add(duration);
    
    // Log the duration
    final avgDuration = _getAverageDuration(operation);
    developer.log(
      '⏱️ PERF END: $operation - ${duration.inMilliseconds}ms (avg: ${avgDuration.inMilliseconds}ms)',
      name: 'Performance'
    );
    
    return duration;
  }

  /// Get average duration for an operation
  static Duration _getAverageDuration(String operation) {
    final measurements = _measurements[operation];
    if (measurements == null || measurements.isEmpty) return Duration.zero;
    
    final totalMs = measurements.fold<int>(0, (sum, duration) => sum + duration.inMilliseconds);
    return Duration(milliseconds: totalMs ~/ measurements.length);
  }

  /// Get performance statistics
  static Map<String, dynamic> getStats() {
    final stats = <String, dynamic>{};
    
    for (final operation in _measurements.keys) {
      final measurements = _measurements[operation]!;
      final totalMs = measurements.fold<int>(0, (sum, duration) => sum + duration.inMilliseconds);
      final avgMs = totalMs ~/ measurements.length;
      final minMs = measurements.map((d) => d.inMilliseconds).reduce((a, b) => a < b ? a : b);
      final maxMs = measurements.map((d) => d.inMilliseconds).reduce((a, b) => a > b ? a : b);
      
      stats[operation] = {
        'count': measurements.length,
        'avgMs': avgMs,
        'minMs': minMs,
        'maxMs': maxMs,
        'totalMs': totalMs,
      };
    }
    
    return stats;
  }

  /// Clear all performance data
  static void clearStats() {
    _startTimes.clear();
    _measurements.clear();
    developer.log('⏱️ PERF: Cleared all performance data', name: 'Performance');
  }

  /// Log performance stats
  static void logStats() {
    final stats = getStats();
    developer.log('⏱️ PERF STATS: $stats', name: 'Performance');
  }
}

/// Performance measurement wrapper
class PerformanceTimer {
  final String operation;
  late final DateTime _startTime;

  PerformanceTimer(this.operation) {
    _startTime = DateTime.now();
    developer.log('⏱️ PERF START: $operation', name: 'Performance');
  }

  Duration stop() {
    final duration = DateTime.now().difference(_startTime);
    developer.log('⏱️ PERF END: $operation - ${duration.inMilliseconds}ms', name: 'Performance');
    return duration;
  }
}

/// Extension for easy performance measurement
extension PerformanceExtension on Future<T> Function<T>() {
  Future<T> measurePerformance<T>(String operation) async {
    final timer = PerformanceTimer(operation);
    try {
      final result = await this();
      timer.stop();
      return result;
    } catch (e) {
      timer.stop();
      rethrow;
    }
  }
}
