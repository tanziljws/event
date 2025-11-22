import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/services/user_stats_service.dart';
import '../../../shared/widgets/common_loading.dart';

class DashboardStats extends StatefulWidget {
  const DashboardStats({super.key});

  @override
  State<DashboardStats> createState() => _DashboardStatsState();
}

class _DashboardStatsState extends State<DashboardStats> {
  final UserStatsService _userStatsService = UserStatsService();
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final result = await _userStatsService.getUserDashboardStats();
      if (result['success'] == true) {
        setState(() {
          _stats = result['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Statistics',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 16),
        if (_isLoading)
          const CommonLoading(message: 'Loading statistics...')
        else ...[
          // Ultra compact layout - all 4 items in 1 row
          Row(
            children: [
              Expanded(
                child: CompactStatCard(
                  title: 'Events Joined',
                  value: '${_stats?['totalRegistrations'] ?? 0}',
                  color: const Color(0xFF2563EB),
                  onTap: () => context.go('/my-registrations'),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: CompactStatCard(
                  title: 'Certificates',
                  value: '${_stats?['totalCertificates'] ?? 0}',
                  color: const Color(0xFF10B981),
                  onTap: () => context.go('/certificates'),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: CompactStatCard(
                  title: 'Events Attended',
                  value: '${_stats?['attendedEvents'] ?? 0}',
                  color: const Color(0xFF059669),
                  onTap: () => context.go('/my-registrations'),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: CompactStatCard(
                  title: 'Success Rate',
                  value: _getSuccessRate(),
                  color: const Color(0xFF8B5CF6),
                  onTap: () => context.go('/my-registrations'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  String _getSuccessRate() {
    if (_stats == null) return '0%';
    final totalRegistrations = _stats!['totalRegistrations'] ?? 0;
    final attendedEvents = _stats!['attendedEvents'] ?? 0;
    
    if (totalRegistrations == 0) return '0%';
    
    final rate = (attendedEvents / totalRegistrations * 100).round();
    return '$rate%';
  }
}

// Ultra compact stat card widget - invisible container, blue numbers
class CompactStatCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  final VoidCallback? onTap;

  const CompactStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        // Invisible container - no background, no border, no shadow
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Color(0xFF2563EB), // Uniform blue color for all numbers
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 9,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
