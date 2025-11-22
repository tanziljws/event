import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../../shared/services/switch_account_service.dart';

class DashboardQuickActions extends StatelessWidget {
  final AuthAuthenticated authState;

  const DashboardQuickActions({
    super.key,
    required this.authState,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _isParticipant(authState.user),
      builder: (context, snapshot) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            _buildModernQuickActions(context, snapshot.data ?? false),
          ],
        );
      },
    );
  }

  Widget _buildModernQuickActions(BuildContext context, bool isParticipant) {
    final actions = _getQuickActions(context, isParticipant);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          // Responsive row layout - same as home page
          Row(
            children: actions.map((action) => Expanded(
              child: _buildSmallQuickActionWithImage(
                context,
                action['title'] as String,
                action['imagePath'] as String,
                action['color'] as Color,
                action['onTap'] as VoidCallback,
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _getQuickActions(BuildContext context, bool isParticipant) {
    final List<Map<String, dynamic>> actions = [];

    if (isParticipant) {
      // Participant actions - using same icons as home page
      actions.addAll([
        {
          'title': 'Pendaftaran',
          'subtitle': 'View your event registrations',
          'imagePath': 'assets/icons/registration.png',
          'color': const Color(0xFF2563EB),
          'onTap': () => context.go('/my-registrations'),
        },
        {
          'title': 'Sertifikat',
          'subtitle': 'Download your certificates',
          'imagePath': 'assets/icons/certif.png',
          'color': const Color(0xFF10B981),
          'onTap': () => context.go('/certificates'),
        },
        {
          'title': 'Ticket',
          'subtitle': 'View your event tickets',
          'imagePath': 'assets/icons/tickets.png',
          'color': const Color(0xFF6B7280),
          'onTap': () => context.go('/tickets'),
        },
        {
          'title': 'Profil',
          'subtitle': 'View your profile',
          'imagePath': 'assets/icons/profile.png',
          'color': const Color(0xFFF59E0B),
          'onTap': () => context.go('/profile'),
        },
      ]);
    } else {
      // Organizer actions - using same icons as home page
      actions.addAll([
        {
          'title': 'Buat Event',
          'subtitle': 'Create a new event',
          'imagePath': 'assets/icons/create.png',
          'color': const Color(0xFF2563EB),
          'onTap': () => context.go('/my-events/create'),
        },
        {
          'title': 'Event Saya',
          'subtitle': 'Manage your events',
          'imagePath': 'assets/icons/registration.png',
          'color': const Color(0xFF10B981),
          'onTap': () => context.go('/my-events'),
        },
        {
          'title': 'Analytics',
          'subtitle': 'View event analytics',
          'imagePath': 'assets/icons/analystic.png',
          'color': const Color(0xFFF59E0B),
          'onTap': () => context.go('/analytics'),
        },
        {
          'title': 'Attendance',
          'subtitle': 'Manage event attendance',
          'imagePath': 'assets/icons/qr.png',
          'color': const Color(0xFF8B5CF6),
          'onTap': () => context.go('/attendance'),
        },
      ]);
    }

    return actions;
  }

  // Small Quick Action Widget with Local Image (same as home page)
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

  // Helper method to determine if user should be treated as participant
  Future<bool> _isParticipant(dynamic user) async {
    // Check if user is currently in participant mode via switch account
    final isInParticipantMode = await SwitchAccountService.isInParticipantMode();
    if (isInParticipantMode) {
      return true;
    }
    
    // Original logic for non-switched users
    if (user.role == 'PARTICIPANT') {
      return true;
    }
    if (user.role == 'ORGANIZER') {
      // Only approved organizers get organizer dashboard
      return user.verificationStatus != 'APPROVED';
    }
    return true; // Default to participant for other roles
  }
}
