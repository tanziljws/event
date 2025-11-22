import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/bottom_navigation.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../organizer/bloc/organizer_bloc.dart' as organizer_bloc;
import '../widgets/my_events_header.dart';
import '../widgets/my_events_filter.dart';
import '../widgets/event_management_card.dart';

class MyEventsPage extends StatefulWidget {
  const MyEventsPage({super.key});

  @override
  State<MyEventsPage> createState() => _MyEventsPageState();
}

class _MyEventsPageState extends State<MyEventsPage> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All';
  List<String> _filterOptions = ['All', 'Published', 'Draft'];
  List<dynamic> _filteredEvents = [];

  @override
  void initState() {
    super.initState();
    // Load organizer's events
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<organizer_bloc.OrganizerBloc>().add(
        organizer_bloc.LoadOrganizerEvents(),
      );
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is! AuthAuthenticated) {
          return const Scaffold(
            body: Center(child: Text('Please login first')),
          );
        }

        return Scaffold(
          backgroundColor: AppConstants.backgroundColor,
          body: Column(
            children: [
              // Header dengan search bar terintegrasi
              MyEventsHeader(
                onBackPressed: () {
                  if (Navigator.of(context).canPop()) {
                    Navigator.of(context).pop();
                  } else {
                    context.go('/dashboard');
                  }
                },
                onSearchPressed: () => _showSearchModal(context),
                searchController: _searchController,
                onSearchChanged: _onSearchChanged,
              ),
              
              const SizedBox(height: 8),
              
              // Filter tabs
              MyEventsFilter(
                selectedFilter: _selectedFilter,
                onFilterChanged: _onFilterChanged,
                filterOptions: _filterOptions,
              ),

              const SizedBox(height: 16),

              // Content
              Expanded(
                child: BlocListener<organizer_bloc.OrganizerBloc, organizer_bloc.OrganizerState>(
                  listener: (context, state) {
                    if (state is organizer_bloc.OrganizerEventPublished) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.message),
                          backgroundColor: AppConstants.successColor,
                          duration: const Duration(seconds: 3),
                        ),
                      );
                      // Reload events to reflect the published status
                      context.read<organizer_bloc.OrganizerBloc>().add(
                        organizer_bloc.LoadOrganizerEvents(),
                      );
                    } else if (state is organizer_bloc.OrganizerFailure) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.message),
                          backgroundColor: AppConstants.errorColor,
                          duration: const Duration(seconds: 3),
                        ),
                      );
                    }
                  },
                  child: BlocBuilder<organizer_bloc.OrganizerBloc, organizer_bloc.OrganizerState>(
                    builder: (context, state) {
                      if (state is organizer_bloc.OrganizerLoading) {
                        return const Center(
                          child: CircularProgressIndicator(),
                        );
                      } else if (state is organizer_bloc.OrganizerEventsLoaded) {
                        if (state.events.isEmpty) {
                          return _buildEmptyState();
                        }
                        _filteredEvents = _filterEvents(state.events);
                        return _buildEventsList(_filteredEvents);
                      } else if (state is organizer_bloc.OrganizerFailure) {
                        return _buildErrorState(state.message);
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: const BottomNavigation(currentIndex: 4),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_note,
            size: 80,
            color: AppConstants.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'Belum ada event',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Mulai buat event pertama Anda',
            style: TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.go('/my-events/create'),
            icon: const Icon(Icons.add),
            label: const Text('Buat Event'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
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
            color: AppConstants.errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Terjadi kesalahan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              final authState = context.read<AuthBloc>().state;
              if (authState is AuthAuthenticated) {
                context.read<organizer_bloc.OrganizerBloc>().add(
                  organizer_bloc.LoadOrganizerEvents(),
                );
              }
            },
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  Widget _buildEventsList(List<dynamic> events) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return EventManagementCard(
          event: event,
          onEdit: () => context.go('/my-events/edit/${event.id}'),
          onView: () => context.go('/events/detail/${event.id}'),
          onAnalytics: () => context.go('/analytics/event/${event.id}?title=${Uri.encodeComponent(event.title)}'),
          onAttendance: () => context.go('/attendance/${event.id}'),
          onPublish: () => _showPublishDialog(event),
        );
      },
    );
  }


  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  void _showSearchModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search Events'),
        content: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Search events...',
            border: OutlineInputBorder(),
          ),
          onChanged: (value) {
            setState(() {
              _filteredEvents = _filterEvents(_filteredEvents);
            });
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _onSearchChanged(String query) {
    setState(() {
      // Filter events based on search query
      _filteredEvents = _filterEvents(_filteredEvents);
    });
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _selectedFilter = filter;
      _filteredEvents = _filterEvents(_filteredEvents);
    });
  }

  List<dynamic> _filterEvents(List<dynamic> events) {
    List<dynamic> filtered = events;

    // Apply status filter
    if (_selectedFilter != 'All') {
      filtered = filtered.where((event) {
        if (_selectedFilter == 'Published') {
          return event.isPublished == true;
        } else if (_selectedFilter == 'Draft') {
          return event.isPublished == false;
        }
        return true;
      }).toList();
    }

    // Apply search filter
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      filtered = filtered.where((event) =>
        event.title.toLowerCase().contains(query) ||
        event.description.toLowerCase().contains(query) ||
        event.location.toLowerCase().contains(query)
      ).toList();
    }

    return filtered;
  }

  void _showPublishDialog(dynamic event) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Publish Event'),
        content: Text('Apakah Anda yakin ingin mempublish event "${event.title}"? Event akan terlihat oleh publik setelah dipublish.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _publishEvent(event.id);
            },
            child: const Text('Publish'),
          ),
        ],
      ),
    );
  }

  void _publishEvent(String eventId) {
    // Trigger publish event
    context.read<organizer_bloc.OrganizerBloc>().add(
      organizer_bloc.PublishOrganizerEvent(eventId: eventId),
    );
  }
}
