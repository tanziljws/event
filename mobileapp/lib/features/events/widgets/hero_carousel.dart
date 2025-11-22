import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Hero carousel widget for events page
class HeroCarousel extends StatefulWidget {
  final List<dynamic> events;

  const HeroCarousel({
    super.key,
    required this.events,
  });

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  late PageController _pageController;
  int _currentCarouselPage = 0;
  Timer? _autoPlayTimer;
  List<dynamic> _eventsWithThumbnail = [];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _filterEventsWithThumbnail();
  }

  @override
  void didUpdateWidget(HeroCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.events != widget.events) {
      _filterEventsWithThumbnail();
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _autoPlayTimer?.cancel();
    super.dispose();
  }

  void _filterEventsWithThumbnail() {
    // Find events with valid thumbnail
    _eventsWithThumbnail = widget.events
        .where((event) => 
            event.thumbnailUrl != null && 
            event.thumbnailUrl!.isNotEmpty &&
            event.thumbnailUrl!.startsWith('http') &&
            !event.thumbnailUrl!.contains('example.com'))
        .toList();
    
    if (_eventsWithThumbnail.isNotEmpty) {
      // Sort by event date (most recent first)
      _eventsWithThumbnail.sort((a, b) => b.eventDate.compareTo(a.eventDate));
      // Start auto-play after a short delay
      Future.delayed(const Duration(milliseconds: 500), () {
        _startAutoPlay();
      });
    }
  }

  void _startAutoPlay() {
    _autoPlayTimer?.cancel();
    if (_eventsWithThumbnail.length > 1) {
      _autoPlayTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
        if (_pageController.hasClients) {
          int nextPage = (_currentCarouselPage + 1) % _eventsWithThumbnail.length;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  void _stopAutoPlay() {
    _autoPlayTimer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Carousel Background Images
        if (_eventsWithThumbnail.isNotEmpty)
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentCarouselPage = index;
              });
            },
            itemCount: _eventsWithThumbnail.length,
            itemBuilder: (context, index) {
              final event = _eventsWithThumbnail[index];
              return CachedNetworkImage(
                imageUrl: event.thumbnailUrl,
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
              );
            },
          )
        else
          // Fallback background jika tidak ada image
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFF6B7280),
            ),
          ),
        
        // Dark Overlay untuk readability
        Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.7),
          ),
        ),
        
        // Event Title Overlay
        if (_eventsWithThumbnail.isNotEmpty)
          Positioned(
            bottom: 60,
            left: 20,
            right: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _eventsWithThumbnail[_currentCarouselPage].title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    shadows: [
                      Shadow(
                        offset: Offset(2, 2),
                        blurRadius: 4,
                        color: Colors.black54,
                      ),
                    ],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  _eventsWithThumbnail[_currentCarouselPage].location,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    shadows: const [
                      Shadow(
                        offset: Offset(1, 1),
                        blurRadius: 2,
                        color: Colors.black54,
                      ),
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        
        // Page Indicators
        if (_eventsWithThumbnail.length > 1)
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _eventsWithThumbnail.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentCarouselPage == index
                        ? Colors.white
                        : Colors.white.withOpacity(0.5),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
