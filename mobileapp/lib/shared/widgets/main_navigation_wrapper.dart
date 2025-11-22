import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/pages/home_page.dart';
import '../../features/events/pages/events_page.dart';
import '../../features/dashboard/pages/dashboard_page.dart';
import '../../features/notifications/pages/notifications_page.dart';
import '../../features/profile/pages/simple_profile_page.dart';
import 'bottom_navigation.dart';
import 'optimized_page_view.dart';
import '../services/navigation_service.dart';
import '../../core/constants/app_constants.dart';

class MainNavigationWrapper extends StatefulWidget {
  final int initialIndex;
  
  const MainNavigationWrapper({
    super.key,
    this.initialIndex = 0,
  });

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> with AutomaticKeepAliveClientMixin {
  late PageController _pageController;
  late int _currentIndex;
  
  // Aggressive caching for smooth performance
  final Map<int, Widget> _pageCache = {};
  static const int _maxCacheSize = 10; // Cache all pages + extras
  
  // Debouncing for smooth navigation
  DateTime? _lastNavigationTime;
  static const Duration _navigationDebounce = Duration(milliseconds: 100);

  @override
  bool get wantKeepAlive => true; // Keep pages alive for smooth navigation

  // List of all main pages - aggressive preloading for better performance
  List<Widget Function()>? _pageBuilders;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    
    // Initialize page builders for lazy loading
    _pageBuilders = [
      () => const HomePage(),
      () => const EventsPage(),
      () => const DashboardPage(),
      () => const NotificationsPage(),
      () => const SimpleProfilePage(),
    ];
    
    // Optimized PageController for smooth navigation
    _pageController = PageController(
      initialPage: _currentIndex,
      keepPage: true, // Keep pages in memory for better performance
      viewportFraction: 1.0, // Full width pages
    );
    
    // Aggressive preloading for smooth performance
    _preloadAllPages();
    
    // Listen to navigation service changes
    NavigationService().addListener(_onNavigationChanged);
  }

  @override
  void dispose() {
    _pageController.dispose();
    NavigationService().removeListener(_onNavigationChanged);
    super.dispose();
  }

  void _onNavigationChanged() {
    final newIndex = NavigationService().currentIndex;
    if (newIndex != _currentIndex) {
      // Debounce navigation to prevent rapid changes
      final now = DateTime.now();
      if (_lastNavigationTime != null && 
          now.difference(_lastNavigationTime!) < _navigationDebounce) {
        return;
      }
      _lastNavigationTime = now;
      
      // Always use smooth animation for better UX
      _pageController.animateToPage(
        newIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOutCubic,
      );
      _currentIndex = newIndex;
      // Only call setState if widget is still mounted
      if (mounted) {
        setState(() {});
      }
    }
  }

  void _onPageChanged(int index) {
    // Debounce page changes to prevent rapid navigation
    final now = DateTime.now();
    if (_lastNavigationTime != null && 
        now.difference(_lastNavigationTime!) < _navigationDebounce) {
      return;
    }
    _lastNavigationTime = now;
    
    // Only update if index actually changed
    if (_currentIndex == index) return;
    
    // Preload adjacent pages for smooth performance
    _preloadPage(index - 1);
    _preloadPage(index + 1);
    
    // Clean up cache
    _cleanupCache(index);
    
    _currentIndex = index;
    
    // Update navigation service (but don't trigger animation to prevent loop)
    NavigationService().setIndex(index, notifyListeners: false);
    
    // Navigate using GoRouter (this will update the URL)
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
    
    // Only call setState if widget is still mounted
    if (mounted) {
      setState(() {});
    }
  }
  
  // Aggressive preloading for smooth performance
  void _preloadAllPages() {
    if (_pageBuilders == null) return;
    
    // Preload all pages for instant navigation
    for (int i = 0; i < _pageBuilders!.length; i++) {
      _preloadPage(i);
    }
  }
  
  void _preloadPage(int index) {
    if (_pageBuilders == null || 
        index < 0 || 
        index >= _pageBuilders!.length ||
        _pageCache.containsKey(index)) {
      return;
    }
    
    // Cache the page widget
    _pageCache[index] = _pageBuilders![index]();
  }
  
  void _cleanupCache(int currentIndex) {
    // Keep current page and adjacent pages, clean up distant ones
    if (_pageCache.length > _maxCacheSize) {
      final keysToRemove = <int>[];
      for (final key in _pageCache.keys) {
        if ((key - currentIndex).abs() > 2) {
          keysToRemove.add(key);
        }
      }
      
      for (final key in keysToRemove) {
        _pageCache.remove(key);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Call super.build for AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: OptimizedPageView(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        pageBuilders: _pageBuilders ?? [],
        initialPage: _currentIndex,
        physics: const NeverScrollableScrollPhysics(),
      ),
      bottomNavigationBar: BottomNavigation(currentIndex: _currentIndex),
    );
  }
}

