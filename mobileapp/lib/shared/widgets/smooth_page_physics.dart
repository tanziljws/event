import 'package:flutter/material.dart';
import 'dart:math' as math;

/// Custom physics for smooth PageView scrolling
class SmoothPagePhysics extends ScrollPhysics {
  const SmoothPagePhysics({super.parent});

  @override
  SmoothPagePhysics applyTo(ScrollPhysics? ancestor) {
    return SmoothPagePhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    // If we're out of range and not headed back in range, defer to the parent
    // ballistics, which should put us back in range at a page boundary.
    if ((velocity <= 0.0 && position.pixels <= position.minScrollExtent) ||
        (velocity >= 0.0 && position.pixels >= position.maxScrollExtent)) {
      return super.createBallisticSimulation(position, velocity);
    }

    // Only create simulation if out of range, not based on velocity
    // This prevents auto next page based on velocity threshold
    if (position.outOfRange) {
      return SmoothPageSimulation(
        position.pixels,
        velocity,
        tolerance,
        position.minScrollExtent,
        position.maxScrollExtent,
      );
    }
    return null;
  }

  @override
  double get minFlingVelocity => 50.0;

  @override
  double get maxFlingVelocity => 8000.0;

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 0.5,
        stiffness: 100.0,
        damping: 0.8,
      );
}

/// Custom simulation for smooth page transitions
class SmoothPageSimulation extends Simulation {
  SmoothPageSimulation(
    this.start,
    this.velocity,
    this.tolerance,
    this.minScrollExtent,
    this.maxScrollExtent,
  );

  final double start;
  final double velocity;
  final Tolerance tolerance;
  final double minScrollExtent;
  final double maxScrollExtent;

  @override
  double x(double time) {
    return _clamp(start + velocity * time);
  }

  @override
  double dx(double time) {
    return velocity;
  }

  @override
  bool isDone(double time) {
    return x(time) == _clamp(x(time)) && dx(time).abs() < tolerance.velocity;
  }

  double _clamp(double value) {
    return value.clamp(minScrollExtent, maxScrollExtent);
  }
}

/// Ultra smooth physics for PageView
class UltraSmoothPagePhysics extends ScrollPhysics {
  const UltraSmoothPagePhysics({super.parent});

  @override
  UltraSmoothPagePhysics applyTo(ScrollPhysics? ancestor) {
    return UltraSmoothPagePhysics(parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    // If we're out of range and not headed back in range, defer to the parent
    // ballistics, which should put us back in range at a page boundary.
    if ((velocity <= 0.0 && position.pixels <= position.minScrollExtent) ||
        (velocity >= 0.0 && position.pixels >= position.maxScrollExtent)) {
      return super.createBallisticSimulation(position, velocity);
    }

    // Only create simulation if out of range, not based on velocity
    // This prevents auto next page based on velocity threshold
    if (position.outOfRange) {
      return UltraSmoothPageSimulation(
        position.pixels,
        velocity,
        tolerance,
        position.minScrollExtent,
        position.maxScrollExtent,
      );
    }
    return null;
  }

  @override
  double get minFlingVelocity => 25.0;

  @override
  double get maxFlingVelocity => 10000.0;

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 0.3,
        stiffness: 150.0,
        damping: 0.9,
      );
}

/// Ultra smooth simulation for PageView
class UltraSmoothPageSimulation extends Simulation {
  UltraSmoothPageSimulation(
    this.start,
    this.velocity,
    this.tolerance,
    this.minScrollExtent,
    this.maxScrollExtent,
  );

  final double start;
  final double velocity;
  final Tolerance tolerance;
  final double minScrollExtent;
  final double maxScrollExtent;

  @override
  double x(double time) {
    // Use exponential decay for ultra smooth scrolling
    final decay = 0.95;
    final adjustedVelocity = velocity * math.pow(decay, time * 10);
    return _clamp(start + adjustedVelocity * time);
  }

  @override
  double dx(double time) {
    final decay = 0.95;
    return velocity * math.pow(decay, time * 10);
  }

  @override
  bool isDone(double time) {
    return x(time) == _clamp(x(time)) && dx(time).abs() < tolerance.velocity;
  }

  double _clamp(double value) {
    return value.clamp(minScrollExtent, maxScrollExtent);
  }
}

