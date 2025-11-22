import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/network/api_client.dart';
import 'core/services/network_cache_service.dart';
import 'core/services/memory_optimization_service.dart';
import 'shared/services/auth_service.dart';
import 'shared/services/navigation_service.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/events/bloc/event_bloc.dart';
import 'features/registration/bloc/registration_bloc.dart';
import 'features/tickets/bloc/tickets_bloc.dart';
// import 'features/notifications/bloc/notification_bloc.dart';
// import 'features/notifications/bloc/realtime_notification_bloc.dart';
// import 'core/services/notification_service.dart';
import 'features/attendance/bloc/attendance_bloc.dart';
import 'features/organizer/bloc/organizer_bloc.dart';
import 'features/organizer/services/organizer_service.dart';
import 'features/analytics/bloc/analytics_bloc.dart';
import 'features/analytics/bloc/event_analytics_bloc.dart';
import 'features/upgrade/bloc/upgrade_bloc.dart';
import 'features/payments/bloc/payment_bloc.dart';
import 'app_router.dart';
import 'app_theme.dart';

void main() async {
  // Wrap everything in error handling
  try {
    WidgetsFlutterBinding.ensureInitialized();
    
    // Set system UI mode first to prevent black screen
    SystemChrome.setEnabledSystemUIMode(
      SystemUiMode.manual,
      overlays: [SystemUiOverlay.top],
    );
    
    // Set status bar color to prevent black screen
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
    
    // Add error handling for uncaught exceptions
    FlutterError.onError = (FlutterErrorDetails details) {
      print('Flutter Error: ${details.exception}');
      print('Stack trace: ${details.stack}');
    };
    
    runApp(const EventManagementApp());
    
    // Initialize services in background after app starts
    _initializeServicesInBackground();
  } catch (e, stackTrace) {
    print('Main initialization error: $e');
    print('Stack trace: $stackTrace');
    // Run a minimal app if there's an error
    runApp(const MaterialApp(
      home: Scaffold(
        body: Center(
          child: Text('App initialization failed. Please restart.'),
        ),
      ),
    ));
  }
}

void _initializeServicesInBackground() async {
  try {
    // Initialize Hive for local storage
    await Hive.initFlutter();
    
    // Initialize SharedPreferences
    await SharedPreferences.getInstance();
    
    // Initialize API client
    ApiClient().initialize();
    
    // Initialize performance optimization services
    try {
      await NetworkCacheService().cleanExpiredCache();
    } catch (e) {
      print('Network cache initialization error: $e');
    }
    
    try {
      await MemoryOptimizationService().initialize();
    } catch (e) {
      print('Memory optimization initialization error: $e');
    }
    
    // Initialize auth service
    try {
      await AuthService().initialize();
    } catch (e) {
      print('Auth service initialization error: $e');
    }
    
    // Initialize navigation service
    try {
      NavigationService().initialize();
    } catch (e) {
      print('Navigation service initialization error: $e');
    }
  } catch (e) {
    print('Background initialization error: $e');
  }
}

class EventManagementApp extends StatelessWidget {
  const EventManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) {
            try {
              final bloc = AuthBloc();
              // Add initialization event after a brief delay to ensure proper context
              Future.microtask(() {
                try {
                  if (!bloc.isClosed) {
                    bloc.add(AuthInitialized());
                  }
                } catch (e) {
                  print('AuthBloc initialization error: $e');
                }
              });
              return bloc;
            } catch (e) {
              print('AuthBloc creation error: $e');
              return AuthBloc(); // Return a basic bloc if there's an error
            }
          },
        ),
        BlocProvider<EventBloc>(
          create: (context) {
            try {
              final bloc = EventBloc();
              // Add initialization event after a brief delay to ensure proper context
              Future.microtask(() {
                try {
                  if (!bloc.isClosed) {
                    bloc.add(EventInitialized());
                  }
                } catch (e) {
                  print('EventBloc initialization error: $e');
                }
              });
              return bloc;
            } catch (e) {
              print('EventBloc creation error: $e');
              return EventBloc(); // Return a basic bloc if there's an error
            }
          },
        ),
        BlocProvider<RegistrationBloc>(
          create: (context) => RegistrationBloc(),
        ),
        BlocProvider<TicketsBloc>(
          create: (context) => TicketsBloc(),
        ),
        // Notification providers temporarily disabled for location discovery testing
        // BlocProvider<NotificationBloc>(
        //   create: (context) => NotificationBloc(
        //     apiClient: ApiClient(),
        //     notificationService: NotificationService(),
        //   ),
        // ),
        // BlocProvider<RealtimeNotificationBloc>(
        //   create: (context) => RealtimeNotificationBloc(),
        // ),
        BlocProvider<AttendanceBloc>(
          create: (context) => AttendanceBloc(),
        ),
        BlocProvider<OrganizerBloc>(
          create: (context) => OrganizerBloc(organizerService: OrganizerService()),
        ),
        BlocProvider<AnalyticsBloc>(
          create: (context) => AnalyticsBloc(),
        ),
        BlocProvider<EventAnalyticsBloc>(
          create: (context) => EventAnalyticsBloc(),
        ),
        BlocProvider<UpgradeBloc>(
          create: (context) => UpgradeBloc(),
        ),
        BlocProvider<PaymentBloc>(
          create: (context) => PaymentBloc(),
        ),
      ],
      child: MaterialApp.router(
        title: 'Nusa',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: AppRouter.router,
        debugShowCheckedModeBanner: false,
        // Prevent black screen during initialization
        builder: (context, child) {
          // Safely handle MediaQuery context with error boundary
          return Builder(
            builder: (builderContext) {
              try {
                final mediaQueryData = MediaQuery.maybeOf(builderContext);
                if (mediaQueryData == null) {
                  // Fallback if MediaQuery is not available
                  return child ?? const SizedBox.shrink();
                }
                return MediaQuery(
                  data: mediaQueryData.copyWith(
                    textScaler: const TextScaler.linear(1.0),
                  ),
                  child: child ?? const SizedBox.shrink(),
                );
              } catch (e) {
                print('MediaQuery builder error: $e');
                // Return child without MediaQuery modification if there's an error
                return child ?? const SizedBox.shrink();
              }
            },
          );
        },
      ),
    );
  }
}

