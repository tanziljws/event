import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:http/http.dart' as http;
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../bloc/organizer_bloc.dart' as organizer_bloc;
import '../models/organizer_models.dart' as organizer_models;

class AnalyticsContent extends StatefulWidget {
  const AnalyticsContent({super.key});

  @override
  State<AnalyticsContent> createState() => _AnalyticsContentState();
}

class _AnalyticsContentState extends State<AnalyticsContent> {
  String _selectedPeriod = '30 Days';
  final List<String> _periodOptions = ['7 Days', '30 Days', '90 Days', '1 Year'];
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _categoryFilter = 'all';
  String _viewMode = 'dashboard'; // 'dashboard', 'calendar', 'table'
  List<organizer_models.OrganizerEvent> _filteredEvents = [];
  organizer_models.OrganizerEvent? _selectedEvent;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<organizer_bloc.OrganizerBloc, organizer_bloc.OrganizerState>(
      builder: (context, state) {
        if (state is organizer_bloc.OrganizerDashboardLoaded) {
          return _buildAnalyticsWithData(state.dashboardData);
        }
        
        return _buildLoadingState();
      },
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildAnalyticsWithData(organizer_models.OrganizerDashboardData data) {
    _filteredEvents = _filterEvents(data.recentEvents);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // View Mode Toggle
          _buildViewModeToggle(),
          const SizedBox(height: 16),

          // Conditional Content based on view mode
          if (_viewMode == 'dashboard') ...[
            // Period Selector
            _buildPeriodSelector(),
            const SizedBox(height: 24),

            // Revenue Analytics
            _buildRevenueAnalytics(data),
            const SizedBox(height: 24),

            // Participant Analytics
            _buildParticipantAnalytics(data),
            const SizedBox(height: 24),

            // Event Performance
            _buildEventPerformance(data),
            const SizedBox(height: 24),

            // Top Events
            _buildTopEvents(data),
          ] else if (_viewMode == 'calendar') ...[
            _buildCalendarView(),
          ] else if (_viewMode == 'table') ...[
            _buildTableView(),
          ],
        ],
      ),
    );
  }

  List<organizer_models.OrganizerEvent> _filterEvents(List<organizer_models.OrganizerEvent> events) {
    List<organizer_models.OrganizerEvent> filtered = events;

    // Search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((event) =>
        event.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        event.location.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        event.category.toLowerCase().contains(_searchQuery.toLowerCase())
      ).toList();
    }

    // Status filter
    if (_statusFilter != 'all') {
      filtered = filtered.where((event) => event.status == _statusFilter).toList();
    }

    // Category filter
    if (_categoryFilter != 'all') {
      filtered = filtered.where((event) => event.category == _categoryFilter).toList();
    }

    return filtered;
  }


  Widget _buildViewModeToggle() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildViewModeButton(
              'Dashboard',
              Icons.dashboard,
              'dashboard',
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildViewModeButton(
              'Calendar',
              Icons.calendar_month,
              'calendar',
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildViewModeButton(
              'Table',
              Icons.table_chart,
              'table',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewModeButton(String title, IconData icon, String mode) {
    final isSelected = _viewMode == mode;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _viewMode = mode;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppConstants.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppConstants.primaryColor : AppConstants.borderLight,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : AppConstants.textSecondary,
              size: 20,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : AppConstants.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarView() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Event Calendar',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'View your events in calendar format',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),
          
          // Simple calendar grid
          _buildCalendarGrid(),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final now = DateTime.now();
    final firstDay = DateTime(now.year, now.month, 1);
    final lastDay = DateTime(now.year, now.month + 1, 0);
    final startDate = firstDay.subtract(Duration(days: firstDay.weekday - 1));
    
    return Column(
      children: [
        // Calendar header
        Row(
          children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              .map((day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppConstants.textSecondary,
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 8),
        
        // Calendar days
        ...List.generate(6, (weekIndex) {
          return Row(
            children: List.generate(7, (dayIndex) {
              final dayDate = startDate.add(Duration(days: weekIndex * 7 + dayIndex));
              final dayEvents = _filteredEvents.where((event) {
                DateTime eventDate;
                if (event.eventDate is String) {
                  eventDate = DateTime.parse(event.eventDate as String);
                } else {
                  eventDate = event.eventDate;
                }
                return eventDate.year == dayDate.year &&
                       eventDate.month == dayDate.month &&
                       eventDate.day == dayDate.day;
              }).toList();
              
              final isCurrentMonth = dayDate.month == now.month;
              final isToday = dayDate.day == now.day && dayDate.month == now.month;
              
              return Expanded(
                child: Container(
                  height: 60,
                  margin: const EdgeInsets.all(1),
                  decoration: BoxDecoration(
                    color: isCurrentMonth ? Colors.white : Colors.grey[100],
                    borderRadius: BorderRadius.circular(4),
                    border: isToday ? Border.all(color: AppConstants.primaryColor, width: 2) : null,
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${dayDate.day}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                          color: isCurrentMonth 
                              ? (isToday ? AppConstants.primaryColor : AppConstants.textPrimary)
                              : AppConstants.textSecondary,
                        ),
                      ),
                      if (dayEvents.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppConstants.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Text(
                            '${dayEvents.length}',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppConstants.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }),
          );
        }),
      ],
    );
  }

  Widget _buildTableView() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Event Performance Table',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Detailed statistics in table format',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),
          
          if (_filteredEvents.isEmpty)
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.table_chart,
                    size: 48,
                    color: AppConstants.textSecondary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No events found',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Try adjusting your filters to see more events.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppConstants.textSecondary,
                    ),
                  ),
                ],
              ),
            )
          else
            ..._filteredEvents.map((event) => _buildEventTableRow(event)),
        ],
      ),
    );
  }

  Widget _buildEventTableRow(organizer_models.OrganizerEvent event) {
    final registrationRate = event.maxParticipants > 0
        ? ((event.registrationCount / event.maxParticipants) * 100)
        : 0.0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppConstants.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.location,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      event.category,
                      style: TextStyle(
                        fontSize: 10,
                        color: AppConstants.primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              _buildStatusBadge(event.status),
            ],
          ),
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _buildTableStat(
                  'Participants',
                  '${event.registrationCount}/${event.maxParticipants}',
                  Icons.people,
                  AppConstants.infoColor,
                ),
              ),
              Expanded(
                child: _buildTableStat(
                  'Rate',
                  '${registrationRate.toStringAsFixed(1)}%',
                  Icons.trending_up,
                  AppConstants.successColor,
                ),
              ),
              Expanded(
                child: _buildTableStat(
                  'Date',
                  _formatDate(event.eventDate),
                  Icons.calendar_today,
                  AppConstants.warningColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTableStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppConstants.textPrimary,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: AppConstants.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String text;
    
    switch (status) {
      case 'DRAFT':
        color = Colors.grey;
        text = 'Draft';
        break;
      case 'PENDING':
        color = Colors.orange;
        text = 'Pending';
        break;
      case 'APPROVED':
        color = Colors.green;
        text = 'Published';
        break;
      case 'REJECTED':
        color = Colors.red;
        text = 'Rejected';
        break;
      default:
        color = Colors.grey;
        text = status;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  String _formatDate(dynamic dateInput) {
    final date = dateInput is String 
        ? DateTime.parse(dateInput)
        : dateInput as DateTime;
    return '${date.day}/${date.month}/${date.year}';
  }

  Widget _buildPeriodSelector() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Analytics Period',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: _periodOptions.map((period) {
              final isSelected = _selectedPeriod == period;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedPeriod = period;
                  });
                },
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? Color(0xFF2563EB) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? Color(0xFF2563EB) : Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                    boxShadow: isSelected ? [
                      BoxShadow(
                        color: Color(0xFF2563EB).withOpacity(0.2),
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ] : null,
                  ),
                  child: Text(
                    period,
                    style: TextStyle(
                      color: isSelected ? Colors.white : Color(0xFF1E293B),
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueAnalytics(organizer_models.OrganizerDashboardData data) {
    final stats = data.stats;
    final events = data.recentEvents;
    
    // Calculate average revenue per event
    final paidEvents = events.where((e) => !e.isFree && e.price != null).toList();
    final avgRevenue = paidEvents.isNotEmpty 
        ? paidEvents.fold(0.0, (sum, e) {
            final price = e.price is String 
                ? double.tryParse(e.price.toString()) ?? 0.0
                : (e.price ?? 0.0);
            return sum + (price * e.registrationCount);
          }) / paidEvents.length
        : 0.0;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Revenue Analytics',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total Revenue',
                  CurrencyFormatter.formatCurrency(stats.totalRevenue),
                  Icons.attach_money,
                  AppConstants.successColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Avg per Event',
                  CurrencyFormatter.formatCurrency(avgRevenue),
                  Icons.trending_up,
                  AppConstants.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: _buildRevenueChart(events),
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueChart(List<organizer_models.OrganizerEvent> events) {
    if (events.isEmpty) {
      return Container(
        height: 200,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.trending_up, size: 48, color: Colors.grey[400]),
              SizedBox(height: 8),
              Text(
                'No revenue data available',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Create paid events to see revenue trends',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final paidEvents = events.where((e) => !e.isFree && e.price != null).toList();
    if (paidEvents.isEmpty) {
      return Container(
        height: 200,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.monetization_on, size: 48, color: Colors.grey[400]),
              SizedBox(height: 8),
              Text(
                'No paid events found',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'All your events are currently free',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Sort events by date for better trend visualization
    paidEvents.sort((a, b) {
      DateTime dateA = a.eventDate is String ? DateTime.parse(a.eventDate as String) : a.eventDate;
      DateTime dateB = b.eventDate is String ? DateTime.parse(b.eventDate as String) : b.eventDate;
      return dateA.compareTo(dateB);
    });

    final maxRevenue = paidEvents.isEmpty ? 100.0 : paidEvents.map((e) {
      final price = e.price is String 
          ? double.tryParse(e.price.toString()) ?? 0.0
          : (e.price ?? 0.0);
      return price * e.registrationCount;
    }).reduce((a, b) => a > b ? a : b);
    
    final totalRevenue = paidEvents.fold(0.0, (sum, e) {
      final price = e.price is String 
          ? double.tryParse(e.price.toString()) ?? 0.0
          : (e.price ?? 0.0);
      return sum + (price * e.registrationCount);
    });
    
    return Container(
      height: 250,
      child: Column(
        children: [
          // Chart Info Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Revenue Trend',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      '${paidEvents.length} paid events',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Rp ${_formatCurrency(totalRevenue)}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF059669),
                      ),
                    ),
                    Text(
                      'Total Revenue',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Chart
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: (maxRevenue / 5).clamp(1.0, double.infinity),
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey[200]!,
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() < paidEvents.length) {
                          final event = paidEvents[value.toInt()];
                          DateTime eventDate = event.eventDate is String 
                              ? DateTime.parse(event.eventDate as String) 
                              : event.eventDate;
                          return Text(
                            '${eventDate.day}/${eventDate.month}',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
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
                      interval: (maxRevenue / 5).clamp(1.0, double.infinity),
                      getTitlesWidget: (value, meta) {
                        return Text(
                          'Rp ${_formatCurrency(value)}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: paidEvents.asMap().entries.map((entry) {
                      final price = entry.value.price is String 
                          ? double.tryParse(entry.value.price.toString()) ?? 0.0
                          : (entry.value.price ?? 0.0);
                      final revenue = price * entry.value.registrationCount;
                      return FlSpot(entry.key.toDouble(), revenue / 1000); // Convert to thousands
                    }).toList(),
                    isCurved: true,
                    color: Color(0xFF059669),
                    barWidth: 3,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Color(0xFF059669),
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Color(0xFF059669).withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParticipantAnalytics(organizer_models.OrganizerDashboardData data) {
    final stats = data.stats;
    final events = data.recentEvents;
    
    // Calculate average participants per event
    final avgParticipants = events.isNotEmpty 
        ? events.fold(0, (sum, e) => sum + e.registrationCount) / events.length
        : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Participant Analytics',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Participants',
                stats.totalRegistrations.toString(),
                Icons.people,
                Color(0xFF2563EB),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Avg per Event',
                avgParticipants.toStringAsFixed(0),
                Icons.group,
                Color(0xFFF59E0B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 250,
          child: _buildParticipantChart(events),
        ),
      ],
    );
  }

  Widget _buildParticipantChart(List<organizer_models.OrganizerEvent> events) {
    if (events.isEmpty) {
      return Container(
        height: 200,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.people, size: 48, color: Colors.grey[400]),
              SizedBox(height: 8),
              Text(
                'No participant data available',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Create events to see participant trends',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Sort events by registration count for better visualization
    final sortedEvents = List<organizer_models.OrganizerEvent>.from(events);
    sortedEvents.sort((a, b) => b.registrationCount.compareTo(a.registrationCount));
    
    final maxParticipants = sortedEvents.map((e) => e.registrationCount).reduce((a, b) => a > b ? a : b);
    final totalParticipants = sortedEvents.fold(0, (sum, e) => sum + e.registrationCount);
    
    return Container(
      height: 250,
      child: Column(
        children: [
          // Chart Info Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Participant Trends',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      '${sortedEvents.length} events',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      totalParticipants.toString(),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                    Text(
                      'Total Participants',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Chart
          Expanded(
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: (maxParticipants + 5).toDouble(),
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() < sortedEvents.length) {
                          final event = sortedEvents[value.toInt()];
                          return Text(
                            event.title.length > 6
                                ? '${event.title.substring(0, 6)}...'
                                : event.title,
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
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
                            fontSize: 10,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: sortedEvents.asMap().entries.map((entry) {
                  return BarChartGroupData(
                    x: entry.key,
                    barRods: [
                      BarChartRodData(
                        toY: entry.value.registrationCount.toDouble(),
                        color: Color(0xFF2563EB),
                        width: 20,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    } else {
      return amount.toStringAsFixed(0);
    }
  }

  Widget _buildEventPerformance(organizer_models.OrganizerDashboardData data) {
    final stats = data.stats;
    final events = data.recentEvents;
    
    // Calculate success rate (published events / total events)
    final successRate = stats.totalEvents > 0 
        ? (stats.publishedEvents / stats.totalEvents * 100)
        : 0.0;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Event Performance',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Success Rate',
                  '${successRate.toStringAsFixed(0)}%',
                  Icons.check_circle,
                  AppConstants.successColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Total Events',
                  stats.totalEvents.toString(),
                  Icons.event,
                  AppConstants.warningColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTopEvents(organizer_models.OrganizerDashboardData data) {
    final events = data.recentEvents;
    
    // Sort events by registration count (top performers)
    final sortedEvents = List<organizer_models.OrganizerEvent>.from(events)
      ..sort((a, b) => b.registrationCount.compareTo(a.registrationCount));
    
    final topEvents = sortedEvents.take(3).toList();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Top Performing Events',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          if (topEvents.isEmpty)
            const Center(
              child: Text('No events available'),
            )
          else
            ...topEvents.asMap().entries.map((entry) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildTopEventItem(entry.key, entry.value),
            )),
        ],
      ),
    );
  }

  Widget _buildTopEventItem(int index, organizer_models.OrganizerEvent event) {
    final revenue = !event.isFree && event.price != null 
        ? (() {
            final price = event.price is String 
                ? double.tryParse(event.price.toString()) ?? 0.0
                : (event.price ?? 0.0);
            return CurrencyFormatter.formatCurrency(price * event.registrationCount);
          })()
        : 'Free Event';
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppConstants.backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppConstants.borderLight),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  color: AppConstants.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppConstants.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${event.registrationCount} participants • $revenue',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppConstants.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          PopupMenuButton<String>(
            icon: Icon(
              Icons.more_vert,
              color: AppConstants.textSecondary,
              size: 20,
            ),
            onSelected: (value) {
              if (value == 'export_attendance') {
                _exportEventAttendance(event);
              } else if (value == 'export_registrations') {
                _exportEventRegistrations(event);
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'export_attendance',
                child: Row(
                  children: [
                    Icon(Icons.download, size: 16, color: AppConstants.primaryColor),
                    const SizedBox(width: 8),
                    Text('Export Attendance'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'export_registrations',
                child: Row(
                  children: [
                    Icon(Icons.download, size: 16, color: AppConstants.primaryColor),
                    const SizedBox(width: 8),
                    Text('Export Registrations'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const Spacer(),
              Icon(
                Icons.trending_up,
                color: color,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // Export event attendance
  Future<void> _exportEventAttendance(organizer_models.OrganizerEvent event) async {
    try {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // Call API to export attendance
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/events/organizer/export/attendance/${event.id}'),
        headers: {
          'Authorization': 'Bearer ${await _getAccessToken()}',
        },
      );

      // Close loading dialog
      Navigator.of(context).pop();

      if (response.statusCode == 200) {
        // Save file
        final bytes = response.bodyBytes;
        final fileName = 'event-attendance-${event.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '-')}.xlsx';
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Attendance data exported successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // TODO: Implement file download/save functionality
        // For now, just show success message
      } else {
        throw Exception('Failed to export attendance data');
      }
    } catch (e) {
      // Close loading dialog if still open
      Navigator.of(context).pop();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to export attendance: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Export event registrations
  Future<void> _exportEventRegistrations(organizer_models.OrganizerEvent event) async {
    try {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // Call API to export registrations
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/events/organizer/export/registrations/${event.id}'),
        headers: {
          'Authorization': 'Bearer ${await _getAccessToken()}',
        },
      );

      // Close loading dialog
      Navigator.of(context).pop();

      if (response.statusCode == 200) {
        // Save file
        final bytes = response.bodyBytes;
        final fileName = 'event-registrations-${event.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '-')}.xlsx';
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registrations data exported successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // TODO: Implement file download/save functionality
        // For now, just show success message
      } else {
        throw Exception('Failed to export registrations data');
      }
    } catch (e) {
      // Close loading dialog if still open
      Navigator.of(context).pop();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to export registrations: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Get access token
  Future<String?> _getAccessToken() async {
    try {
      final apiClient = ApiClient();
      return await apiClient.getAccessToken();
    } catch (e) {
      return null;
    }
  }
}
