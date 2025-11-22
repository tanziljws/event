import 'package:flutter/material.dart';

class NotificationFilters extends StatelessWidget {
  final String? selectedFilter;
  final Function(String?) onFilterChanged;

  const NotificationFilters({
    super.key,
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    final filters = [
      {'key': null, 'label': 'All', 'icon': Icons.all_inclusive},
      {'key': 'event_registration', 'label': 'Events', 'icon': Icons.event},
      {'key': 'payment_confirmation', 'label': 'Payments', 'icon': Icons.payment},
      {'key': 'organizer_approval', 'label': 'Organizer', 'icon': Icons.business},
      {'key': 'system_announcement', 'label': 'System', 'icon': Icons.announcement},
    ];

    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = selectedFilter == filter['key'];

          return Container(
            margin: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(filter['label'] as String),
              avatar: Icon(
                filter['icon'] as IconData,
                size: 16,
                color: isSelected ? Colors.white : Colors.grey[600],
              ),
              selected: isSelected,
              onSelected: (selected) {
                onFilterChanged(selected ? filter['key'] as String? : null);
              },
              backgroundColor: Colors.white,
              selectedColor: Theme.of(context).primaryColor,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[700],
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              side: BorderSide(
                color: isSelected ? Theme.of(context).primaryColor : Colors.grey[300]!,
                width: 1,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          );
        },
      ),
    );
  }
}
