import 'package:flutter/material.dart';

class NotificationSettings extends StatelessWidget {
  final Map<String, bool> settings;
  final Function(Map<String, bool>) onSettingsChanged;

  const NotificationSettings({
    super.key,
    required this.settings,
    required this.onSettingsChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.settings,
                  color: Colors.grey[600],
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Notification Settings',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
          
          // Settings
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildSettingItem(
                  context,
                  'Event Notifications',
                  'Get notified about new events and updates',
                  'event_notifications',
                  Icons.event,
                ),
                _buildSettingItem(
                  context,
                  'Payment Notifications',
                  'Get notified about payment confirmations',
                  'payment_notifications',
                  Icons.payment,
                ),
                _buildSettingItem(
                  context,
                  'Reminder Notifications',
                  'Get reminded about upcoming events',
                  'reminder_notifications',
                  Icons.schedule,
                ),
                _buildSettingItem(
                  context,
                  'Organizer Notifications',
                  'Get notified about organizer status updates',
                  'organizer_notifications',
                  Icons.business,
                ),
                _buildSettingItem(
                  context,
                  'System Announcements',
                  'Get notified about system updates and announcements',
                  'system_notifications',
                  Icons.announcement,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingItem(
    BuildContext context,
    String title,
    String subtitle,
    String key,
    IconData icon,
  ) {
    final isEnabled = settings[key] ?? true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          // Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              icon,
              color: Colors.blue,
              size: 20,
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          
          // Toggle
          Switch(
            value: isEnabled,
            onChanged: (value) {
              final newSettings = Map<String, bool>.from(settings);
              newSettings[key] = value;
              onSettingsChanged(newSettings);
            },
            activeThumbColor: Colors.blue,
          ),
        ],
      ),
    );
  }
}
