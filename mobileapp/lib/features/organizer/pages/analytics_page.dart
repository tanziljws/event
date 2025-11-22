import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/bottom_navigation.dart';
import '../../../shared/services/navigation_service.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../widgets/analytics_content.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    // Initialize analytics data
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Call super.build for AutomaticKeepAliveClientMixin
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is! AuthAuthenticated) {
          return const Scaffold(
            body: Center(child: Text('Please login first')),
          );
        }

        return Scaffold(
          backgroundColor: AppConstants.backgroundColor,
          appBar: AppBar(
            title: const Text('Analytics'),
            backgroundColor: AppConstants.cardColor,
            foregroundColor: AppConstants.textPrimary,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.go('/dashboard'),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  // Refresh analytics data
                },
              ),
            ],
          ),
          body: const AnalyticsContent(),
          bottomNavigationBar: BottomNavigation(
            currentIndex: NavigationService().currentIndex,
          ),
        );
      },
    );
  }
}
