import 'package:flutter/material.dart';

enum NotificationFilter {
  all,
  participant,
  organizer,
  unread,
}

class NotificationFilterChips extends StatelessWidget {
  final NotificationFilter selectedFilter;
  final Function(NotificationFilter) onFilterChanged;
  final String userRole;

  const NotificationFilterChips({
    super.key,
    required this.selectedFilter,
    required this.onFilterChanged,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildFilterChip(
            label: 'Semua',
            filter: NotificationFilter.all,
            icon: Icons.notifications,
          ),
          const SizedBox(width: 8),
          
          // Show role-specific filters based on user role
          if (userRole == 'PARTICIPANT') ...[
            _buildFilterChip(
              label: 'Peserta',
              filter: NotificationFilter.participant,
              icon: Icons.event,
            ),
            const SizedBox(width: 8),
          ] else if (userRole == 'ORGANIZER') ...[
            _buildFilterChip(
              label: 'Organizer',
              filter: NotificationFilter.organizer,
              icon: Icons.business,
            ),
            const SizedBox(width: 8),
          ],
          
          _buildFilterChip(
            label: 'Belum Dibaca',
            filter: NotificationFilter.unread,
            icon: Icons.mark_email_unread,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required NotificationFilter filter,
    required IconData icon,
  }) {
    final isSelected = selectedFilter == filter;
    
    return GestureDetector(
      onTap: () => onFilterChanged(filter),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF2563EB) : Colors.grey[300]!,
            width: 1,
          ),
          boxShadow: isSelected ? [
            BoxShadow(
              color: const Color(0xFF2563EB).withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.grey[600],
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? Colors.white : Colors.grey[700],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

