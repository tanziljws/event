import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
// import '../../notifications/bloc/notification_state.dart';
// import '../../notifications/bloc/notification_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../../core/constants/app_constants.dart';

/// Homepage header widget with location and navigation
class HomeHeader extends StatelessWidget {
  final String currentLocation;
  final bool isLoadingLocation;

  const HomeHeader({
    super.key,
    required this.currentLocation,
    required this.isLoadingLocation,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppConstants.primaryColor, // Blue background to match bottom nav
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 16,
      ),
      child: Row(
        children: [
          // Hamburger Menu
          _buildMenuButton(context),
          
          // Location Info
          Expanded(
            child: _buildLocationInfo(),
          ),
          
          // Notification Icon
          _buildNotificationButton(context),
        ],
      ),
    );
  }

  Widget _buildMenuButton(BuildContext context) {
    return IconButton(
      onPressed: () {
        // TODO: Implement drawer
      },
      icon: Image.asset(
        'assets/images/nusaevent.png',
        width: 40, // Logo size
        height: 40, // Logo size
        fit: BoxFit.contain,
      ),
    );
  }

  Widget _buildLocationInfo() {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is AuthAuthenticated) {
          // User is logged in - show user name
          return Column(
            children: [
              Text(
                'Welcome back',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person,
                    size: 14,
                    color: Colors.white.withOpacity(0.8),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    authState.user.fullName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          );
        } else {
          // User is not logged in - show sign in link
          return Column(
            children: [
              Text(
                'Hello there',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 2),
              GestureDetector(
                onTap: () => context.go('/login'),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.login,
                      size: 14,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Sign in or Register',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        }
      },
    );
  }


  Widget _buildNotificationButton(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          onPressed: () => context.go('/notifications'),
          icon: const Icon(
            Icons.notifications,
            color: Colors.white,
            size: 24,
          ),
        ),
        // Notification Badge (temporarily disabled)
        // BlocBuilder<NotificationBloc, NotificationState>(
        //   builder: (context, state) {
        //     int unreadCount = 0;
        //     
        //     if (state is NotificationLoaded) {
        //       unreadCount = state.unreadCount;
        //     }
        //     
        //     if (unreadCount > 0) {
        //       return Positioned(
        //         top: 8,
        //         right: 8,
        //         child: Container(
        //           padding: const EdgeInsets.all(4),
        //           decoration: const BoxDecoration(
        //             color: Color(0xFFEF4444),
        //             shape: BoxShape.circle,
        //           ),
        //           constraints: const BoxConstraints(
        //             minWidth: 16,
        //             minHeight: 16,
        //           ),
        //           child: Text(
        //             unreadCount > 99 ? '99+' : unreadCount.toString(),
        //             style: const TextStyle(
        //               color: Colors.white,
        //               fontSize: 10,
        //               fontWeight: FontWeight.bold,
        //             ),
        //             textAlign: TextAlign.center,
        //           ),
        //         ),
        //       );
        //     }
        //     
        //     return const SizedBox.shrink();
        //   },
        // ),
      ],
    );
  }
}
