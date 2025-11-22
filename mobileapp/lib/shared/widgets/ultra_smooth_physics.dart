import 'package:flutter/material.dart';

/// Ultra-smooth physics for professional-grade swiping
class UltraSmoothPhysics extends ScrollPhysics {
  const UltraSmoothPhysics({super.parent});

  @override
  UltraSmoothPhysics applyTo(ScrollPhysics? ancestor) {
    return UltraSmoothPhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    // Custom simulation for ultra-smooth swiping
    final tolerance = this.tolerance;
    
    if (velocity.abs() >= tolerance.velocity || 
        position.outOfRange) {
      return BouncingScrollSimulation(
        spring: const SpringDescription(
          mass: 0.5, // Lighter mass for smoother movement
          stiffness: 100.0, // Higher stiffness for snappier response
          damping: 0.8, // Optimal damping for smooth deceleration
        ),
        position: position.pixels,
        velocity: velocity,
        leadingExtent: position.minScrollExtent,
        trailingExtent: position.maxScrollExtent,
        tolerance: tolerance,
      );
    }
    return null;
  }

  @override
  double get minFlingVelocity => 50.0; // Lower threshold for easier swiping

  @override
  double get maxFlingVelocity => 8000.0; // Higher max velocity for smooth fast swipes

  @override
  double get dragStartDistanceMotionThreshold => 3.0; // More sensitive to drag start
}

/// Instagram-level smooth physics
class InstagramPhysics extends ScrollPhysics {
  const InstagramPhysics({super.parent});

  @override
  InstagramPhysics applyTo(ScrollPhysics? ancestor) {
    return InstagramPhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    final tolerance = this.tolerance;
    
    if (velocity.abs() >= tolerance.velocity || 
        position.outOfRange) {
      return BouncingScrollSimulation(
        spring: const SpringDescription(
          mass: 0.3, // Very light mass
          stiffness: 150.0, // High stiffness
          damping: 0.9, // High damping for smooth stop
        ),
        position: position.pixels,
        velocity: velocity,
        leadingExtent: position.minScrollExtent,
        trailingExtent: position.maxScrollExtent,
        tolerance: tolerance,
      );
    }
    return null;
  }

  @override
  double get minFlingVelocity => 25.0; // Very low threshold

  @override
  double get maxFlingVelocity => 12000.0; // Very high max velocity

  @override
  double get dragStartDistanceMotionThreshold => 1.0; // Very sensitive
}

/// Custom page view physics for ultra-smooth navigation
class CustomPageViewPhysics extends ScrollPhysics {
  const CustomPageViewPhysics({super.parent});

  @override
  CustomPageViewPhysics applyTo(ScrollPhysics? ancestor) {
    return CustomPageViewPhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    final tolerance = this.tolerance;
    
    if (velocity.abs() >= tolerance.velocity || 
        position.outOfRange) {
      return BouncingScrollSimulation(
        spring: const SpringDescription(
          mass: 0.4, // Optimized mass
          stiffness: 120.0, // Optimized stiffness
          damping: 0.85, // Optimized damping
        ),
        position: position.pixels,
        velocity: velocity,
        leadingExtent: position.minScrollExtent,
        trailingExtent: position.maxScrollExtent,
        tolerance: tolerance,
      );
    }
    return null;
  }

  @override
  double get minFlingVelocity => 30.0; // Optimized threshold

  @override
  double get maxFlingVelocity => 10000.0; // Optimized max velocity

  @override
  double get dragStartDistanceMotionThreshold => 2.0; // Optimized sensitivity
}
