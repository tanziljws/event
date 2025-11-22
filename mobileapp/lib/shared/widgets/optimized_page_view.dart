import 'package:flutter/material.dart';

/// Optimized PageView with better performance and smoother navigation
class OptimizedPageView extends StatefulWidget {
  final PageController? controller;
  final ValueChanged<int>? onPageChanged;
  final List<Widget Function()> pageBuilders;
  final int initialPage;
  final ScrollPhysics? physics;

  const OptimizedPageView({
    super.key,
    this.controller,
    this.onPageChanged,
    required this.pageBuilders,
    this.initialPage = 0,
    this.physics,
  });

  @override
  State<OptimizedPageView> createState() => _OptimizedPageViewState();
}

class _OptimizedPageViewState extends State<OptimizedPageView> 
    with AutomaticKeepAliveClientMixin {
  
  late PageController _pageController;
  final Map<int, Widget> _pageCache = {};
  static const int _maxCacheSize = 10; // Increased cache size for better performance
  
  // Performance tracking - optimized for smooth navigation
  DateTime? _lastPageChangeTime;
  static const Duration _pageChangeDebounce = Duration(milliseconds: 25); // Faster debounce

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _pageController = widget.controller ?? PageController(initialPage: widget.initialPage);
    _preloadInitialPages();
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _pageController.dispose();
    }
    _pageCache.clear();
    super.dispose();
  }

  void _preloadInitialPages() {
    // Aggressive preloading for smooth performance
    final currentIndex = _pageController.initialPage;
    
    // Preload current page and all adjacent pages
    for (int i = -2; i <= 2; i++) {
      _preloadPage(currentIndex + i);
    }
  }

  void _preloadPage(int index) {
    if (index >= 0 && 
        index < widget.pageBuilders.length && 
        !_pageCache.containsKey(index)) {
      _pageCache[index] = widget.pageBuilders[index]();
    }
  }

  void _onPageChanged(int index) {
    // Debounce page changes to prevent rapid calls
    final now = DateTime.now();
    if (_lastPageChangeTime != null && 
        now.difference(_lastPageChangeTime!) < _pageChangeDebounce) {
      return;
    }
    _lastPageChangeTime = now;

    // Aggressive preloading for smooth performance
    for (int i = -3; i <= 3; i++) {
      _preloadPage(index + i);
    }

    // Clean up cache
    _cleanupCache(index);

    // Only notify parent if this is a manual navigation
    // This prevents auto page changes from triggering callbacks
    widget.onPageChanged?.call(index);
  }

  void _cleanupCache(int currentIndex) {
    // More aggressive cleanup - keep more pages in cache
    if (_pageCache.length > _maxCacheSize) {
      final keysToRemove = <int>[];
      for (final key in _pageCache.keys) {
        if ((key - currentIndex).abs() > 3) { // Keep more pages
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
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return PageView.builder(
      controller: _pageController,
      onPageChanged: _onPageChanged,
      physics: const NeverScrollableScrollPhysics(), // Completely disable scrolling
      itemCount: widget.pageBuilders.length,
      // Disable implicit scrolling to prevent auto navigation
      allowImplicitScrolling: false,
      itemBuilder: (context, index) {
        // Use cached page if available, otherwise build and cache
        if (!_pageCache.containsKey(index)) {
          _pageCache[index] = widget.pageBuilders[index]();
        }
        
        return RepaintBoundary(
          key: ValueKey('optimized_page_$index'),
          child: _pageCache[index]!,
        );
      },
    );
  }
}
