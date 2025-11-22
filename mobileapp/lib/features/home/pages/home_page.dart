import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
// import '../../notifications/bloc/notification_event.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../events/bloc/event_bloc.dart';
// import '../../notifications/bloc/notification_bloc.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/state_service.dart';
import '../../../core/utils/performance_monitor.dart';
import '../widgets/home_header.dart';
import '../widgets/home_search_bar.dart';
import '../widgets/quick_actions_section.dart';
import '../widgets/popular_events_section.dart';
import '../../../shared/widgets/eo_promo_banner_separate.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true; // Keep page alive for smooth navigation
  
  // Location state
  String _currentLocation = 'Undefined';
  bool _isLoadingLocation = false;
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    PerformanceMonitor.startTiming('home_page_init');
    
    // Load cached location first
    _loadCachedLocation();
    
    // Load featured events - get more events for better filtering
    context.read<EventBloc>().add(
      const EventLoadRequested(
        page: 1,
        limit: 20, // Get more events for better popular selection
        isPublished: true,
        sortBy: 'createdAt', // Get newest events first
        sortOrder: 'desc', // Newest first
      ),
    );
    
    // Get current location after a delay to avoid blocking UI
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _getCurrentLocation();
      }
    });
    
    // Load unread notification count (temporarily disabled)
    // context.read<NotificationBloc>().add(LoadUnreadCount());
    
    PerformanceMonitor.endTiming('home_page_init');
  }

  // Load cached location for instant display
  Future<void> _loadCachedLocation() async {
    try {
      final cachedLocation = await StateService.loadState('current_location');
      if (cachedLocation != null && cachedLocation is String && mounted) {
        setState(() {
          _currentLocation = cachedLocation;
        });
      }
    } catch (e) {
      print('❌ Failed to load cached location: $e');
    }
  }


  // Get current location from GPS
  Future<void> _getCurrentLocation() async {
    PerformanceMonitor.startTiming('location_fetch');
    
    if (!mounted) return;
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        final location = _locationService.getFormattedLocation();
        if (mounted) {
          setState(() {
            _currentLocation = location;
            _isLoadingLocation = false;
          });
        }
        
        // Cache the location for next time
        await StateService.saveState('current_location', location);
      } else {
        if (mounted) {
          setState(() {
            _currentLocation = 'Undefined'; // Fallback
            _isLoadingLocation = false;
          });
        }
      }
    } catch (e) {
      print('Error getting location: $e');
      if (mounted) {
        setState(() {
          _currentLocation = 'Undefined'; // Fallback
          _isLoadingLocation = false;
        });
      }
    } finally {
      PerformanceMonitor.endTiming('location_fetch');
    }
  }


  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          return _buildHome(context, authState);
        },
      ),
      // BottomNavigationBar is now handled by MainNavigationWrapper
    );
  }

  Widget _buildHome(BuildContext context, AuthState authState) {
    final isAuthenticated = authState is AuthAuthenticated;
    
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Column(
        children: [
          // App Header - wrapped with RepaintBoundary for performance
          RepaintBoundary(
            child: HomeHeader(
              currentLocation: _currentLocation,
              isLoadingLocation: _isLoadingLocation,
            ),
          ),
          
          // Search Bar Area with blue background and rounded corners
          Container(
            decoration: const BoxDecoration(
              color: AppConstants.primaryColor, // Blue background for search area
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            padding: const EdgeInsets.only(
              left: 20,
              right: 20,
              top: 8,
              bottom: 20, // Extra padding at bottom
            ),
            child: const RepaintBoundary(
              child: HomeSearchBar(),
            ),
          ),
          
          // Content - wrapped with RepaintBoundary
          Expanded(
            child: RepaintBoundary(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(), // Smoother scrolling
                child: Column(
                  children: [
                    // Quick Actions Section - wrapped with RepaintBoundary
                    const RepaintBoundary(
                      child: QuickActionsSection(),
                    ),

                    // EO Promo Banner (Separate) - wrapped with RepaintBoundary
                    const RepaintBoundary(
                      child: EOPromoBannerSeparate(),
                    ),

                    // Popular Events Section - wrapped with RepaintBoundary
                    RepaintBoundary(
                      child: PopularEventsSection(
                        userLocation: _locationService.currentPosition,
                        isLoadingLocation: _isLoadingLocation,
                      ),
                    ),
                    
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }




}
