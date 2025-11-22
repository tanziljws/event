import 'package:flutter/material.dart';
import 'events_search_bar.dart';
import 'events_section.dart';

/// Main events content widget
class EventsContent extends StatelessWidget {
  final List<dynamic> events;
  final VoidCallback? onRefresh;
  final VoidCallback? onLoadMore;
  final bool hasMorePages;

  const EventsContent({
    super.key,
    required this.events,
    this.onRefresh,
    this.onLoadMore,
    this.hasMorePages = false,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return _buildEmptyState(context);
    }

    return RefreshIndicator(
      onRefresh: () async {
        onRefresh?.call();
      },
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar Section
            const EventsSearchBar(),
            
            const SizedBox(height: 32),
            
            // Trending Events Section
            EventsSection(
              title: 'Trending Now',
              events: events.take(8).toList(),
              subtitle: '← Scroll untuk melihat lebih banyak →',
            ),
            
            const SizedBox(height: 24),
            
            // Category-based Sections
            ..._buildCategorySections(events),
            
            const SizedBox(height: 24),
            
            // Load More Button
            if (hasMorePages)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: ElevatedButton(
                    onPressed: onLoadMore,
                    child: const Text('Load More'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildCategorySections(List<dynamic> events) {
    final categories = ['Music', 'Business', 'Technology', 'Education', 'Sports', 'Art'];
    
    return categories.map((category) {
      final categoryEvents = events.where((event) {
        return event.category?.toLowerCase().contains(category.toLowerCase()) ?? 
               (category == 'Music' && event.category == null);
      }).toList();
      
      if (categoryEvents.isEmpty) return const SizedBox.shrink();
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EventsSection(
            title: category,
            events: categoryEvents,
            subtitle: '← Scroll untuk melihat lebih banyak →',
          ),
          const SizedBox(height: 24),
        ],
      );
    }).toList();
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_busy,
            size: 80,
            color: Theme.of(context).colorScheme.outline,
          ),
          const SizedBox(height: 16),
          Text(
            'No events found',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or filters',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onRefresh,
            child: const Text('Refresh'),
          ),
        ],
      ),
    );
  }
}
