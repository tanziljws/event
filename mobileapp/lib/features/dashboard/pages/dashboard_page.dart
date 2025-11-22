import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../events/bloc/event_bloc.dart';
import '../../../core/constants/app_constants.dart';
import '../widgets/dashboard_content.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true; // Keep page alive for smooth navigation
  
  @override
  void initState() {
    super.initState();
    // Load user stats and latest events
    context.read<EventBloc>().add(
      const EventLoadRequested(
        page: 1,
        limit: 3,
        isPublished: true,
        sortBy: 'eventDate',
        sortOrder: 'asc',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Call super.build for AutomaticKeepAliveClientMixin
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is AuthAuthenticated) {
          return _buildDashboard(context, authState);
        }
        return Scaffold(
          backgroundColor: AppConstants.backgroundColor,
          body: const Center(
            child: Text('Please log in to access dashboard'),
          ),
        );
      },
    );
  }

  Widget _buildDashboard(BuildContext context, AuthAuthenticated authState) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: DashboardContent(authState: authState),
      // BottomNavigationBar is now handled by MainNavigationWrapper
    );
  }
}