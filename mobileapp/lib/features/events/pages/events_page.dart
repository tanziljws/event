import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/event_bloc.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/services/event_service.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/events_content.dart';

class EventsPage extends StatefulWidget {
  const EventsPage({super.key});

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> with AutomaticKeepAliveClientMixin {
  int _currentPage = 1;
  final int _pageSize = 20;
  String _sortBy = 'eventDate';
  String _sortOrder = 'asc'; // Show upcoming events first (chronological order)
  
  @override
  bool get wantKeepAlive => true; // Keep page alive for smooth navigation

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  void _loadEvents() {
    context.read<EventBloc>().add(
      EventLoadRequested(
        page: _currentPage,
        limit: _pageSize,
        isPublished: true,
        sortBy: _sortBy,
        sortOrder: _sortOrder,
      ),
    );
  }

  void _onRefresh() async {
    // Clear cache before refreshing
    await EventService().clearEventsCache();
    
    setState(() {
      _currentPage = 1;
    });
    _loadEvents();
  }

  void _loadMore() {
    setState(() {
      _currentPage++;
    });
    _loadEvents();
  }




  @override
  Widget build(BuildContext context) {
    super.build(context); // Call super.build for AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: BlocBuilder<EventBloc, EventState>(
        builder: (context, state) {
          return LoadingOverlay(
            isLoading: state is EventLoading && _currentPage == 1,
            child: CustomScrollView(
              physics: const ClampingScrollPhysics(), // Smoother scrolling
              slivers: [
                // Hero Carousel Section
                SliverAppBar(
                  expandedHeight: 280.0,
                  floating: false,
                  pinned: false,
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  automaticallyImplyLeading: false,
                  flexibleSpace: FlexibleSpaceBar(
                    background: state is EventLoaded 
                        ? HeroCarousel(events: state.events)
                        : Container(
                            decoration: const BoxDecoration(
                              color: Color(0xFF6B7280),
                            ),
                          ),
                  ),
                ),
                
                // Events Content
                SliverToBoxAdapter(
                  child: state is EventLoaded
                      ? EventsContent(
                          events: state.events,
                          onRefresh: _onRefresh,
                          onLoadMore: _loadMore,
                          hasMorePages: _currentPage < (state.pagination?['totalPages'] ?? 1),
                        )
                      : state is EventFailure
                          ? _buildErrorState(state.message)
                          : const Center(child: CircularProgressIndicator()),
                ),
              ],
            ),
          );
        },
      ),
      // BottomNavigationBar is now handled by MainNavigationWrapper
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load events',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _onRefresh,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

}
