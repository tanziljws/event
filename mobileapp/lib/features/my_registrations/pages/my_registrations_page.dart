import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/bottom_navigation.dart';
import '../../../shared/services/navigation_service.dart';
import '../widgets/my_registrations_content.dart';
import '../widgets/my_registrations_header.dart';
import '../widgets/my_registrations_filter.dart';
import '../../events/bloc/event_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';

class MyRegistrationsPage extends StatefulWidget {
  const MyRegistrationsPage({super.key});

  @override
  State<MyRegistrationsPage> createState() => _MyRegistrationsPageState();
}

class _MyRegistrationsPageState extends State<MyRegistrationsPage> with AutomaticKeepAliveClientMixin {
  String _selectedFilter = 'All';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadMyRegistrations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadMyRegistrations() {
    context.read<EventBloc>().add(
      const MyRegistrationsLoadRequested(),
    );
  }

  void _onRefresh() {
    _loadMyRegistrations();
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth > 600;
    final horizontalPadding = isTablet ? 32.0 : 20.0;

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Column(
        children: [
          // Header dengan search bar terintegrasi
          MyRegistrationsHeader(
            onBackPressed: () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go('/home');
              }
            },
            onSearchPressed: () => _showSearchModal(context),
            searchController: _searchController,
            onSearchChanged: _onSearchChanged,
          ),
          
          const SizedBox(height: 8),
          
          // Filter tabs
          MyRegistrationsFilter(
            selectedFilter: _selectedFilter,
            onFilterChanged: _onFilterChanged,
          ),

          const SizedBox(height: 16),

          // Content
          Expanded(
            child: BlocBuilder<EventBloc, EventState>(
              builder: (context, state) {
                if (state is MyRegistrationsLoaded) {
                  return MyRegistrationsContent(
                    registrations: state.registrations,
                    selectedFilter: _selectedFilter,
                    searchQuery: _searchQuery,
                    onRefresh: _onRefresh,
                    horizontalPadding: horizontalPadding,
                  );
                } else if (state is EventFailure) {
                  return _buildErrorState(state.message);
                } else {
                  return _buildLoadingState();
                }
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          if (authState is AuthAuthenticated) {
            return BottomNavigation(currentIndex: NavigationService().currentIndex);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading your registrations...'),
        ],
      ),
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
            'Failed to load registrations',
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

  void _showSearchModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Search header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search your registrations...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onChanged: _onSearchChanged,
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            
            // Search results
            Expanded(
              child: BlocBuilder<EventBloc, EventState>(
                builder: (context, state) {
                  if (state is MyRegistrationsLoaded) {
                    final filteredRegistrations = state.registrations.where((registration) {
                      if (_searchQuery.isEmpty) return true;
                      return registration.event.title.toLowerCase().contains(_searchQuery.toLowerCase()) == true ||
                             registration.event.location.toLowerCase().contains(_searchQuery.toLowerCase()) == true;
                    }).toList();
                    
                    if (filteredRegistrations.isEmpty) {
                      return const Center(
                        child: Text('No registrations found'),
                      );
                    }
                    
                    return ListView.builder(
                      itemCount: filteredRegistrations.length,
                      itemBuilder: (context, index) {
                        final registration = filteredRegistrations[index];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundImage: registration.event.thumbnailUrl != null
                                ? NetworkImage(registration.event.thumbnailUrl!)
                                : null,
                            child: registration.event.thumbnailUrl == null
                                ? const Icon(Icons.event)
                                : null,
                          ),
                          title: Text(registration.event.title ?? 'Unknown Event'),
                          subtitle: Text(registration.event.location ?? 'Location TBA'),
                          trailing: Text(
                            _getStatusText(registration.status),
                            style: TextStyle(
                              color: _getStatusColor(registration.status),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                                 onTap: () {
                                   Navigator.pop(context);
                                   context.go('/events/detail/${registration.event.id}');
                                                                  },
                        );
                      },
                    );
                  }
                  
                  return const Center(child: CircularProgressIndicator());
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}