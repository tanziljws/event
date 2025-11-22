import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:animated_notch_bottom_bar/animated_notch_bottom_bar/animated_notch_bottom_bar.dart';

class NavigationService {
  static final NavigationService _instance = NavigationService._internal();
  factory NavigationService() => _instance;
  NavigationService._internal();

  late NotchBottomBarController _controller;
  int _currentIndex = 0;
  final List<VoidCallback> _listeners = [];

  void initialize() {
    _controller = NotchBottomBarController(index: 0);
  }

  NotchBottomBarController get controller => _controller;

  void setIndex(int index, {bool notifyListeners = true}) {
    if (_currentIndex == index) return; // Prevent unnecessary updates
    
    _currentIndex = index;
    _controller.jumpTo(index);
    
    if (notifyListeners) {
      _notifyListeners();
    }
  }

  int get currentIndex => _currentIndex;

  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  void dispose() {
    _controller.dispose();
    _listeners.clear();
  }

  // Organizer-specific navigation methods
  static int getOrganizerIndex(String route) {
    switch (route) {
      case '/organizer-dashboard':
        return 0;
      case '/my-events':
        return 1;
      case '/analytics':
        return 2;
      default:
        return 0;
    }
  }

  static void navigateToOrganizerPage(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/organizer-dashboard');
        break;
      case 1:
        context.go('/my-events');
        break;
      case 2:
        context.go('/analytics');
        break;
      default:
        context.go('/organizer-dashboard');
    }
  }
}
