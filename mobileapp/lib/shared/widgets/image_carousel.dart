import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';

class ImageCarousel extends StatefulWidget {
  final List<String> imageUrls;
  final double height;
  final bool showThumbnails;
  final bool autoPlay;
  final Duration autoPlayInterval;
  final String? priceText;

  const ImageCarousel({
    super.key,
    required this.imageUrls,
    this.height = 300.0,
    this.showThumbnails = true,
    this.autoPlay = true,
    this.autoPlayInterval = const Duration(seconds: 3),
    this.priceText,
  });

  @override
  State<ImageCarousel> createState() => _ImageCarouselState();
}

class _ImageCarouselState extends State<ImageCarousel> {
  late PageController _pageController;
  int _currentIndex = 0;
  Timer? _autoPlayTimer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    if (widget.autoPlay && widget.imageUrls.length > 1) {
      _startAutoPlay();
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _autoPlayTimer?.cancel();
    super.dispose();
  }

  void _startAutoPlay() {
    _autoPlayTimer = Timer.periodic(widget.autoPlayInterval, (timer) {
      if (mounted) {
        int nextIndex = (_currentIndex + 1) % widget.imageUrls.length;
        _pageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic, // Smoother auto-play
        );
      }
    });
  }

  void _stopAutoPlay() {
    _autoPlayTimer?.cancel();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _onImageTap() {
    // Toggle auto play when user taps
    if (widget.autoPlay) {
      if (_autoPlayTimer?.isActive == true) {
        _stopAutoPlay();
      } else {
        _startAutoPlay();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.imageUrls.isEmpty) {
      return Container(
        height: widget.height,
        decoration: const BoxDecoration(
          color: Color(0xFF2563EB),
        ),
        child: const Center(
          child: Icon(
            Icons.image_not_supported,
            size: 64,
            color: Colors.white,
          ),
        ),
      );
    }

    return Column(
      children: [
        // Main Image Carousel
        GestureDetector(
          onTap: _onImageTap,
          child: Container(
            height: widget.height,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(0), // No rounded corners
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(0), // No rounded corners
              child: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: _onPageChanged,
                    itemCount: widget.imageUrls.length,
                    physics: const ClampingScrollPhysics(), // Smoother physics
                    itemBuilder: (context, index) {
                      return RepaintBoundary( // Optimize repainting
                        child: CachedNetworkImage(
                          imageUrl: widget.imageUrls[index],
                          fit: BoxFit.cover,
                          width: double.infinity,
                          memCacheWidth: 800, // Optimize memory usage
                          memCacheHeight: 600,
                          fadeInDuration: const Duration(milliseconds: 200), // Faster fade
                          placeholder: (context, url) => Container(
                            color: Colors.white,
                            child: const Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Color(0xFF2563EB),
                                  strokeWidth: 2,
                                ),
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.white,
                            child: const Center(
                              child: Icon(
                                Icons.image_not_supported,
                                size: 48,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  
                  // Price Badge (bottom left)
                  if (widget.priceText != null)
                    Positioned(
                      bottom: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          widget.priceText!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  
                  // Navigation Arrows (only show if more than 1 image)
                  if (widget.imageUrls.length > 1) ...[
                    // Left Arrow
                    Positioned(
                      left: 16,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.8),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            onPressed: () {
                              _stopAutoPlay();
                              int prevIndex = _currentIndex == 0 
                                  ? widget.imageUrls.length - 1 
                                  : _currentIndex - 1;
                              _pageController.animateToPage(
                                prevIndex,
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeOutCubic, // Smoother curve
                              );
                            },
                            icon: const Icon(
                              Icons.chevron_left,
                              color: Color(0xFF374151),
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    // Right Arrow
                    Positioned(
                      right: 16,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.8),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            onPressed: () {
                              _stopAutoPlay();
                              int nextIndex = (_currentIndex + 1) % widget.imageUrls.length;
                              _pageController.animateToPage(
                                nextIndex,
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeOutCubic, // Smoother curve
                              );
                            },
                            icon: const Icon(
                              Icons.chevron_right,
                              color: Color(0xFF374151),
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  
                  // Image Counter (only show if more than 1 image)
                  if (widget.imageUrls.length > 1)
                    Positioned(
                      bottom: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '${_currentIndex + 1} / ${widget.imageUrls.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  
                  // Auto-play indicator
                  if (widget.autoPlay && widget.imageUrls.length > 1)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Icon(
                          _autoPlayTimer?.isActive == true 
                              ? Icons.pause 
                              : Icons.play_arrow,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        
        // Thumbnail Navigation (only show if more than 1 image and enabled)
        if (widget.showThumbnails && widget.imageUrls.length > 1)
          Container(
            height: 52,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: widget.imageUrls.length,
              physics: const ClampingScrollPhysics(), // Smoother scrolling
              itemBuilder: (context, index) {
                return RepaintBoundary( // Optimize repainting
                  child: GestureDetector(
                    onTap: () {
                      _stopAutoPlay();
                      _pageController.animateToPage(
                        index,
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOutCubic, // Smoother transition
                      );
                    },
                    child: AnimatedContainer( // Smooth border animation
                      duration: const Duration(milliseconds: 200),
                      width: 48,
                      height: 48,
                      margin: const EdgeInsets.only(right: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _currentIndex == index 
                              ? const Color(0xFF2563EB) 
                              : Colors.transparent,
                          width: 2,
                        ),
                        boxShadow: [
                          if (_currentIndex == index)
                            BoxShadow(
                              color: const Color(0xFF2563EB).withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: CachedNetworkImage(
                          imageUrl: widget.imageUrls[index],
                          fit: BoxFit.cover,
                          memCacheWidth: 128, // Optimize thumbnail memory
                          memCacheHeight: 128,
                          fadeInDuration: const Duration(milliseconds: 150),
                          placeholder: (context, url) => Container(
                            color: Colors.grey[200],
                            child: const Center(
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFF2563EB),
                                ),
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.grey[200],
                            child: const Icon(
                              Icons.image_not_supported,
                              size: 24,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
