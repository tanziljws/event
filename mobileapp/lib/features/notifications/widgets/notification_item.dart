import 'package:flutter/material.dart';
import '../../../shared/models/notification_model.dart';

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback? onTap;

  const NotificationItem({
    super.key,
    required this.notification,
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
                // Notification Icon
                Icon(
                  _getIcon(),
                  color: _getIconColor(),
                  size: 24,
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
                      
                      // Additional Data (if available)
                      if (notification.data != null) ...[
                        const SizedBox(height: 8),
                        _buildAdditionalInfo(),
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
                    decoration: const BoxDecoration(
                      color: Color(0xFF059669),
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

  Widget _buildAdditionalInfo() {
    final data = notification.data!;
    
    // Event-related notifications
    if (notification.isEventReminderH1 || 
        notification.isEventReminderH0 || 
        notification.isRegistrationConfirmed ||
        notification.isEventCancelled ||
        notification.isEventUpdated ||
        notification.isNewRegistration) {
      return Row(
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
      );
    }
    
    // Payment-related notifications
    if (notification.isPaymentSuccess || notification.isPaymentFailed) {
      return Row(
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
      );
    }
    
    // Certificate notifications
    if (notification.isCertificateReady) {
      return Row(
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
      );
    }

    // New registration notifications (for organizers)
    if (notification.isNewRegistration) {
      return Row(
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
            style: TextStyle(
              fontSize: 12,
              color: const Color(0xFF2563EB),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      );
    }
    
    return const SizedBox.shrink();
  }

  IconData _getIcon() {
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
      case 'UPGRADE_APPROVED':
        return Icons.upgrade;
      case 'UPGRADE_REJECTED':
        return Icons.block;
      case 'NEW_REGISTRATION':
        return Icons.person_add;
      case 'GENERAL':
      default:
        return Icons.notifications;
    }
  }

  Color _getIconColor() {
    switch (notification.type) {
      case 'EVENT_REMINDER_H1':
      case 'EVENT_REMINDER_H0':
        return const Color(0xFFF59E0B); // Orange
      case 'REGISTRATION_CONFIRMED':
      case 'PAYMENT_SUCCESS':
      case 'CERTIFICATE_READY':
      case 'UPGRADE_APPROVED':
        return const Color(0xFF10B981); // Green
      case 'PAYMENT_FAILED':
      case 'EVENT_CANCELLED':
      case 'UPGRADE_REJECTED':
        return const Color(0xFFEF4444); // Red
      case 'EVENT_UPDATED':
      case 'NEW_REGISTRATION':
        return const Color(0xFF2563EB); // Blue
      case 'GENERAL':
      default:
        return const Color(0xFF6B7280); // Gray
    }
  }
}
