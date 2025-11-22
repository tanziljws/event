import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../events/bloc/event_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../../shared/services/upgrade_service.dart';
import '../../../shared/services/switch_account_service.dart';

/// Quick actions section widget for homepage
class QuickActionsSection extends StatefulWidget {
  const QuickActionsSection({super.key});

  @override
  State<QuickActionsSection> createState() => _QuickActionsSectionState();
}

class _QuickActionsSectionState extends State<QuickActionsSection> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        return FutureBuilder<bool>(
          future: _isApprovedOrganizer(authState),
          builder: (context, snapshot) {
            final isOrganizer = snapshot.data ?? false;

            return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Akses Cepat',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03), // Lighter shadow
                      blurRadius: 6, // Reduced blur
                      offset: const Offset(0, 1), // Reduced offset
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Row 1 - Different actions for organizer vs participant
                    Row(
                      children: isOrganizer ? [
                        // Organizer actions
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Buat Event',
                            'assets/icons/create.png',
                            const Color(0xFF2563EB),
                            () => _handleAuthRequiredAction(context, '/my-events/create'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Event Saya',
                            'assets/icons/registration.png',
                            const Color(0xFF10B981),
                            () => _handleAuthRequiredAction(context, '/my-events'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Analytics',
                            'assets/icons/analystic.png',
                            const Color(0xFFF59E0B),
                            () => _handleAuthRequiredAction(context, '/analytics'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Profil',
                            'assets/icons/profile.png',
                            const Color(0xFF6B7280),
                            () => _handleAuthRequiredAction(context, '/profile'),
                          ),
                        ),
                      ] : [
                        // Participant actions
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Pendaftaran',
                            'assets/icons/registration.png',
                            const Color(0xFF2563EB),
                            () => _handleAuthRequiredAction(context, '/my-registrations'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Sertifikat',
                            'assets/icons/certif.png',
                            const Color(0xFF10B981),
                            () => _handleAuthRequiredAction(context, '/certificates'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Ticket',
                            'assets/icons/tickets.png',
                            const Color(0xFF6B7280),
                            () => _handleAuthRequiredAction(context, '/tickets'),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Profil',
                            'assets/icons/profile.png',
                            const Color(0xFFF59E0B),
                            () => _handleAuthRequiredAction(context, '/profile'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Row 2 - Common actions for all users
                    Row(
                      children: [
                        if (!isOrganizer) ...[
                          // Only show upgrade for participants
                          Expanded(
                            child: _buildSmallQuickActionWithImage(
                              context,
                              'Upgrade EO',
                              'assets/icons/eo.png',
                              const Color(0xFF059669),
                              () => _handleAuthRequiredAction(context, '/pricing'),
                            ),
                          ),
                        ],
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Minggu Ini',
                            'assets/icons/week.png',
                            const Color(0xFF10B981),
                            () => _showEventsThisWeek(context),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Gratis',
                            'assets/icons/free.png',
                            const Color(0xFFDC2626),
                            () => _showFreeEvents(context),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallQuickActionWithImage(
                            context,
                            'Map',
                            'assets/icons/map.png',
                            const Color(0xFF3B82F6),
                            () => context.go('/map'),
                          ),
                        ),
                        if (isOrganizer) ...[
                          // Show Support for organizers to complete 4 columns
                          Expanded(
                            child: _buildSmallQuickActionWithImage(
                              context,
                              'Support',
                              'assets/icons/support.png',
                              const Color(0xFFF59E0B),
                              () => _handleSupport(context),
                            ),
                          ),
                        ],
                      ],
                    ),

                    // Expandable Row 3 - Additional actions (only for participants)
                    if (_isExpanded && !isOrganizer) ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildSmallQuickActionWithImage(
                              context,
                              'Support',
                              'assets/icons/support.png',
                              const Color(0xFFF59E0B),
                              () => _handleSupport(context),
                            ),
                          ),
                          Expanded(
                            child: _buildSmallQuickActionWithImage(
                              context,
                              'Payments',
                              'assets/icons/payments.png',
                              const Color(0xFF06B6D4),
                              () => _handleAuthRequiredAction(context, '/payments'),
                            ),
                          ),
                          const Expanded(
                            child: SizedBox(), // Empty space to maintain 4-column layout
                          ),
                          const Expanded(
                            child: SizedBox(), // Empty space to maintain 4-column layout
                          ),
                        ],
                      ),
                    ],

                    // Expand/Collapse button (only for participants)
                    if (!isOrganizer) ...[
                      const SizedBox(height: 12),
                      Center(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _isExpanded = !_isExpanded;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _isExpanded ? 'Tutup' : 'Lihat Semua',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  _isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                  size: 16,
                                  color: Colors.grey[700],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
          },
        );
      },
    );
  }

  // Small Quick Action Widget
  Widget _buildSmallQuickAction(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: color,
              size: 32,
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // Small Quick Action Widget with Local Image
  Widget _buildSmallQuickActionWithImage(
    BuildContext context,
    String title,
    String imagePath,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon tanpa background container
            Image.asset(
              imagePath,
              width: 37,  // Perbesar ke 37 (32 + 5)
              height: 37, // Perbesar ke 37 (32 + 5)
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                print('❌ Error loading image: $imagePath');
                print('❌ Error: $error');
                // Fallback ke icon Material jika image gagal load
                return Icon(
                  Icons.star,
                  color: color,
                  size: 37, // Ukuran sama dengan image
                );
              },
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // Handle Upgrade EO
  void _handleUpgradeEO(BuildContext context) async {
    try {
      // Check upgrade status
      final status = await UpgradeService.getUpgradeStatus();

      if (status['success'] == true) {
        final userData = status['data'];
        final verificationStatus = userData?['verificationStatus'];
        final role = userData?['role'];

        if (role == 'ORGANIZER' && verificationStatus == 'APPROVED') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You are already a verified organizer!'),
              backgroundColor: Colors.green,
            ),
          );
          return;
        } else if (role == 'ORGANIZER' && verificationStatus == 'PENDING') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Your organizer application is pending review'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        } else if (role == 'ORGANIZER' && verificationStatus == 'REJECTED') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Your previous application was rejected. You can re-apply'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }

      // Navigate to pricing page first
      context.go('/pricing');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error checking upgrade status: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Handle Support
  void _handleSupport(BuildContext context) {
    context.go('/support');
  }

  // Handle authentication required actions
  void _handleAuthRequiredAction(BuildContext context, String route) {
    final authState = context.read<AuthBloc>().state;

    if (authState is AuthAuthenticated) {
      // User is authenticated, proceed to route
      context.go(route);
    } else {
      // User is not authenticated, redirect to login
      context.go('/login');
    }
  }

  // Helper method to determine if user is approved organizer
  Future<bool> _isApprovedOrganizer(AuthState authState) async {
    if (authState is AuthAuthenticated) {
      // Check if user is currently in organizer mode via switch account
      final isInOrganizerMode = await SwitchAccountService.isInOrganizerMode();
      if (isInOrganizerMode && authState.user.role == 'ORGANIZER' && authState.user.verificationStatus == 'APPROVED') {
        return true;
      }

      // If user is in participant mode, don't show organizer actions
      final isInParticipantMode = await SwitchAccountService.isInParticipantMode();
      if (isInParticipantMode) {
        return false;
      }

      // Original logic for non-switched users
      return authState.user.role == 'ORGANIZER' &&
             authState.user.verificationStatus == 'APPROVED';
    }
    return false;
  }

  // Upgrade EO Bottom Sheet (Legacy - will be replaced by upgrade page)
  void _showUpgradeEOBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.sizeOf(context).height * 0.7, // ✅ Optimized MediaQuery
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Upgrade to Event Organizer',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Upgrade info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF059669).withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF059669).withOpacity(0.2),
                ),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.star,
                    size: 48,
                    color: Color(0xFF059669),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Become an Event Organizer',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Upgrade your account to create and manage your own events.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Benefits section
            const Text(
              'Benefits of Being an Organizer:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),

            Expanded(
              child: ListView(
                children: [
                  _buildBenefitItem(
                    Icons.event,
                    'Create Events',
                    'Create and manage your own events',
                  ),
                  _buildBenefitItem(
                    Icons.people,
                    'Manage Participants',
                    'Track and manage event participants',
                  ),
                  _buildBenefitItem(
                    Icons.analytics,
                    'Event Analytics',
                    'View detailed analytics and insights',
                  ),
                  _buildBenefitItem(
                    Icons.card_membership,
                    'Generate Certificates',
                    'Automatically generate certificates for participants',
                  ),
                  _buildBenefitItem(
                    Icons.payment,
                    'Payment Management',
                    'Handle payments and ticket sales',
                  ),
                  _buildBenefitItem(
                    Icons.support_agent,
                    'Priority Support',
                    'Get priority customer support',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Upgrade button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _showUpgradeConfirmation(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Upgrade Now',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper methods for Upgrade EO
  Widget _buildBenefitItem(IconData icon, String title, String description) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF059669).withOpacity(0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: const Color(0xFF059669),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showUpgradeConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          'Confirm Upgrade',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.star,
              size: 48,
              color: Color(0xFF059669),
            ),
            const SizedBox(height: 16),
            const Text(
              'Are you sure you want to upgrade to Event Organizer?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This action will change your account role from Participant to Organizer.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processUpgrade(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Upgrade',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _processUpgrade(BuildContext context) {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Processing upgrade...'),
          ],
        ),
      ),
    );

    // Simulate API call
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pop(context); // Close loading dialog

      // Show success dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Upgrade Successful!',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF059669),
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                size: 48,
                color: Color(0xFF059669),
              ),
              const SizedBox(height: 16),
              const Text(
                'Congratulations! You are now an Event Organizer.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You can now create and manage your own events.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                // TODO: Refresh user data and navigate to dashboard
                context.go('/dashboard');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Go to Dashboard',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  // Events This Week
  void _showEventsThisWeek(BuildContext context) {
    // Calculate date range for this week (next 7 days)
    final now = DateTime.now();
    final endOfWeek = now.add(const Duration(days: 7));

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.sizeOf(context).height * 0.8, // ✅ Optimized MediaQuery
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Events This Week',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Date range info
            // Date range info - tanpa background color
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 8),
                Text(
                  '${_formatDate(now)} - ${_formatDate(endOfWeek)}',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Events list
            Expanded(
              child: BlocBuilder<EventBloc, EventState>(
                builder: (context, state) {
                  if (state is EventLoading) {
                    return _buildLoadingEvents();
                  } else if (state is EventLoaded) {
                    // Filter events for this week
                    final thisWeekEvents = state.events.where((event) {
                      final eventDate = event.eventDate;
                      return eventDate.isAfter(now.subtract(const Duration(days: 1))) &&
                             eventDate.isBefore(endOfWeek.add(const Duration(days: 1)));
                    }).toList();

                    if (thisWeekEvents.isEmpty) {
                      return _buildEmptyEventsThisWeek();
                    }

                    return ListView.builder(
                      itemCount: thisWeekEvents.length,
                      itemBuilder: (context, index) {
                        final event = thisWeekEvents[index];
                        return _buildEventThisWeekCard(context, event);
                      },
                    );
                  } else if (state is EventFailure) {
                    return _buildErrorEvents(state.message);
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

  // Helper methods for Events This Week
  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]}';
  }

  Widget _buildLoadingEvents() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading events...'),
        ],
      ),
    );
  }

  Widget _buildEmptyEventsThisWeek() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Events This Week',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'There are no events scheduled for the next 7 days.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorEvents(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Error Loading Events',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventThisWeekCard(BuildContext context, dynamic event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.pop(context);
            context.go('/events/detail/${event.id}');
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Event image
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey[100],
                  ),
                  child: event.thumbnailUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: event.thumbnailUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.grey[100],
                              child: const Center(
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                            errorWidget: (context, url, error) => Icon(
                              Icons.event,
                              color: Colors.grey[400],
                            ),
                          ),
                        )
                      : Icon(
                          Icons.event,
                          color: Colors.grey[400],
                        ),
                ),
                const SizedBox(width: 12),

                // Event details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(event.eventDate),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            event.eventTime,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              event.location,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Arrow
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey[400],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Free Events
  void _showFreeEvents(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.sizeOf(context).height * 0.8, // ✅ Optimized MediaQuery
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Free Events',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Free events info - tanpa background color
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.free_breakfast,
                  size: 16,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Events tanpa biaya pendaftaran',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Events list
            Expanded(
              child: BlocBuilder<EventBloc, EventState>(
                builder: (context, state) {
                  if (state is EventLoading) {
                    return _buildLoadingEvents();
                  } else if (state is EventLoaded) {
                    // Filter events that are free
                    final freeEvents = state.events.where((event) => event.isFree).toList();

                    if (freeEvents.isEmpty) {
                      return _buildEmptyFreeEvents();
                    }

                    return ListView.builder(
                      itemCount: freeEvents.length,
                      itemBuilder: (context, index) {
                        final event = freeEvents[index];
                        return _buildFreeEventCard(context, event);
                      },
                    );
                  } else if (state is EventFailure) {
                    return _buildErrorEvents(state.message);
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

  // Helper methods for Free Events
  Widget _buildEmptyFreeEvents() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.free_breakfast_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Free Events',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'There are currently no free events available.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFreeEventCard(BuildContext context, dynamic event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.pop(context);
            context.go('/events/detail/${event.id}');
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Event image
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey[100],
                  ),
                  child: event.thumbnailUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: event.thumbnailUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.grey[100],
                              child: const Center(
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                            errorWidget: (context, url, error) => Icon(
                              Icons.event,
                              color: Colors.grey[400],
                            ),
                          ),
                        )
                      : Icon(
                          Icons.event,
                          color: Colors.grey[400],
                        ),
                ),
                const SizedBox(width: 12),

                // Event details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(event.eventDate),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            event.eventTime,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              event.location,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Free badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'GRATIS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Popular Venues
  void _showPopularVenues(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.sizeOf(context).height * 0.8, // ✅ Optimized MediaQuery
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Popular Venues',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Venues info
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.location_city,
                    size: 16,
                    color: Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Tempat-tempat populer untuk event',
                    style: TextStyle(
                      color: Color(0xFFF59E0B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Venues list
            Expanded(
              child: BlocBuilder<EventBloc, EventState>(
                builder: (context, state) {
                  if (state is EventLoading) {
                    return _buildLoadingEvents();
                  } else if (state is EventLoaded) {
                    // Group events by location and count occurrences
                    final venueMap = <String, int>{};
                    for (final event in state.events) {
                      venueMap[event.location] = (venueMap[event.location] ?? 0) + 1;
                    }

                    // Sort venues by event count (most popular first)
                    final sortedVenues = venueMap.entries.toList()
                      ..sort((a, b) => b.value.compareTo(a.value));

                    if (sortedVenues.isEmpty) {
                      return _buildEmptyVenues();
                    }

                    return ListView.builder(
                      itemCount: sortedVenues.length,
                      itemBuilder: (context, index) {
                        final venue = sortedVenues[index];
                        return _buildVenueCard(context, venue.key, venue.value);
                      },
                    );
                  } else if (state is EventFailure) {
                    return _buildErrorEvents(state.message);
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

  // Helper methods for Popular Venues
  Widget _buildEmptyVenues() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.location_city_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Venues Found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No venue data available at the moment.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVenueCard(BuildContext context, String venueName, int eventCount) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.pop(context);
            // TODO: Navigate to venue detail or filter events by venue
            _showVenueEvents(context, venueName);
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Venue icon
                const Icon(
                  Icons.location_city,
                  size: 32,
                  color: Color(0xFFF59E0B),
                ),
                const SizedBox(width: 12),

                // Venue details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        venueName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.event,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$eventCount ${eventCount == 1 ? 'event' : 'events'}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.trending_up,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _getPopularityText(eventCount),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Popularity badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getPopularityColor(eventCount).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getPopularityBadge(eventCount),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getPopularityColor(eventCount),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getPopularityText(int eventCount) {
    if (eventCount >= 10) return 'Very Popular';
    if (eventCount >= 5) return 'Popular';
    if (eventCount >= 3) return 'Moderate';
    return 'New Venue';
  }

  Color _getPopularityColor(int eventCount) {
    if (eventCount >= 10) return const Color(0xFFDC2626); // Red
    if (eventCount >= 5) return const Color(0xFFF59E0B); // Orange
    if (eventCount >= 3) return const Color(0xFF10B981); // Green
    return const Color(0xFF6B7280); // Gray
  }

  String _getPopularityBadge(int eventCount) {
    if (eventCount >= 10) return 'HOT';
    if (eventCount >= 5) return 'POP';
    if (eventCount >= 3) return 'NEW';
    return 'NEW';
  }

  void _showVenueEvents(BuildContext context, String venueName) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.sizeOf(context).height * 0.8, // ✅ Optimized MediaQuery
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Events at $venueName',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Venue info
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.location_city,
                    size: 16,
                    color: Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Events held at $venueName',
                    style: const TextStyle(
                      color: Color(0xFFF59E0B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Events list
            Expanded(
              child: BlocBuilder<EventBloc, EventState>(
                builder: (context, state) {
                  if (state is EventLoading) {
                    return _buildLoadingEvents();
                  } else if (state is EventLoaded) {
                    // Filter events by venue
                    final venueEvents = state.events.where((event) => event.location == venueName).toList();

                    if (venueEvents.isEmpty) {
                      return _buildEmptyVenueEvents(venueName);
                    }

                    return ListView.builder(
                      itemCount: venueEvents.length,
                      itemBuilder: (context, index) {
                        final event = venueEvents[index];
                        return _buildEventThisWeekCard(context, event);
                      },
                    );
                  } else if (state is EventFailure) {
                    return _buildErrorEvents(state.message);
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

  Widget _buildEmptyVenueEvents(String venueName) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_busy_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Events at $venueName',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'There are currently no events scheduled at this venue.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}
