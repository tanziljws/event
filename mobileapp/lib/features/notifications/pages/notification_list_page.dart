import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/notification_event.dart';
import '../bloc/notification_state.dart';
import '../bloc/notification_bloc.dart';
import '../bloc/realtime_notification_bloc.dart';
import '../../../features/auth/bloc/auth_bloc.dart';
import '../widgets/role_specific_notification_item.dart';
import '../widgets/notification_summary_card.dart';
import '../widgets/notification_empty_state.dart';
import '../widgets/notification_error_state.dart';
import '../widgets/notification_filter_chips.dart';
import '../../../core/constants/app_constants.dart';

class NotificationListPage extends StatefulWidget {
  const NotificationListPage({super.key});

  @override
  State<NotificationListPage> createState() => _NotificationListPageState();
}

class _NotificationListPageState extends State<NotificationListPage> {
  final ScrollController _scrollController = ScrollController();
  int _currentPage = 1;
  NotificationFilter _selectedFilter = NotificationFilter.all;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    
    // Load initial notifications
    context.read<NotificationBloc>().add(LoadNotifications(page: 1));
    
    // Initialize real-time notifications if user is authenticated
    _initializeRealtimeNotifications();
  }

  void _initializeRealtimeNotifications() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      // Initialize real-time notifications
      context.read<RealtimeNotificationBloc>().add(
        InitializeRealtimeNotifications(
          userId: authState.user.id,
          accessToken: authState.accessToken,
        ),
      );
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      final state = context.read<NotificationBloc>().state;
      if (state is NotificationLoaded && state.hasMore) {
        _currentPage++;
        context.read<NotificationBloc>().add(LoadNotifications(page: _currentPage));
      }
    }
  }

  void _onRefresh() {
    _currentPage = 1;
    context.read<NotificationBloc>().add(RefreshNotifications());
  }

  void _markAllAsRead() {
    context.read<NotificationBloc>().add(MarkAllNotificationsAsRead());
  }

  void _onFilterChanged(NotificationFilter filter) {
    setState(() {
      _selectedFilter = filter;
    });

    final authState = context.read<AuthBloc>().state;
    String userRole = 'PARTICIPANT'; // Default role
    
    if (authState is AuthAuthenticated) {
      // Only treat as ORGANIZER if verification status is APPROVED
      if (authState.user.role == 'ORGANIZER' && authState.user.verificationStatus == 'APPROVED') {
        userRole = 'ORGANIZER';
      } else {
        // REJECTED organizers and others are treated as PARTICIPANT
        userRole = 'PARTICIPANT';
      }
    }

    switch (filter) {
      case NotificationFilter.all:
        context.read<NotificationBloc>().add(LoadNotifications(page: 1, forceRefresh: true));
        break;
      case NotificationFilter.participant:
        context.read<NotificationBloc>().add(LoadNotifications(
          page: 1,
          forceRefresh: true,
        ));
        break;
      case NotificationFilter.organizer:
        context.read<NotificationBloc>().add(LoadNotifications(
          page: 1,
          forceRefresh: true,
        ));
        break;
      case NotificationFilter.unread:
        context.read<NotificationBloc>().add(LoadNotifications(
          page: 1,
          forceRefresh: true,
        ));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppConstants.backgroundColor,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Notifikasi',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          BlocBuilder<NotificationBloc, NotificationState>(
            builder: (context, state) {
              if (state is NotificationLoaded && state.unreadCount > 0) {
                return TextButton(
                  onPressed: _markAllAsRead,
                  child: const Text(
                    'Tandai Semua Dibaca',
                    style: TextStyle(
                      color: Color(0xFF059669),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          // Listen to real-time notifications
          BlocListener<RealtimeNotificationBloc, RealtimeNotificationState>(
            listener: (context, realtimeState) {
              if (realtimeState is RealtimeNotificationConnected) {
                // When new real-time notification arrives, refresh the list
                if (realtimeState.recentNotifications.isNotEmpty) {
                  final latestNotification = realtimeState.recentNotifications.first;
                  
                  // Show snackbar for new notification
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Row(
                        children: [
                          const Icon(Icons.notifications, color: Colors.white),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              latestNotification.title,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      backgroundColor: const Color(0xFF059669),
                      duration: const Duration(seconds: 3),
                      action: SnackBarAction(
                        label: 'Lihat',
                        textColor: Colors.white,
                        onPressed: () {
                          // Scroll to top to show new notification
                          _scrollController.animateTo(
                            0,
                            duration: const Duration(milliseconds: 500),
                            curve: Curves.easeInOut,
                          );
                        },
                      ),
                    ),
                  );
                  
                  // Refresh notifications list to include new notification
                  context.read<NotificationBloc>().add(RefreshNotifications());
                }
              }
            },
          ),
        ],
        child: Column(
          children: [
            // Filter Chips
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, authState) {
                String userRole = 'PARTICIPANT';
                if (authState is AuthAuthenticated) {
                  // Only treat as ORGANIZER if verification status is APPROVED
                  if (authState.user.role == 'ORGANIZER' && authState.user.verificationStatus == 'APPROVED') {
                    userRole = 'ORGANIZER';
                  } else {
                    // REJECTED organizers and others are treated as PARTICIPANT
                    userRole = 'PARTICIPANT';
                  }
                }
                
                return NotificationFilterChips(
                  selectedFilter: _selectedFilter,
                  onFilterChanged: _onFilterChanged,
                  userRole: userRole,
                );
              },
            ),
            
            // Notification List
            Expanded(
              child: BlocBuilder<NotificationBloc, NotificationState>(
                builder: (context, state) {
                  if (state is NotificationLoading) {
                    return const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF059669)),
                      ),
                    );
                  }

                  if (state is NotificationFailure) {
                    return NotificationErrorState(
                      message: state.message,
                    );
                  }

                  if (state is NotificationLoaded) {
                    if (state.notifications.isEmpty) {
                      return const NotificationEmptyState();
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        _onRefresh();
                      },
                      color: const Color(0xFF059669),
                      child: Column(
                        children: [
                          // Summary Card
                          BlocBuilder<AuthBloc, AuthState>(
                            builder: (context, authState) {
                              String userRole = 'PARTICIPANT';
                              if (authState is AuthAuthenticated) {
                                // Only treat as ORGANIZER if verification status is APPROVED
                                if (authState.user.role == 'ORGANIZER' && authState.user.verificationStatus == 'APPROVED') {
                                  userRole = 'ORGANIZER';
                                } else {
                                  // REJECTED organizers and others are treated as PARTICIPANT
                                  userRole = 'PARTICIPANT';
                                }
                              }
                              
                              return NotificationSummaryCard(
                                userRole: userRole,
                              );
                            },
                          ),
                          
                          // Notification List
                          Expanded(
                            child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: state.notifications.length,
                        itemBuilder: (context, index) {
                          if (index == state.notifications.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF059669)),
                                ),
                              ),
                            );
                          }

                          final notification = state.notifications[index];
                          
                          // Get user role for role-specific display
                          final authState = context.read<AuthBloc>().state;
                          String userRole = 'PARTICIPANT';
                          if (authState is AuthAuthenticated) {
                            // Only treat as ORGANIZER if verification status is APPROVED
                            if (authState.user.role == 'ORGANIZER' && authState.user.verificationStatus == 'APPROVED') {
                              userRole = 'ORGANIZER';
                            } else {
                              // REJECTED organizers and others are treated as PARTICIPANT
                              userRole = 'PARTICIPANT';
                            }
                          }
                          
                          return RoleSpecificNotificationItem(
                            notification: notification,
                            userRole: userRole,
                            onTap: () {
                              if (!notification.isRead) {
                                context.read<NotificationBloc>().add(MarkNotificationAsRead(notification.id));
                              }
                            },
                          );
                        },
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
