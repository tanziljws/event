import 'package:flutter/material.dart';
import 'dart:async';
import 'ultra_smooth_physics.dart';

/// Advanced PageController with ultra-smooth performance
class AdvancedPageController extends PageController {
  final int pageCount;
  final Duration animationDuration;
  final Curve animationCurve;
  final bool enablePreloading;
  final bool enableSmoothScrolling;
  
  Timer? _preloadTimer;
  final Set<int> _preloadedPages = {};
  
  AdvancedPageController({
    required this.pageCount,
    this.animationDuration = const Duration(milliseconds: 150), // Ultra-fast
    this.animationCurve = Curves.easeOutQuart, // Professional curve
    this.enablePreloading = true,
    this.enableSmoothScrolling = true,
    super.initialPage,
    super.keepPage,
    super.viewportFraction,
  }) : super();

  /// Preload adjacent pages for instant navigation
  void preloadAdjacentPages(int currentPage) {
    if (!enablePreloading) return;
    
    _preloadedPages.clear();
    
    // Preload previous page
    if (currentPage > 0) {
      _preloadedPages.add(currentPage - 1);
    }
    
    // Preload next page
    if (currentPage < pageCount - 1) {
      _preloadedPages.add(currentPage + 1);
    }
  }

  /// Ultra-smooth page transition
  Future<void> smoothAnimateToPage(
    int page, {
    Duration? duration,
    Curve? curve,
  }) async {
    if (!enableSmoothScrolling) {
      await animateToPage(
        page, 
        duration: duration ?? animationDuration, 
        curve: curve ?? animationCurve,
      );
      return;
    }

    // Preload target page
    preloadAdjacentPages(page);
    
    // Ultra-smooth animation
    await animateToPage(
      page,
      duration: duration ?? animationDuration,
      curve: curve ?? animationCurve,
    );
  }

  /// Instant page change without animation
  void instantJumpToPage(int page) {
    jumpToPage(page);
    preloadAdjacentPages(page);
  }

  @override
  void dispose() {
    _preloadTimer?.cancel();
    super.dispose();
  }
}

/// Optimized page view with advanced features
class AdvancedPageView extends StatefulWidget {
  final List<Widget> children;
  final AdvancedPageController? controller;
  final ValueChanged<int>? onPageChanged;
  final bool enablePreloading;
  final bool enableSmoothScrolling;
  final ScrollPhysics? physics;

  const AdvancedPageView({
    super.key,
    required this.children,
    this.controller,
    this.onPageChanged,
    this.enablePreloading = true,
    this.enableSmoothScrolling = true,
    this.physics,
  });

  @override
  State<AdvancedPageView> createState() => _AdvancedPageViewState();
}

class _AdvancedPageViewState extends State<AdvancedPageView> {
  late AdvancedPageController _controller;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? AdvancedPageController(
      pageCount: widget.children.length,
      enablePreloading: widget.enablePreloading,
      enableSmoothScrolling: widget.enableSmoothScrolling,
    );
    
    // Preload initial pages
    if (widget.enablePreloading) {
      _controller.preloadAdjacentPages(_currentPage);
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() {
      _currentPage = page;
    });
    
    // Preload adjacent pages
    if (widget.enablePreloading) {
      _controller.preloadAdjacentPages(page);
    }
    
    widget.onPageChanged?.call(page);
  }

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _controller,
      onPageChanged: _onPageChanged,
      physics: widget.physics ?? const UltraSmoothPhysics(),
      itemCount: widget.children.length,
      itemBuilder: (context, index) {
        return RepaintBoundary(
          key: ValueKey('page_$index'), // Unique key for each page
          child: widget.children[index],
        );
      },
    );
  }
}
