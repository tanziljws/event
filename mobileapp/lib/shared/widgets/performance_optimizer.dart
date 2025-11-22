import 'package:flutter/material.dart';

/// Performance optimizer widget that prevents unnecessary rebuilds
class PerformanceOptimizer extends StatefulWidget {
  final Widget child;
  final bool enableRepaintBoundary;
  final bool enableAutomaticKeepAlive;
  final Duration? debounceDuration;

  const PerformanceOptimizer({
    super.key,
    required this.child,
    this.enableRepaintBoundary = true,
    this.enableAutomaticKeepAlive = true,
    this.debounceDuration,
  });

  @override
  State<PerformanceOptimizer> createState() => _PerformanceOptimizerState();
}

class _PerformanceOptimizerState extends State<PerformanceOptimizer>
    with AutomaticKeepAliveClientMixin {
  
  DateTime? _lastBuildTime;
  static const Duration _defaultDebounce = Duration(milliseconds: 16); // 60 FPS

  @override
  bool get wantKeepAlive => widget.enableAutomaticKeepAlive;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    // Debounce builds for better performance
    final now = DateTime.now();
    final debounceDuration = widget.debounceDuration ?? _defaultDebounce;
    
    if (_lastBuildTime != null && 
        now.difference(_lastBuildTime!) < debounceDuration) {
      return const SizedBox.shrink();
    }
    
    _lastBuildTime = now;
    
    Widget optimizedChild = widget.child;
    
    // Wrap with RepaintBoundary if enabled
    if (widget.enableRepaintBoundary) {
      optimizedChild = RepaintBoundary(
        child: optimizedChild,
      );
    }
    
    return optimizedChild;
  }
}

/// Optimized list view with performance improvements
class OptimizedListView extends StatelessWidget {
  final List<Widget> children;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final int? itemCount;
  final IndexedWidgetBuilder? itemBuilder;
  final double? itemExtent;
  final bool addAutomaticKeepAlives;
  final bool addRepaintBoundaries;
  final bool addSemanticIndexes;

  const OptimizedListView({
    super.key,
    this.children = const [],
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.itemCount,
    this.itemBuilder,
    this.itemExtent,
    this.addAutomaticKeepAlives = true,
    this.addRepaintBoundaries = true,
    this.addSemanticIndexes = true,
  });

  @override
  Widget build(BuildContext context) {
    if (itemBuilder != null && itemCount != null) {
      return ListView.builder(
        controller: controller,
        padding: padding,
        shrinkWrap: shrinkWrap,
        physics: physics,
        itemCount: itemCount,
        itemBuilder: itemBuilder!,
        itemExtent: itemExtent,
        addAutomaticKeepAlives: addAutomaticKeepAlives,
        addRepaintBoundaries: addRepaintBoundaries,
        addSemanticIndexes: addSemanticIndexes,
      );
    }
    
    return ListView(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      children: children,
    );
  }
}

/// Optimized grid view with performance improvements
class OptimizedGridView extends StatelessWidget {
  final List<Widget> children;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final int? itemCount;
  final IndexedWidgetBuilder? itemBuilder;
  final double? childAspectRatio;
  final double? crossAxisSpacing;
  final double? mainAxisSpacing;
  final int crossAxisCount;
  final bool addAutomaticKeepAlives;
  final bool addRepaintBoundaries;
  final bool addSemanticIndexes;

  const OptimizedGridView({
    super.key,
    this.children = const [],
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.itemCount,
    this.itemBuilder,
    this.childAspectRatio,
    this.crossAxisSpacing = 0.0,
    this.mainAxisSpacing = 0.0,
    this.crossAxisCount = 2,
    this.addAutomaticKeepAlives = true,
    this.addRepaintBoundaries = true,
    this.addSemanticIndexes = true,
  });

  @override
  Widget build(BuildContext context) {
    if (itemBuilder != null && itemCount != null) {
      return GridView.builder(
        controller: controller,
        padding: padding,
        shrinkWrap: shrinkWrap,
        physics: physics,
        itemCount: itemCount,
        itemBuilder: itemBuilder!,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          childAspectRatio: childAspectRatio ?? 1.0,
          crossAxisSpacing: crossAxisSpacing ?? 0.0,
          mainAxisSpacing: mainAxisSpacing ?? 0.0,
        ),
        addAutomaticKeepAlives: addAutomaticKeepAlives,
        addRepaintBoundaries: addRepaintBoundaries,
        addSemanticIndexes: addSemanticIndexes,
      );
    }
    
    return GridView.count(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      crossAxisCount: crossAxisCount,
      childAspectRatio: childAspectRatio ?? 1.0,
      crossAxisSpacing: crossAxisSpacing ?? 0.0,
      mainAxisSpacing: mainAxisSpacing ?? 0.0,
      children: children,
    );
  }
}

/// Optimized scroll view with performance improvements
class OptimizedScrollView extends StatelessWidget {
  final Widget child;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final bool reverse;
  final ScrollViewKeyboardDismissBehavior keyboardDismissBehavior;

  const OptimizedScrollView({
    super.key,
    required this.child,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.reverse = false,
    this.keyboardDismissBehavior = ScrollViewKeyboardDismissBehavior.manual,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      reverse: reverse,
      keyboardDismissBehavior: keyboardDismissBehavior,
      child: PerformanceOptimizer(
        child: child,
      ),
    );
  }
}

/// Optimized container with performance improvements
class OptimizedContainer extends StatelessWidget {
  final Widget? child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final Decoration? decoration;
  final double? width;
  final double? height;
  final AlignmentGeometry? alignment;
  final BoxConstraints? constraints;

  const OptimizedContainer({
    super.key,
    this.child,
    this.padding,
    this.margin,
    this.color,
    this.decoration,
    this.width,
    this.height,
    this.alignment,
    this.constraints,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
        padding: padding,
        margin: margin,
        color: color,
        decoration: decoration,
        width: width,
        height: height,
        alignment: alignment,
        constraints: constraints,
        child: child,
      ),
    );
  }
}

/// Optimized text widget with performance improvements
class OptimizedText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final TextOverflow? overflow;
  final int? maxLines;
  final TextDirection? textDirection;
  final Locale? locale;
  final StrutStyle? strutStyle;
  final TextWidthBasis? textWidthBasis;
  final TextHeightBehavior? textHeightBehavior;

  const OptimizedText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.textDirection,
    this.locale,
    this.strutStyle,
    this.textWidthBasis,
    this.textHeightBehavior,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Text(
        text,
        style: style,
        textAlign: textAlign,
        overflow: overflow,
        maxLines: maxLines,
        textDirection: textDirection,
        locale: locale,
        strutStyle: strutStyle,
        textWidthBasis: textWidthBasis,
        textHeightBehavior: textHeightBehavior,
      ),
    );
  }
}
