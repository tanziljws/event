import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../organizer/bloc/organizer_bloc.dart' as organizer_bloc;
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/services/switch_account_service.dart';
import 'dashboard_header.dart';
import 'dashboard_stats.dart';
import 'dashboard_quick_actions.dart';
import 'dashboard_recent_events.dart';
import 'organizer_chart.dart';

class DashboardContent extends StatefulWidget {
  final AuthAuthenticated authState;

  const DashboardContent({
    super.key,
    required this.authState,
  });

  @override
  State<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends State<DashboardContent> {
  @override
  void initState() {
    super.initState();
    _loadOrganizerDashboard();
  }

  void _loadOrganizerDashboard() async {
    final isApprovedOrganizer = await _isApprovedOrganizer(widget.authState.user);
    if (isApprovedOrganizer) {
      context.read<organizer_bloc.OrganizerBloc>().add(
        organizer_bloc.LoadOrganizerDashboard(organizerId: widget.authState.user.id),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _isParticipant(widget.authState.user),
      builder: (context, participantSnapshot) {
        return FutureBuilder<bool>(
          future: _isApprovedOrganizer(widget.authState.user),
          builder: (context, organizerSnapshot) {
            final isParticipant = participantSnapshot.data ?? false;
            final isApprovedOrganizer = organizerSnapshot.data ?? false;
            
            return SingleChildScrollView(
              physics: const ClampingScrollPhysics(), // Smoother scrolling
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Information
                    DashboardHeader(authState: widget.authState),
                    const SizedBox(height: 24),

                    // Stats Cards (only for participants)
                    if (isParticipant) ...[
                      const DashboardStats(),
                      const SizedBox(height: 32),
                    ],

                    // Organizer Dashboard (only for approved organizers)
                    if (isApprovedOrganizer) ...[
                      _buildOrganizerDashboard(context),
                      const SizedBox(height: 24),
                      _buildOrganizerChart(context),
                      const SizedBox(height: 32),
                    ],

                    // Quick Actions
                    DashboardQuickActions(authState: widget.authState),
                    const SizedBox(height: 32),

                    // Latest Events Section
                    const DashboardRecentEvents(),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // Helper method to determine if user should be treated as participant
  Future<bool> _isParticipant(dynamic user) async {
    // Check if user is currently in participant mode via switch account
    final isInParticipantMode = await SwitchAccountService.isInParticipantMode();
    if (isInParticipantMode) {
      return true;
    }
    
    // Original logic for non-switched users
    if (user.role == 'PARTICIPANT') {
      return true;
    }
    if (user.role == 'ORGANIZER') {
      // Only approved organizers get organizer dashboard
      return user.verificationStatus != 'APPROVED';
    }
    return true; // Default to participant for other roles
  }

  // Helper method to determine if user is approved organizer
  Future<bool> _isApprovedOrganizer(dynamic user) async {
    // Check if user is currently in organizer mode via switch account
    final isInOrganizerMode = await SwitchAccountService.isInOrganizerMode();
    if (isInOrganizerMode && user.role == 'ORGANIZER' && user.verificationStatus == 'APPROVED') {
      return true;
    }
    
    // If user is in participant mode, don't show organizer dashboard
    final isInParticipantMode = await SwitchAccountService.isInParticipantMode();
    if (isInParticipantMode) {
      return false;
    }
    
    // Original logic for non-switched users
    return user.role == 'ORGANIZER' && user.verificationStatus == 'APPROVED';
  }

  Widget _buildOrganizerDashboard(BuildContext context) {
    return BlocBuilder<organizer_bloc.OrganizerBloc, organizer_bloc.OrganizerState>(
      builder: (context, state) {
        if (state is organizer_bloc.OrganizerDashboardLoaded) {
          final stats = state.dashboardData.stats;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Organizer Dashboard',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),
              // Ultra compact layout - all 4 items in 1 row (same as participant)
              Row(
                children: [
                  Expanded(
                    child: CompactStatCard(
                      title: 'Total Events',
                      value: stats.totalEvents.toString(),
                      color: const Color(0xFF2563EB),
                      onTap: () => context.go('/my-events'),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: CompactStatCard(
                      title: 'Total Participants',
                      value: stats.totalRegistrations.toString(),
                      color: const Color(0xFF10B981),
                      onTap: () => context.go('/analytics'),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: CompactStatCard(
                      title: 'Revenue',
                      value: CurrencyFormatter.formatCompact(stats.totalRevenue),
                      color: const Color(0xFFF59E0B),
                      onTap: () => context.go('/analytics'),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: CompactStatCard(
                      title: 'Published',
                      value: stats.publishedEvents.toString(),
                      color: const Color(0xFF8B5CF6),
                      onTap: () => context.go('/analytics'),
                    ),
                  ),
                ],
              ),
            ],
          );
        }

        // Show loading or fallback to mock data
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Organizer Dashboard',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            // Ultra compact layout - all 4 items in 1 row (same as participant)
            Row(
              children: [
                Expanded(
                  child: CompactStatCard(
                    title: 'Total Events',
                    value: 'Loading...',
                    color: const Color(0xFF2563EB),
                    onTap: () => context.go('/my-events'),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: CompactStatCard(
                    title: 'Total Participants',
                    value: 'Loading...',
                    color: const Color(0xFF10B981),
                    onTap: () => context.go('/analytics'),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: CompactStatCard(
                    title: 'Revenue',
                    value: 'Loading...',
                    color: const Color(0xFFF59E0B),
                    onTap: () => context.go('/analytics'),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: CompactStatCard(
                    title: 'Published',
                    value: 'Loading...',
                    color: const Color(0xFF8B5CF6),
                    onTap: () => context.go('/analytics'),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildOrganizerChart(BuildContext context) {
    return BlocBuilder<organizer_bloc.OrganizerBloc, organizer_bloc.OrganizerState>(
      builder: (context, state) {
        if (state is organizer_bloc.OrganizerDashboardLoaded) {
          final stats = state.dashboardData.stats;
          return OrganizerChart(
            totalEvents: stats.totalEvents,
            totalParticipants: stats.totalRegistrations,
            totalRevenue: stats.totalRevenue,
            publishedEvents: stats.publishedEvents,
          );
        }

        // Show loading chart with mock data
        return OrganizerChart(
          totalEvents: 0,
          totalParticipants: 0,
          totalRevenue: 0,
          publishedEvents: 0,
        );
      },
    );
  }

}

