import 'package:flutter/material.dart';

class SearchFilters extends StatelessWidget {
  final String? selectedCategory;
  final String? selectedPriceRange;
  final DateTime? selectedStartDate;
  final DateTime? selectedEndDate;
  final String? selectedLocation;
  final ValueChanged<String?> onCategoryChanged;
  final ValueChanged<String?> onPriceRangeChanged;
  final ValueChanged<DateTime?> onStartDateChanged;
  final ValueChanged<DateTime?> onEndDateChanged;
  final ValueChanged<String?> onLocationChanged;
  final VoidCallback onApplyFilters;
  final VoidCallback onClearFilters;

  const SearchFilters({
    super.key,
    required this.selectedCategory,
    required this.selectedPriceRange,
    required this.selectedStartDate,
    required this.selectedEndDate,
    required this.selectedLocation,
    required this.onCategoryChanged,
    required this.onPriceRangeChanged,
    required this.onStartDateChanged,
    required this.onEndDateChanged,
    required this.onLocationChanged,
    required this.onApplyFilters,
    required this.onClearFilters,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Filter header
        Row(
          children: [
            const Text(
              'Filters',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: onClearFilters,
              child: const Text(
                'Clear All',
                style: TextStyle(
                  color: Color(0xFFEF4444),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Category filter
        _buildFilterSection(
          title: 'Category',
          child: _buildCategoryFilter(),
        ),
        
        const SizedBox(height: 16),
        
        // Price filter
        _buildFilterSection(
          title: 'Price',
          child: _buildPriceFilter(),
        ),
        
        const SizedBox(height: 16),
        
        // Date range filter
        _buildFilterSection(
          title: 'Date Range',
          child: _buildDateRangeFilter(context),
        ),
        
        const SizedBox(height: 16),
        
        // Location filter
        _buildFilterSection(
          title: 'Location',
          child: _buildLocationFilter(),
        ),
        
        const SizedBox(height: 24),
        
        // Apply button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: onApplyFilters,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Apply Filters',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterSection({
    required String title,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }

  Widget _buildCategoryFilter() {
    final categories = [
      'All',
      'TECHNOLOGY',
      'BUSINESS',
      'EDUCATION',
      'HEALTH',
      'ENTERTAINMENT',
      'SPORTS',
      'OTHER',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: categories.map((category) {
        final isSelected = selectedCategory == category || 
                          (selectedCategory == null && category == 'All');
        
        return GestureDetector(
          onTap: () {
            onCategoryChanged(category == 'All' ? null : category);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: isSelected 
                  ? const Color(0xFF2563EB).withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Text(
              category,
              style: TextStyle(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[700],
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPriceFilter() {
    final priceRanges = [
      'All',
      'free',
      'paid',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: priceRanges.map((range) {
        final isSelected = selectedPriceRange == range || 
                          (selectedPriceRange == null && range == 'All');
        
        String displayText;
        switch (range) {
          case 'free':
            displayText = 'Free';
            break;
          case 'paid':
            displayText = 'Paid';
            break;
          default:
            displayText = 'All';
        }
        
        return GestureDetector(
          onTap: () {
            onPriceRangeChanged(range == 'All' ? null : range);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: isSelected 
                  ? const Color(0xFF2563EB).withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Text(
              displayText,
              style: TextStyle(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[700],
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDateRangeFilter(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildDateButton(
            context,
            'Start Date',
            selectedStartDate,
            (date) => onStartDateChanged(date),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildDateButton(
            context,
            'End Date',
            selectedEndDate,
            (date) => onEndDateChanged(date),
          ),
        ),
      ],
    );
  }

  Widget _buildDateButton(
    BuildContext context,
    String label,
    DateTime? selectedDate,
    ValueChanged<DateTime?> onDateChanged,
  ) {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: selectedDate ?? DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (date != null) {
          onDateChanged(date);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.grey[300]!,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              selectedDate != null 
                  ? '${selectedDate.day}/${selectedDate.month}/${selectedDate.year}'
                  : 'Select date',
              style: TextStyle(
                fontSize: 14,
                color: selectedDate != null 
                    ? Colors.grey[700]
                    : Colors.grey[500],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationFilter() {
    final locations = [
      'All',
      'Jakarta',
      'Bandung',
      'Surabaya',
      'Yogyakarta',
      'Medan',
      'Online',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: locations.map((location) {
        final isSelected = selectedLocation == location || 
                          (selectedLocation == null && location == 'All');
        
        return GestureDetector(
          onTap: () {
            onLocationChanged(location == 'All' ? null : location);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: isSelected 
                  ? const Color(0xFF2563EB).withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Text(
              location,
              style: TextStyle(
                color: isSelected 
                    ? const Color(0xFF2563EB)
                    : Colors.grey[700],
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
