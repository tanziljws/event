import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NavigationHistoryManager {
  static final NavigationHistoryManager _instance = NavigationHistoryManager._internal();
  factory NavigationHistoryManager() => _instance;
  NavigationHistoryManager._internal();

  final List<String> _history = [];
  final List<String> _excludedRoutes = [
    '/splash',
    '/onboarding',
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ];

  /// Add route to history
  void addRoute(String route) {
    // Don't add excluded routes to history
    if (_excludedRoutes.contains(route)) {
      return;
    }

    // Don't add duplicate consecutive routes
    if (_history.isEmpty || _history.last != route) {
      _history.add(route);
      
      // Limit history size to prevent memory issues
      if (_history.length > 20) {
        _history.removeAt(0);
      }
      
      print('🧭 Navigation History: Added $route (Total: ${_history.length})');
    }
  }

  /// Get previous route
  String? getPreviousRoute() {
    if (_history.length < 2) {
      return null;
    }
    
    // Get the second-to-last route (previous route)
    return _history[_history.length - 2];
  }

  /// Get current route
  String? getCurrentRoute() {
    if (_history.isEmpty) {
      return null;
    }
    return _history.last;
  }

  /// Remove current route from history (when going back)
  void removeCurrentRoute() {
    if (_history.isNotEmpty) {
      final removed = _history.removeLast();
      print('🧭 Navigation History: Removed $removed (Total: ${_history.length})');
    }
  }

  /// Clear history
  void clearHistory() {
    _history.clear();
    print('🧭 Navigation History: Cleared');
  }

  /// Get full history (for debugging)
  List<String> getHistory() {
    return List.from(_history);
  }

  /// Check if there's a previous route
  bool hasPreviousRoute() {
    return _history.length >= 2;
  }

  /// Smart back navigation
  String? getSmartBackRoute() {
    if (!hasPreviousRoute()) {
      return '/home'; // Default fallback
    }
    
    final previousRoute = getPreviousRoute();
    print('🧭 Smart Back: Going to $previousRoute');
    return previousRoute;
  }
}

/// Extension to add smart back functionality to BuildContext
extension SmartBackNavigation on BuildContext {
  /// Navigate back to previous route in history
  void smartBack() {
    final historyManager = NavigationHistoryManager();
    final previousRoute = historyManager.getSmartBackRoute();
    
    if (previousRoute != null) {
      // Remove current route from history before navigating
      historyManager.removeCurrentRoute();
      go(previousRoute);
    } else {
      // Fallback to default back
      pop();
    }
  }
  
  /// Check if smart back is available
  bool canSmartBack() {
    final historyManager = NavigationHistoryManager();
    return historyManager.hasPreviousRoute();
  }
}
