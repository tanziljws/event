import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/constants/app_constants.dart';
import '../models/analytics_models.dart';

class AnalyticsCharts extends StatelessWidget {
  final List<ChartData> chartData;
  final List<EventStatusData> statusData;

  const AnalyticsCharts({
    super.key,
    required this.chartData,
    required this.statusData,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Monthly Events Chart
        _buildChartCard(
          title: 'Events Created (Last 6 Months)',
          subtitle: 'Number of events created per month',
          child: SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: _getMaxY(),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() < chartData.length) {
                          return Text(
                            chartData[value.toInt()].month,
                            style: TextStyle(
                              color: AppConstants.textSecondary,
                              fontSize: 12,
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: TextStyle(
                            color: AppConstants.textSecondary,
                            fontSize: 12,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: chartData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final data = entry.value;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: data.events.toDouble(),
                        color: AppConstants.primaryColor,
                        width: 20,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          topRight: Radius.circular(4),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Event Status Distribution
        _buildChartCard(
          title: 'Event Status Distribution',
          subtitle: 'Current status of all events',
          child: SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: statusData.map((data) {
                  return PieChartSectionData(
                    color: _parseColor(data.color),
                    value: data.value.toDouble(),
                    title: '${data.name}\n${data.value}',
                    radius: 50,
                    titleStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildChartCard({
    required String title,
    required String subtitle,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConstants.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppConstants.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: AppConstants.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              color: AppConstants.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  double _getMaxY() {
    if (chartData.isEmpty) return 10;
    final maxEvents = chartData.map((e) => e.events).reduce((a, b) => a > b ? a : b);
    return (maxEvents + 2).toDouble();
  }

  Color _parseColor(String colorString) {
    // Remove # if present
    String hexColor = colorString.replaceAll('#', '');
    
    // Add alpha if not present
    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor';
    }
    
    return Color(int.parse(hexColor, radix: 16));
  }
}
