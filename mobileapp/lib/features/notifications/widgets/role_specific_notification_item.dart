import 'package:flutter/material.dart';
import '../../../shared/models/notification_model.dart';

class RoleSpecificNotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final String userRole;
  final VoidCallback? onTap;

  const RoleSpecificNotificationItem({
    super.key,
    required this.notification,
    required this.userRole,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Role-specific Icon
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getRoleSpecificColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    _getRoleSpecificIcon(),
                    color: _getRoleSpecificColor(),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                
                // Notification Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and Time
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: notification.isRead 
                                    ? FontWeight.w500 
                                    : FontWeight.bold,
                                color: notification.isRead 
                                    ? Colors.grey[700] 
                                    : Colors.black,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            notification.timeAgo,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      
                      // Message
                      Text(
                        notification.message,
                        style: TextStyle(
                          fontSize: 14,
                          color: notification.isRead 
                              ? Colors.grey[600] 
                              : Colors.grey[800],
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      
                      // Role-specific Additional Info
                      if (notification.data != null) ...[
                        const SizedBox(height: 8),
                        _buildRoleSpecificInfo(),
                      ],
                    ],
                  ),
                ),
                
                // Unread Indicator
                if (!notification.isRead) ...[
                  const SizedBox(width: 8),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _getRoleSpecificColor(),
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleSpecificInfo() {
    final data = notification.data!;
    
    if (userRole == 'PARTICIPANT') {
      return _buildParticipantInfo(data);
    } else if (userRole == 'ORGANIZER') {
      return _buildOrganizerInfo(data);
    }
    
    return const SizedBox.shrink();
  }

  Widget _buildParticipantInfo(Map<String, dynamic> data) {
    // Event-related notifications for participants
    if (notification.isEventReminderH1 || 
        notification.isEventReminderH0 || 
        notification.isRegistrationConfirmed ||
        notification.isEventCancelled ||
        notification.isEventUpdated) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF2563EB).withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.event,
              size: 12,
              color: const Color(0xFF2563EB),
            ),
            const SizedBox(width: 4),
            Text(
              data['eventTitle'] ?? 'Event',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF2563EB),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
    
    // Payment notifications for participants
    if (notification.isPaymentSuccess || notification.isPaymentFailed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: notification.isPaymentSuccess 
              ? Colors.green[50] 
              : Colors.red[50],
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              notification.isPaymentSuccess 
                  ? Icons.check_circle 
                  : Icons.error,
              size: 12,
              color: notification.isPaymentSuccess 
                  ? Colors.green[600] 
                  : Colors.red[600],
            ),
            const SizedBox(width: 4),
            Text(
              'Rp ${data['amount']?.toString() ?? '0'}',
              style: TextStyle(
                fontSize: 12,
                color: notification.isPaymentSuccess 
                    ? Colors.green[600] 
                    : Colors.red[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }
    
    // Certificate notifications for participants
    if (notification.isCertificateReady) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF2563EB).withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.verified,
              size: 12,
              color: const Color(0xFF2563EB),
            ),
            const SizedBox(width: 4),
            Text(
              'Sertifikat Siap',
              style: TextStyle(
                fontSize: 12,
                color: const Color(0xFF2563EB),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
    
    return const SizedBox.shrink();
  }

  Widget _buildOrganizerInfo(Map<String, dynamic> data) {
    // New registration notifications for organizers
    if (notification.isNewRegistration) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF2563EB).withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.person_add,
              size: 12,
              color: const Color(0xFF2563EB),
            ),
            const SizedBox(width: 4),
            Text(
              data['participantName'] ?? 'Peserta Baru',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF2563EB),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
    
    // Payment received notifications for organizers
    if (notification.isPaymentSuccess) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.green[50],
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.payment,
              size: 12,
              color: Colors.green[600],
            ),
            const SizedBox(width: 4),
            Text(
              'Rp ${data['amount']?.toString() ?? '0'} dari ${data['participantName'] ?? 'Peserta'}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.green[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }
    
    // Event-related notifications for organizers
    if (notification.isEventCancelled || notification.isEventUpdated) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.event,
              size: 12,
              color: Colors.grey[600],
            ),
            const SizedBox(width: 4),
            Text(
              data['eventTitle'] ?? 'Event',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
    
    return const SizedBox.shrink();
  }

  IconData _getRoleSpecificIcon() {
    if (userRole == 'PARTICIPANT') {
      switch (notification.type) {
        case 'EVENT_REMINDER_H1':
        case 'EVENT_REMINDER_H0':
          return Icons.schedule;
        case 'REGISTRATION_CONFIRMED':
          return Icons.check_circle;
        case 'PAYMENT_SUCCESS':
          return Icons.payment;
        case 'PAYMENT_FAILED':
          return Icons.error;
        case 'CERTIFICATE_READY':
          return Icons.verified;
        case 'EVENT_CANCELLED':
          return Icons.cancel;
        case 'EVENT_UPDATED':
          return Icons.update;
        default:
          return Icons.notifications;
      }
    } else if (userRole == 'ORGANIZER') {
      switch (notification.type) {
        case 'NEW_REGISTRATION':
          return Icons.person_add;
        case 'PAYMENT_SUCCESS':
          return Icons.payment;
        case 'EVENT_CANCELLED':
          return Icons.cancel;
        case 'EVENT_UPDATED':
          return Icons.update;
        case 'UPGRADE_APPROVED':
          return Icons.upgrade;
        case 'UPGRADE_REJECTED':
          return Icons.block;
        default:
          return Icons.business;
      }
    }
    
    return Icons.notifications;
  }

  Color _getRoleSpecificColor() {
    if (userRole == 'PARTICIPANT') {
      switch (notification.type) {
        case 'EVENT_REMINDER_H1':
        case 'EVENT_REMINDER_H0':
          return const Color(0xFFF59E0B); // Orange
        case 'REGISTRATION_CONFIRMED':
        case 'PAYMENT_SUCCESS':
        case 'CERTIFICATE_READY':
          return const Color(0xFF10B981); // Green
        case 'PAYMENT_FAILED':
        case 'EVENT_CANCELLED':
          return const Color(0xFFEF4444); // Red
        case 'EVENT_UPDATED':
          return const Color(0xFF2563EB); // Blue
        default:
          return const Color(0xFF6B7280); // Gray
      }
    } else if (userRole == 'ORGANIZER') {
      switch (notification.type) {
        case 'NEW_REGISTRATION':
          return const Color(0xFF2563EB); // Blue
        case 'PAYMENT_SUCCESS':
          return const Color(0xFF10B981); // Green
        case 'EVENT_CANCELLED':
          return const Color(0xFFEF4444); // Red
        case 'EVENT_UPDATED':
          return const Color(0xFF2563EB); // Blue
        case 'UPGRADE_APPROVED':
          return const Color(0xFF10B981); // Green
        case 'UPGRADE_REJECTED':
          return const Color(0xFFEF4444); // Red
        default:
          return const Color(0xFF6B7280); // Gray
      }
    }
    
    return const Color(0xFF6B7280); // Gray
  }
}

