import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Professional performance monitoring widget
class PerformanceMonitor extends StatefulWidget {
  final Widget child;
  final bool enabled;
  final String? tag;

  const PerformanceMonitor({
    super.key,
    required this.child,
    this.enabled = false, // Disable in production
    this.tag,
  });

  @override
  State<PerformanceMonitor> createState() => _PerformanceMonitorState();
}

class _PerformanceMonitorState extends State<PerformanceMonitor>
    with WidgetsBindingObserver {
  int _frameCount = 0;
  int _droppedFrames = 0;
  DateTime? _lastFrameTime;
  double _averageFPS = 0.0;

  @override
  void initState() {
    super.initState();
    if (widget.enabled) {
      WidgetsBinding.instance.addObserver(this);
      SchedulerBinding.instance.addPersistentFrameCallback(_onFrame);
    }
  }

  @override
  void dispose() {
    if (widget.enabled) {
      WidgetsBinding.instance.removeObserver(this);
    }
    super.dispose();
  }

  void _onFrame(Duration timeStamp) {
    if (!widget.enabled) return;

    final now = DateTime.now();
    if (_lastFrameTime != null) {
      final frameDuration = now.difference(_lastFrameTime!);
      _frameCount++;
      
      // Check for dropped frames (frame duration > 16.67ms for 60fps)
      if (frameDuration.inMicroseconds > 16670) {
        _droppedFrames++;
      }
      
      // Calculate average FPS every 60 frames
      if (_frameCount % 60 == 0) {
        final totalTime = now.difference(_lastFrameTime!).inMilliseconds;
        _averageFPS = (_frameCount * 1000) / totalTime;
        
        if (widget.tag != null) {
          debugPrint('Performance [${widget.tag}]: FPS: ${_averageFPS.toStringAsFixed(1)}, Dropped: $_droppedFrames');
        }
      }
    }
    _lastFrameTime = now;
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

/// Optimized container with performance monitoring
class OptimizedContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final Decoration? decoration;
  final String? performanceTag;

  const OptimizedContainer({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.color,
    this.decoration,
    this.performanceTag,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
        padding: padding,
        margin: margin,
        color: color,
        decoration: decoration,
        child: PerformanceMonitor(
          enabled: false, // Disable in production
          tag: performanceTag,
          child: child,
        ),
      ),
    );
  }
}

/// Optimized list view with performance optimizations
class OptimizedListView extends StatelessWidget {
  final List<Widget> children;
  final ScrollController? controller;
  final Axis scrollDirection;
  final EdgeInsetsGeometry? padding;
  final String? performanceTag;

  const OptimizedListView({
    super.key,
    required this.children,
    this.controller,
    this.scrollDirection = Axis.vertical,
    this.padding,
    this.performanceTag,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: PerformanceMonitor(
        enabled: false, // Disable in production
        tag: performanceTag,
        child: ListView(
          controller: controller,
          scrollDirection: scrollDirection,
          padding: padding,
          physics: const ClampingScrollPhysics(), // Smooth scrolling
          children: children,
        ),
      ),
    );
  }
}
