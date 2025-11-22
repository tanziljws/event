import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/models/event_model.dart';

class EventDetailHeader extends StatefulWidget {
  final EventModel event;

  const EventDetailHeader({
    super.key,
    required this.event,
  });

  @override
  State<EventDetailHeader> createState() => _EventDetailHeaderState();
}

class _EventDetailHeaderState extends State<EventDetailHeader> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  List<String> _images = [];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _setupImages();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _autoPlayTimer?.cancel();
    super.dispose();
  }

  void _setupImages() {
    _images = [];
    
    // Add thumbnail first if available
    if (widget.event.thumbnailUrl != null && widget.event.thumbnailUrl!.isNotEmpty) {
      _images.add(widget.event.thumbnailUrl!);
    }
    
    // Add gallery images if available
    if (widget.event.galleryUrls.isNotEmpty) {
      for (String url in widget.event.galleryUrls) {
        if (url.isNotEmpty && !_images.contains(url)) {
          _images.add(url);
        }
      }
    }
    
    // Start auto-play if multiple images
    if (_images.length > 1) {
      _startAutoPlay();
    }
  }

  void _startAutoPlay() {
    _autoPlayTimer?.cancel();
    _autoPlayTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_pageController.hasClients && _images.length > 1) {
        int nextPage = (_currentPage + 1) % _images.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _stopAutoPlay() {
    _autoPlayTimer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    final statusBarHeight = MediaQuery.of(context).padding.top;
    
    return SliverAppBar(
      expandedHeight: 350.0 + statusBarHeight, // Increased height to show full image
      floating: false,
      pinned: false,
      backgroundColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      stretch: true, // Allow stretching when overscrolling
      flexibleSpace: FlexibleSpaceBar(
        background: _buildFullScreenCarousel(context, widget.event),
        collapseMode: CollapseMode.pin,
      ),
    );
  }

  Widget _buildFullScreenCarousel(BuildContext context, EventModel event) {
    if (_images.isEmpty) {
      // Fallback if no images
      return Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF2563EB),
              Color(0xFF1E40AF),
            ],
          ),
        ),
        child: const Center(
          child: Icon(
            Icons.event,
            color: Colors.white,
            size: 80,
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Carousel Images
        GestureDetector(
          onTapDown: (_) => _stopAutoPlay(),
          onTapUp: (_) => _startAutoPlay(),
          onTapCancel: () => _startAutoPlay(),
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemCount: _images.length,
            itemBuilder: (context, index) {
              return Hero(
                tag: index == 0 ? 'event-${event.id}' : 'event-${event.id}-$index',
                child: CachedNetworkImage(
                  imageUrl: _images[index],
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  placeholder: (context, url) => Container(
                    color: const Color(0xFF6B7280),
                    child: const Center(
                      child: CircularProgressIndicator(
                        color: Colors.white,
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: const Color(0xFF6B7280),
                    child: const Center(
                      child: Icon(
                        Icons.event,
                        color: Colors.white,
                        size: 48,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        

        
        // Back button (top left with status bar padding)
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(
                Icons.arrow_back,
                color: Colors.white,
              ),
            ),
          ),
        ),
        

        
        // Price Badge (bottom left)
        Positioned(
          bottom: 20,
          left: 20,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: event.isFree ? Colors.green : const Color(0xFF2563EB),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              event.isFree ? 'FREE' : event.formattedPrice,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        
        // Page Indicators (if multiple images)
        if (_images.length > 1)
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _images.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentPage == index
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
          ),
        
        // Image counter (top right)
        if (_images.length > 1)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_currentPage + 1}/${_images.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
