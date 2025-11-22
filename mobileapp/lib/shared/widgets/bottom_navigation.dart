import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_constants.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../services/navigation_service.dart';

class BottomNavigation extends StatefulWidget {
  final int currentIndex;

  const BottomNavigation({
    super.key,
    required this.currentIndex,
  });

  @override
  State<BottomNavigation> createState() => _BottomNavigationState();
}

class _BottomNavigationState extends State<BottomNavigation> {
  DateTime? _lastTapTime;
  static const Duration _tapDebounce = Duration(milliseconds: 200);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: widget.currentIndex,
        onTap: (index) => _onTap(context, index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: AppConstants.primaryColor,
        unselectedItemColor: Colors.grey,
        showSelectedLabels: false, // Hide labels
        showUnselectedLabels: false, // Hide labels
        iconSize: 24, // Bigger icons
        elevation: 0,
        items: [
          BottomNavigationBarItem(
            icon: Icon(
              widget.currentIndex == 0 ? Icons.home_rounded : Icons.home_outlined,
              size: 24,
            ),
            label: '', // Empty label
          ),
          BottomNavigationBarItem(
            icon: Icon(
              widget.currentIndex == 1 ? Icons.calendar_today_rounded : Icons.calendar_today_outlined,
              size: 24,
            ),
            label: '', // Empty label
          ),
          BottomNavigationBarItem(
            icon: Icon(
              widget.currentIndex == 2 ? Icons.dashboard_rounded : Icons.dashboard_outlined,
              size: 24,
            ),
            label: '', // Empty label
          ),
          BottomNavigationBarItem(
            icon: Icon(
              widget.currentIndex == 3 ? Icons.notifications_rounded : Icons.notifications_outlined,
              size: 24,
            ),
            label: '', // Empty label
          ),
          BottomNavigationBarItem(
            icon: Icon(
              widget.currentIndex == 4 ? Icons.account_circle_rounded : Icons.account_circle_outlined,
              size: 24,
            ),
            label: '', // Empty label
          ),
        ],
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    // Debounce taps to prevent rapid navigation
    final now = DateTime.now();
    if (_lastTapTime != null && 
        now.difference(_lastTapTime!) < _tapDebounce) {
      return;
    }
    _lastTapTime = now;
    
    final authState = context.read<AuthBloc>().state;
    final isAuthenticated = authState is AuthAuthenticated;
    
    // Update navigation service
    NavigationService().setIndex(index);
    
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/events');
        break;
      case 2:
        // Dashboard requires authentication
        if (isAuthenticated) {
          context.go('/dashboard');
        } else {
          context.go('/login');
        }
        break;
      case 3:
        // Notifications require authentication
        if (isAuthenticated) {
          context.go('/notifications');
        } else {
          context.go('/login');
        }
        break;
      case 4:
        // Profile requires authentication
        if (isAuthenticated) {
          context.go('/profile');
        } else {
          context.go('/login');
        }
        break;
    }
  }
}
