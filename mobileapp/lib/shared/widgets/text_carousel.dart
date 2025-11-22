import 'package:flutter/material.dart';

class TextCarousel extends StatefulWidget {
  final List<String> texts;
  final Duration duration;
  final TextStyle? textStyle;
  final TextAlign textAlign;

  const TextCarousel({
    super.key,
    required this.texts,
    this.duration = const Duration(seconds: 3),
    this.textStyle,
    this.textAlign = TextAlign.center,
  });

  @override
  State<TextCarousel> createState() => _TextCarouselState();
}

class _TextCarouselState extends State<TextCarousel>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _startCarousel();
  }

  void _startCarousel() {
    _animationController.forward();
    
    Future.delayed(widget.duration, () {
      if (mounted) {
        _animationController.reverse().then((_) {
          if (mounted) {
            setState(() {
              _currentIndex = (_currentIndex + 1) % widget.texts.length;
            });
            _animationController.forward();
            _startCarousel();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80, // Fixed height to prevent layout shifts
      child: AnimatedBuilder(
        animation: _fadeAnimation,
        builder: (context, child) {
          return Opacity(
            opacity: _fadeAnimation.value,
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  widget.texts[_currentIndex],
                  style: widget.textStyle ?? const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                  textAlign: widget.textAlign,
                  maxLines: 2, // Limit to 2 lines
                  overflow: TextOverflow.ellipsis, // Handle overflow gracefully
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
