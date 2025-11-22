import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../models/analytics_models.dart';

class AnalyticsFiltersWidget extends StatefulWidget {
  final AnalyticsFilters filters;
  final List<String> categories;
  final Function(AnalyticsFilters) onFiltersChanged;

  const AnalyticsFiltersWidget({
    super.key,
    required this.filters,
    required this.categories,
    required this.onFiltersChanged,
  });

  @override
  State<AnalyticsFiltersWidget> createState() => _AnalyticsFiltersWidgetState();
}

class _AnalyticsFiltersWidgetState extends State<AnalyticsFiltersWidget> {
  final TextEditingController _searchController = TextEditingController();
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.filters.searchQuery;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          // Search Bar (Home-style)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                widget.onFiltersChanged(widget.filters.copyWith(searchQuery: value));
              },
              decoration: InputDecoration(
                hintText: 'Search events, venues, or categories...',
                hintStyle: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
                prefixIcon: Container(
                  padding: const EdgeInsets.all(12),
                  child: Icon(
                    Icons.search_rounded,
                    color: Colors.grey[600],
                    size: 20,
                  ),
                ),
                suffixIcon: GestureDetector(
                  onTap: () {
                    setState(() {
                      _showFilters = !_showFilters;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    child: Icon(
                      Icons.tune_rounded,
                      color: _showFilters ? const Color(0xFF2563EB) : Colors.grey[600],
                      size: 20,
                    ),
                  ),
                ),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide(
                    color: Colors.grey[200]!,
                    width: 1,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide(
                    color: Colors.grey[200]!,
                    width: 1,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: const BorderSide(
                    color: Color(0xFF2563EB),
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
              ),
            ),
          ),
          
          // Filters Section (Collapsible)
          if (_showFilters) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Filters',
                        style: TextStyle(
                          color: AppConstants.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          widget.onFiltersChanged(const AnalyticsFilters());
                          _searchController.clear();
                        },
                        child: const Text('Clear All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Filters Row
                  Row(
                    children: [
                      // Status Filter
                      Expanded(
                        child: _buildDropdown(
                          label: 'Status',
                          value: widget.filters.statusFilter,
                          items: const [
                            {'value': 'all', 'label': 'All Status'},
                            {'value': 'DRAFT', 'label': 'Draft'},
                            {'value': 'PUBLISHED', 'label': 'Published'},
                          ],
                          onChanged: (value) {
                            widget.onFiltersChanged(widget.filters.copyWith(statusFilter: value));
                          },
                        ),
                      ),
                      
                      const SizedBox(width: 12),
                      
                      // Category Filter
                      Expanded(
                        child: _buildDropdown(
                          label: 'Category',
                          value: widget.filters.categoryFilter,
                          items: [
                            {'value': 'all', 'label': 'All Categories'},
                            ...widget.categories.map((category) => {
                              'value': category,
                              'label': category,
                            }),
                          ],
                          onChanged: (value) {
                            widget.onFiltersChanged(widget.filters.copyWith(categoryFilter: value));
                          },
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Sort Options
                  Row(
                    children: [
                      // Sort By
                      Expanded(
                        child: _buildDropdown(
                          label: 'Sort By',
                          value: widget.filters.sortBy,
                          items: const [
                            {'value': 'createdAt', 'label': 'Created Date'},
                            {'value': 'eventDate', 'label': 'Event Date'},
                            {'value': 'title', 'label': 'Title'},
                            {'value': 'registrationsCount', 'label': 'Participants'},
                          ],
                          onChanged: (value) {
                            widget.onFiltersChanged(widget.filters.copyWith(sortBy: value));
                          },
                        ),
                      ),
                      
                      const SizedBox(width: 12),
                      
                      // Sort Order
                      Expanded(
                        child: _buildDropdown(
                          label: 'Order',
                          value: widget.filters.sortOrder,
                          items: const [
                            {'value': 'desc', 'label': 'Descending'},
                            {'value': 'asc', 'label': 'Ascending'},
                          ],
                          onChanged: (value) {
                            widget.onFiltersChanged(widget.filters.copyWith(sortOrder: value));
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<Map<String, String>> items,
    required Function(String) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppConstants.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppConstants.borderLight),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              style: TextStyle(
                color: AppConstants.textPrimary,
                fontSize: 14,
              ),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['value'],
                  child: Text(item['label']!),
                );
              }).toList(),
              onChanged: (newValue) {
                if (newValue != null) {
                  onChanged(newValue);
                }
              },
            ),
          ),
        ),
      ],
    );
  }
}