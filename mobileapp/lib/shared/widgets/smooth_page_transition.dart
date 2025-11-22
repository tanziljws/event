import 'package:flutter/material.dart';

/// Professional-grade page transition for ultra-smooth navigation
class SmoothPageTransition extends PageTransitionsBuilder {
  const SmoothPageTransition();

  @override
  Widget buildTransitions<T extends Object?>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Use professional easing curves for smooth transitions
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutQuart, // Professional smooth curve
      reverseCurve: Curves.easeInQuart,
    );

    // Slide transition with optimized performance
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(1.0, 0.0),
        end: Offset.zero,
      ).animate(curvedAnimation),
      child: FadeTransition(
        opacity: curvedAnimation,
        child: child,
      ),
    );
  }
}

/// Custom page route with optimized performance
class SmoothPageRoute<T> extends PageRouteBuilder<T> {
  final Widget child;
  final Duration transitionDuration;

  SmoothPageRoute({
    required this.child,
    this.transitionDuration = const Duration(milliseconds: 200),
    RouteSettings? settings,
  }) : super(
          settings: settings,
          transitionDuration: transitionDuration,
          reverseTransitionDuration: transitionDuration,
          pageBuilder: (context, animation, secondaryAnimation) => child,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            // Use professional easing curves for smooth transitions
            final curvedAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutQuart, // Professional smooth curve
              reverseCurve: Curves.easeInQuart,
            );

            // Slide transition with optimized performance
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1.0, 0.0),
                end: Offset.zero,
              ).animate(curvedAnimation),
              child: FadeTransition(
                opacity: curvedAnimation,
                child: child,
              ),
            );
          },
        );
}

/// Optimized page view with professional physics
class OptimizedPageView extends StatelessWidget {
  final PageController? controller;
  final ValueChanged<int>? onPageChanged;
  final List<Widget> children;
  final bool allowImplicitScrolling;

  const OptimizedPageView({
    super.key,
    this.controller,
    this.onPageChanged,
    required this.children,
    this.allowImplicitScrolling = true,
  });

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: controller,
      onPageChanged: onPageChanged,
      allowImplicitScrolling: allowImplicitScrolling,
      physics: const BouncingScrollPhysics(), // Professional iOS-style physics
      itemCount: children.length,
      itemBuilder: (context, index) {
        return RepaintBoundary( // Optimize rendering for each page
          child: children[index],
        );
      },
    );
  }
}
