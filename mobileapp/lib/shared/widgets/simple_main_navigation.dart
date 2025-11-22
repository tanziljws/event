import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/pages/home_page.dart';
import '../../features/events/pages/events_page.dart';
import '../../features/dashboard/pages/dashboard_page.dart';
import '../../features/notifications/pages/notifications_page.dart';
import '../../features/profile/pages/simple_profile_page.dart';
import '../../core/constants/app_constants.dart';

class SimpleMainNavigation extends StatefulWidget {
  final int initialIndex;
  
  const SimpleMainNavigation({
    super.key,
    this.initialIndex = 0,
  });

  @override
  State<SimpleMainNavigation> createState() => _SimpleMainNavigationState();
}

class _SimpleMainNavigationState extends State<SimpleMainNavigation> {
  late int _currentIndex;
  late PageController _pageController;

  final List<Widget> _pages = [
    const HomePage(),
    const EventsPage(),
    const DashboardPage(),
    const NotificationsPage(),
    const SimpleProfilePage(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
      });
      
      // Update URL based on current page
      switch (index) {
        case 0:
          context.go('/home');
          break;
        case 1:
          context.go('/events');
          break;
        case 2:
          context.go('/dashboard');
          break;
        case 3:
          context.go('/notifications');
          break;
        case 4:
          context.go('/profile');
          break;
      }
    }
  }

  void _onBottomNavTap(int index) {
    if (_currentIndex != index) {
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: PageView(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        physics: const NeverScrollableScrollPhysics(), // Disable swipe
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onBottomNavTap,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: AppConstants.primaryColor,
        unselectedItemColor: Colors.grey,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notifications',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}