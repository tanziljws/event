import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/utils/performance_monitor.dart';
import '../../../core/services/cache_service.dart';
import '../../../core/services/network_cache_service.dart';

class PerformanceDashboard extends StatefulWidget {
  const PerformanceDashboard({super.key});

  @override
  State<PerformanceDashboard> createState() => _PerformanceDashboardState();
}

class _PerformanceDashboardState extends State<PerformanceDashboard> {
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    
    // Get performance stats
    final perfStats = PerformanceMonitor.getStats();
    
    // Get cache info
    final cacheInfo = await _getCacheInfo();
    
    setState(() {
      _stats = {
        'performance': perfStats,
        'cache': cacheInfo,
      };
      _isLoading = false;
    });
  }

  Future<Map<String, dynamic>> _getCacheInfo() async {
    try {
      // Get network cache stats
      final networkCacheStats = await NetworkCacheService().getCacheStats();
      
      // Get CacheService stats (count keys with cache prefix)
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys();
      final cacheKeys = allKeys.where((key) => key.startsWith('cache_')).length;
      
      // Calculate total size for CacheService entries
      int cacheServiceSize = 0;
      for (final key in allKeys) {
        if (key.startsWith('cache_')) {
          final value = prefs.getString(key);
          if (value != null) {
            cacheServiceSize += value.length;
          }
        }
      }
      
      final totalKeys = cacheKeys + (networkCacheStats['totalEntries'] as int);
      final totalSizeBytes = cacheServiceSize + (networkCacheStats['totalSizeBytes'] as int);
      final totalSizeKB = (totalSizeBytes / 1024).toStringAsFixed(2);
      
      return {
        'totalKeys': totalKeys,
        'totalSize': '$totalSizeKB KB',
        'activeEntries': networkCacheStats['activeEntries'] ?? 0,
        'expiredEntries': networkCacheStats['expiredEntries'] ?? 0,
        'cacheServiceKeys': cacheKeys,
        'networkCacheKeys': networkCacheStats['totalEntries'] ?? 0,
      };
    } catch (e) {
    return {
      'totalKeys': 0,
      'totalSize': '0 KB',
        'activeEntries': 0,
        'expiredEntries': 0,
        'cacheServiceKeys': 0,
        'networkCacheKeys': 0,
    };
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStats,
          ),
          IconButton(
            icon: const Icon(Icons.clear_all),
            onPressed: () async {
              await CacheService.clearAllCache();
              await NetworkCacheService().clearAllCache();
              PerformanceMonitor.clearStats();
              _loadStats();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All cache and stats cleared')),
                );
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPerformanceSection(),
                  const SizedBox(height: 24),
                  _buildCacheSection(),
                  const SizedBox(height: 24),
                  _buildActionsSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildPerformanceSection() {
    final perfStats = _stats['performance'] as Map<String, dynamic>;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Performance Metrics',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (perfStats.isEmpty)
              const Text('No performance data available')
            else
              ...perfStats.entries.map((entry) => _buildMetricRow(
                entry.key,
                '${entry.value['avgMs']}ms avg',
                '${entry.value['count']} calls',
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildCacheSection() {
    final cacheInfo = _stats['cache'] as Map<String, dynamic>;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cache Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('Total Keys', cacheInfo['totalKeys'].toString(), ''),
            _buildMetricRow('Total Size', cacheInfo['totalSize'], ''),
            _buildMetricRow('Active Entries', cacheInfo['activeEntries'].toString(), ''),
            _buildMetricRow('Expired Entries', cacheInfo['expiredEntries'].toString(), ''),
            const Divider(),
            _buildMetricRow('CacheService Keys', cacheInfo['cacheServiceKeys'].toString(), ''),
            _buildMetricRow('Network Cache Keys', cacheInfo['networkCacheKeys'].toString(), ''),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String title, String value, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
              if (subtitle.isNotEmpty)
                Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
            ],
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildActionsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Actions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                PerformanceMonitor.clearStats();
                _loadStats();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Performance stats cleared')),
                );
              },
              icon: const Icon(Icons.clear),
              label: const Text('Clear Performance Stats'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () async {
                await CacheService.clearAllCache();
                await NetworkCacheService().clearAllCache();
                _loadStats();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All cache cleared')),
                );
              },
              icon: const Icon(Icons.delete),
              label: const Text('Clear All Cache'),
            ),
          ],
        ),
      ),
    );
  }
}
