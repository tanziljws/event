import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/navigation/navigation_history_manager.dart';
// import 'core/network/api_client.dart';
// import 'core/services/notification_service.dart';

import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/pages/login_page.dart';
import 'features/auth/pages/register_page.dart';
import 'features/auth/pages/progressive_register_page.dart';
import 'features/auth/pages/verify_email_page.dart';
import 'features/auth/pages/forgot_password_page.dart';
import 'features/auth/pages/reset_password_page.dart';
import 'features/events/pages/event_detail_page.dart';
import 'features/organizer/pages/create_event_page.dart';
import 'features/my_events/pages/my_events_page.dart';
import 'features/organizer/pages/organizer_dashboard_page.dart';
import 'features/analytics/pages/analytics_page.dart';
import 'features/analytics/pages/event_analytics_page.dart';
import 'features/my_registrations/pages/my_registrations_page.dart';
import 'features/attendance/pages/attendance_page.dart';
import 'features/profile/pages/edit_profile_page.dart';
import 'features/certificates/pages/certificates_page.dart';
import 'features/payments/pages/payments_page.dart';
import 'features/payments/pages/payment_detail_page.dart';
import 'features/settings/pages/settings_page.dart';
import 'features/tickets/pages/tickets_page.dart';
import 'features/tickets/pages/ticket_detail_page.dart';
import 'features/upgrade/pages/upgrade_page.dart';
import 'features/pricing/pages/pricing_page.dart';
import 'features/support/pages/support_page.dart';
import 'features/notifications/bloc/notification_bloc.dart';
import 'core/network/api_client.dart';
import 'core/services/notification_service.dart';
import 'features/onboarding/pages/onboarding_page.dart';
import 'features/onboarding/pages/reset_onboarding_page.dart';
import 'features/onboarding/pages/organizer_onboarding_page.dart';
import 'features/payments/pages/payment_page.dart';
import 'features/payments/pages/payment_test_page.dart';
import 'features/map/pages/map_page.dart';
import 'shared/widgets/splash_screen.dart';
import 'shared/widgets/error_page.dart';
import 'shared/widgets/simple_main_navigation.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final location = state.uri.toString();

      // Track navigation history
      final historyManager = NavigationHistoryManager();
      historyManager.addRoute(location);

      // Don't redirect if we're on splash screen, onboarding, or public pages
      if (location == '/splash' ||
          location == '/onboarding' ||
          location == '/organizer-onboarding' ||
          location == '/map' ||
          location == '/events' ||
          location == '/events/detail' ||
          location.startsWith('/events/detail/')) {
        return null;
      }

      // Get auth state
      final authBloc = context.read<AuthBloc>();
      final authState = authBloc.state;

      // Check if user is authenticated
      final isAuthenticated = authState is AuthAuthenticated;

      // Define protected routes that require authentication
      final protectedRoutes = [
        '/dashboard',
        '/my-events',
        '/analytics',
        '/my-registrations',
        '/attendance',
        '/profile',
        '/certificates',
        '/payments',
        '/tickets',
        '/settings',
        '/notifications',
        '/upgrade',
        '/pricing',
        '/support',

      ];

      // If user is not authenticated and trying to access protected routes
      if (!isAuthenticated && protectedRoutes.any((route) => location.startsWith(route))) {
        return '/login';
      }

      // If user is authenticated and trying to access auth pages, redirect to home
      if (isAuthenticated && (location == '/login' ||
          location == '/register' ||
          location == '/verify-email' ||
          location == '/forgot-password' ||
          location == '/reset-password')) {
        return '/home';
      }

      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Onboarding
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(
        path: '/reset-onboarding',
        builder: (context, state) => const ResetOnboardingPage(),
      ),
      GoRoute(
        path: '/organizer-onboarding',
        builder: (context, state) => const OrganizerOnboardingPage(),
      ),

      // Authentication Routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/register-progressive',
        builder: (context, state) => const ProgressiveRegisterPage(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          return VerifyEmailPage(email: email);
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'] ?? '';
          return ResetPasswordPage(token: token);
        },
      ),

      // Root Route (redirects to splash)
      GoRoute(
        path: '/',
        redirect: (context, state) => '/splash',
      ),

      // Main Navigation Routes (with PageView and swipe functionality)
      GoRoute(
        path: '/home',
        builder: (context, state) => const SimpleMainNavigation(initialIndex: 0),
      ),

      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const SimpleMainNavigation(initialIndex: 2),
      ),

      GoRoute(
        path: '/events',
        builder: (context, state) => const SimpleMainNavigation(initialIndex: 1),
        routes: [
          GoRoute(
            path: 'detail/:eventId',
            builder: (context, state) {
              final eventId = state.pathParameters['eventId'] ?? '';
              return EventDetailPage(eventId: eventId);
            },
          ),
        ],
      ),

      // Organizer Routes
      GoRoute(
        path: '/organizer-dashboard',
        builder: (context, state) => const OrganizerDashboardPage(),
      ),
      GoRoute(
        path: '/analytics',
        builder: (context, state) => const AnalyticsPage(),
        routes: [
          GoRoute(
            path: 'event/:eventId',
            builder: (context, state) {
              final eventId = state.pathParameters['eventId'] ?? '';
              final eventTitle = state.uri.queryParameters['title'] ?? 'Event Analytics';
              return EventAnalyticsPage(eventId: eventId, eventTitle: eventTitle);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/my-events',
        builder: (context, state) => const MyEventsPage(),
        routes: [
          GoRoute(
            path: 'create',
            builder: (context, state) => const CreateEventPage(),
          ),
          GoRoute(
            path: 'edit/:eventId',
            builder: (context, state) {
              final eventId = state.pathParameters['eventId'] ?? '';
              return CreateEventPage(); // TODO: Pass eventId for editing
            },
          ),
        ],
      ),

      // Participant Routes
      GoRoute(
        path: '/my-registrations',
        builder: (context, state) => const MyRegistrationsPage(),
      ),

      // Attendance Routes (Organizer)
      GoRoute(
        path: '/attendance',
        builder: (context, state) => const AttendancePage(),
      ),
      GoRoute(
        path: '/attendance/:eventId',
        builder: (context, state) {
          final eventId = state.pathParameters['eventId'] ?? '';
          return AttendancePage(eventId: eventId);
        },
      ),

      // Profile Routes
      GoRoute(
        path: '/profile',
        builder: (context, state) => const SimpleMainNavigation(initialIndex: 4),
        routes: [
          GoRoute(
            path: 'edit',
            builder: (context, state) => const EditProfilePage(),
          ),
        ],
      ),

      // Certificate Routes
      GoRoute(
        path: '/certificates',
        builder: (context, state) => const CertificatesPage(),
      ),

      // Payment Routes
      GoRoute(
        path: '/payments',
        builder: (context, state) => const PaymentsPage(),
        routes: [
          GoRoute(
            path: 'detail/:paymentId',
            builder: (context, state) {
              final paymentId = state.pathParameters['paymentId'] ?? '';
              return PaymentDetailPage(paymentId: paymentId);
            },
          ),
        ],
      ),

      // Tickets Routes
      GoRoute(
        path: '/tickets',
        builder: (context, state) => TicketsPage(extra: state.extra as Map<String, dynamic>?),
      ),

      // Ticket Detail Route
      GoRoute(
        path: '/tickets/detail/:ticketId',
        builder: (context, state) {
          final ticketId = state.pathParameters['ticketId'] ?? '';
          final ticket = state.extra as dynamic; // Ticket
          return TicketDetailPage(ticket: ticket);
        },
      ),

      // Settings Routes
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsPage(),
      ),






            // Pricing Routes
            GoRoute(
              path: '/pricing',
              builder: (context, state) => const PricingPage(),
            ),

            // Upgrade Routes
            GoRoute(
              path: '/upgrade',
              builder: (context, state) => const UpgradePage(),
            ),

      // Support Routes
      GoRoute(
        path: '/support',
        builder: (context, state) => const SupportPage(),
      ),

      // Map Routes (Location Discovery)
      GoRoute(
        path: '/map',
        builder: (context, state) => const MapPage(),
      ),

      // Payment Routes
      GoRoute(
        path: '/payment',
        builder: (context, state) {
          final eventId = state.uri.queryParameters['eventId'] ?? '';
          final eventTitle = state.uri.queryParameters['eventTitle'] ?? '';
          final amount = double.tryParse(state.uri.queryParameters['amount'] ?? '0') ?? 0.0;
          final customerName = state.uri.queryParameters['customerName'] ?? '';
          final customerEmail = state.uri.queryParameters['customerEmail'] ?? '';
          final customerPhone = state.uri.queryParameters['customerPhone'] ?? '';

          return PaymentPage(
            eventId: eventId,
            eventTitle: eventTitle,
            amount: amount,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
          );
        },
      ),
      GoRoute(
        path: '/payment-test',
        builder: (context, state) => const PaymentTestPage(),
      ),

      // Notification Routes
      GoRoute(
        path: '/notifications',
        builder: (context, state) => BlocProvider(
          create: (context) => NotificationBloc(
            apiClient: ApiClient(),
            notificationService: NotificationService(),
          ),
          child: const SimpleMainNavigation(initialIndex: 3),
        ),
      ),

      // Error Route
      GoRoute(
        path: '/error',
        builder: (context, state) {
          final message = state.uri.queryParameters['message'] ?? 'An error occurred';
          return ErrorPage(message: message);
        },
      ),
    ],
    errorBuilder: (context, state) => ErrorPage(
      message: 'Page not found: ${state.uri.toString()}',
    ),
  );
}
