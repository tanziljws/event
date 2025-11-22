import 'dart:async';
import 'package:flutter/material.dart';
import '../models/event_model.dart';
import '../services/search_service.dart';
import '../../features/events/widgets/event_card.dart';
import 'search_filters.dart';
import 'custom_trash_button.dart';

class SearchModal extends StatefulWidget {
  const SearchModal({super.key});

  @override
  State<SearchModal> createState() => _SearchModalState();
}

class _SearchModalState extends State<SearchModal> {
  final TextEditingController _searchController = TextEditingController();
  final SearchService _searchService = SearchService();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  List<EventModel> _searchResults = [];
  List<String> _suggestions = [];
  List<String> _recentSearches = [];
  List<String> _popularSearches = [];
  
  bool _isLoading = false;
  bool _isSearching = false;
  bool _showFilters = false;
  String _currentQuery = '';
  int _totalResults = 0;
  
  // Filter states
  String? _selectedCategory;
  String? _selectedPriceRange;
  DateTime? _selectedStartDate;
  DateTime? _selectedEndDate;
  String? _selectedLocation;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _searchFocusNode.requestFocus();
  }

  Future<void> _loadInitialData() async {
    final recent = await _searchService.getRecentSearches();
    final popular = await _searchService.getPopularSearches();
    
    setState(() {
      _recentSearches = recent;
      _popularSearches = popular;
    });
  }

  Future<void> _performSearch(String query, {bool saveToHistory = false}) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _totalResults = 0;
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _isLoading = true;
      _currentQuery = query;
    });

    try {
      final result = await _searchService.searchEvents(
        query: query,
        category: _selectedCategory,
        priceRange: _selectedPriceRange,
        startDate: _selectedStartDate,
        endDate: _selectedEndDate,
        location: _selectedLocation,
      );

      if (result['success'] == true) {
        setState(() {
          _searchResults = result['events'] as List<EventModel>;
          _totalResults = result['totalResults'] as int;
          _isLoading = false;
        });
        
        // Only save to recent searches if explicitly requested (manual search)
        if (saveToHistory) {
          await _searchService.saveRecentSearch(query);
        }
      } else {
        setState(() {
          _searchResults = [];
          _totalResults = 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _searchResults = [];
        _totalResults = 0;
        _isLoading = false;
      });
    }
  }

  Future<void> _onSearchChanged(String query) async {
    setState(() {
      _currentQuery = query;
    });
    
    if (query.length >= 2) {
      // Get suggestions
      final suggestions = await _searchService.getSearchSuggestions(query);
      setState(() {
        _suggestions = suggestions;
      });
      
      // Auto-search after delay (don't save to history)
      _debounceTimer?.cancel();
      _debounceTimer = Timer(const Duration(milliseconds: 500), () {
        _performSearch(query, saveToHistory: false);
      });
    } else {
      setState(() {
        _suggestions = [];
        _searchResults = [];
        _totalResults = 0;
        _isSearching = false;
      });
    }
  }

  void _applyFilters() {
    if (_currentQuery.isNotEmpty) {
      _performSearch(_currentQuery, saveToHistory: false);
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedCategory = null;
      _selectedPriceRange = null;
      _selectedStartDate = null;
      _selectedEndDate = null;
      _selectedLocation = null;
    });
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: RepaintBoundary(
        child: Column(
          children: [
            // Add top padding to push app bar down
            const SizedBox(height: 20),
            _buildSearchHeader(),
            if (_showFilters) _buildFiltersSection(),
            Expanded(
              child: RepaintBoundary(
                child: _buildSearchContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildSearchHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.arrow_back_ios_new,
                size: 20,
                color: Colors.grey[700],
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Search input
          Expanded(
            child: Container(
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
                focusNode: _searchFocusNode,
                onChanged: _onSearchChanged,
                onSubmitted: (query) => _performSearch(query, saveToHistory: true),
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
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Filter button
          GestureDetector(
            onTap: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _showFilters ? const Color(0xFF2563EB).withOpacity(0.1) : Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _showFilters ? const Color(0xFF2563EB) : Colors.grey[200]!,
                  width: 1,
                ),
              ),
              child: Icon(
                Icons.tune,
                size: 20,
                color: _showFilters ? const Color(0xFF2563EB) : Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          bottom: BorderSide(
            color: Colors.grey[200]!,
            width: 1,
          ),
        ),
      ),
      child: SearchFilters(
        selectedCategory: _selectedCategory,
        selectedPriceRange: _selectedPriceRange,
        selectedStartDate: _selectedStartDate,
        selectedEndDate: _selectedEndDate,
        selectedLocation: _selectedLocation,
        onCategoryChanged: (category) {
          setState(() {
            _selectedCategory = category;
          });
        },
        onPriceRangeChanged: (priceRange) {
          setState(() {
            _selectedPriceRange = priceRange;
          });
        },
        onStartDateChanged: (date) {
          setState(() {
            _selectedStartDate = date;
          });
        },
        onEndDateChanged: (date) {
          setState(() {
            _selectedEndDate = date;
          });
        },
        onLocationChanged: (location) {
          setState(() {
            _selectedLocation = location;
          });
        },
        onApplyFilters: _applyFilters,
        onClearFilters: _clearFilters,
      ),
    );
  }

  Widget _buildSearchContent() {
    if (_isSearching && _searchResults.isEmpty && !_isLoading) {
      return _buildEmptyState();
    }

    if (_isLoading) {
      return _buildLoadingState();
    }

    if (_searchResults.isNotEmpty) {
      return _buildSearchResults();
    }

    return _buildSuggestions();
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Searching events...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No events found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search terms or filters',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Column(
      children: [
        // Results header
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Text(
                '${_totalResults} results for "$_currentQuery"',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              const Spacer(),
              if (_showFilters)
                TextButton(
                  onPressed: _clearFilters,
                  child: const Text('Clear Filters'),
                ),
            ],
          ),
        ),
        
        // Results list
        Expanded(
          child: RepaintBoundary(
            child: Container(
              height: double.infinity,
              child: ListView.builder(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _searchResults.length,
                itemBuilder: (context, index) {
                  final event = _searchResults[index];
                  return RepaintBoundary(
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: EventCard(
                        event: event,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuggestions() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_suggestions.isNotEmpty) ...[
            _buildSuggestionsSection('Suggestions', _suggestions),
            const SizedBox(height: 24),
          ],
          
          if (_recentSearches.isNotEmpty) ...[
            _buildRecentSearchesSection(),
            const SizedBox(height: 24),
          ],
          
          if (_popularSearches.isNotEmpty) ...[
            _buildSuggestionsSection('Popular Searches', _popularSearches),
          ],
        ],
      ),
    );
  }

  Widget _buildSuggestionsSection(String title, List<String> suggestions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: suggestions.map((suggestion) {
            return GestureDetector(
              onTap: () {
                _searchController.text = suggestion;
                _performSearch(suggestion, saveToHistory: true);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.grey[300]!,
                    width: 1,
                  ),
                ),
                child: Text(
                  suggestion,
                  style: TextStyle(
                    color: Colors.grey[700],
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildRecentSearchesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Searches',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            CustomTrashButton(
              onPressed: _clearRecentSearches,
              size: 20.0,
              color: Colors.red[600],
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _recentSearches.map((suggestion) {
            return GestureDetector(
              onTap: () {
                _searchController.text = suggestion;
                _performSearch(suggestion, saveToHistory: true);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
                ),
                child: Text(
                  suggestion,
                  style: TextStyle(
                    color: const Color(0xFF2563EB),
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Future<void> _clearRecentSearches() async {
    await _searchService.clearRecentSearches();
    setState(() {
      _recentSearches.clear();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }
}
