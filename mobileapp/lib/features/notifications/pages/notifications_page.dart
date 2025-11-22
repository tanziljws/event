import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/notification_bloc.dart';
import '../bloc/notification_event.dart';
import '../bloc/notification_state.dart';
import '../widgets/notification_list.dart';
import '../widgets/notification_filters.dart';
import '../widgets/notification_search_bar.dart';
import '../widgets/notification_settings.dart';
import '../../../shared/widgets/loading_overlay.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  String? _selectedFilter;
  bool _showSettings = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    
    // Load notifications
    context.read<NotificationBloc>().add(const LoadNotifications());
    
    // Load notification settings
    context.read<NotificationBloc>().add(const LoadNotificationSettings());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      context.read<NotificationBloc>().add(const LoadMoreNotifications());
    }
  }

  void _onSearchChanged(String query) {
    if (query.isEmpty) {
      context.read<NotificationBloc>().add(const ClearSearch());
    } else {
      context.read<NotificationBloc>().add(SearchNotifications(query));
    }
  }

  void _onFilterChanged(String? filter) {
    setState(() {
      _selectedFilter = filter;
    });
    context.read<NotificationBloc>().add(FilterNotificationsByType(filter));
  }

  void _onRefresh() {
    context.read<NotificationBloc>().add(const RefreshNotifications());
  }

  void _onMarkAllAsRead() {
    context.read<NotificationBloc>().add(const MarkAllNotificationsAsRead());
  }

  void _onClearAll() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Notifications'),
        content: const Text('Are you sure you want to clear all notifications? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<NotificationBloc>().add(const ClearAllNotifications());
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  void _onSettingsToggle() {
    setState(() {
      _showSettings = !_showSettings;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _onMarkAllAsRead,
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all as read',
          ),
          IconButton(
            onPressed: _onClearAll,
            icon: const Icon(Icons.clear_all),
            tooltip: 'Clear all',
          ),
          IconButton(
            onPressed: _onSettingsToggle,
            icon: Icon(_showSettings ? Icons.close : Icons.settings),
            tooltip: 'Settings',
          ),
        ],
      ),
      body: BlocConsumer<NotificationBloc, NotificationState>(
        listener: (context, state) {
          if (state is NotificationFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          } else if (state is AllNotificationsMarkedAsRead) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('All notifications marked as read'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is AllNotificationsCleared) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('All notifications cleared'),
                backgroundColor: Colors.green,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is NotificationLoading) {
            return const LoadingOverlay(isLoading: true, child: CircularProgressIndicator());
          }

          if (state is NotificationLoaded) {
            return Column(
              children: [
                // Search Bar
                NotificationSearchBar(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                ),
                
                // Filters
                NotificationFilters(
                  selectedFilter: _selectedFilter,
                  onFilterChanged: _onFilterChanged,
                ),
                
                // Settings Panel
                if (_showSettings)
                  NotificationSettings(
                    settings: state.settings,
                    onSettingsChanged: (settings) {
                      context.read<NotificationBloc>().add(UpdateNotificationSettings(settings));
                    },
                  ),
                
                // Notifications List
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async => _onRefresh(),
                    child: NotificationList(
                      notifications: state.notifications,
                      hasMore: state.hasMore,
                      onMarkAsRead: (notificationId) {
                        context.read<NotificationBloc>().add(MarkNotificationAsRead(notificationId));
                      },
                      onDelete: (notificationId) {
                        context.read<NotificationBloc>().add(DeleteNotification(notificationId));
                      },
                      onTap: (notification) {
                        _handleNotificationTap(notification);
                      },
                    ),
                  ),
                ),
              ],
            );
          }

          if (state is NotificationFailure) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load notifications',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _onRefresh,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return const Center(
            child: CircularProgressIndicator(),
          );
        },
      ),
    );
  }

  void _handleNotificationTap(notification) {
    // Handle notification tap based on type
    final data = notification.data;
    
    if (data != null) {
      switch (notification.type) {
        case 'event_registration':
        case 'event_reminder':
        case 'event_update':
        case 'event_cancellation':
          if (data['eventId'] != null) {
            context.go('/events/detail/${data['eventId']}');
          }
          break;
        case 'payment_confirmation':
          context.go('/payments/history');
          break;
        case 'organizer_approval':
        case 'organizer_rejection':
          context.go('/organizer/dashboard');
          break;
        default:
          // Stay on notifications page
          break;
      }
    }
  }
}