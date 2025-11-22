import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import '../../../core/services/location_discovery_service.dart';
import '../../../core/utils/logger.dart';

class LocationSearchBar extends StatefulWidget {
  final Function(String) onSearchChanged;
  final Function(String) onLocationSearch;

  const LocationSearchBar({
    super.key,
    required this.onSearchChanged,
    required this.onLocationSearch,
  });

  @override
  State<LocationSearchBar> createState() => _LocationSearchBarState();
}

class _LocationSearchBarState extends State<LocationSearchBar> {
  final TextEditingController _controller = TextEditingController();
  final LocationDiscoveryService _locationService = LocationDiscoveryService();
  
  List<String> _recentSearches = [];
  List<String> _suggestions = [];
  bool _showSuggestions = false;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _loadRecentSearches() {
    // Load recent searches from storage
    // For now, using mock data
    _recentSearches = [
      'Jakarta',
      'Bandung',
      'Surabaya',
      'Yogyakarta',
    ];
  }

  void _onSearchChanged(String query) {
    widget.onSearchChanged(query);
    
    if (query.isEmpty) {
      setState(() {
        _showSuggestions = false;
        _suggestions = [];
      });
      return;
    }

    _getSuggestions(query);
  }

  void _getSuggestions(String query) async {
    setState(() {
      _isSearching = true;
    });

    try {
      // Get location suggestions from geocoding
      List<Location> locations = await locationFromAddress(query);
      
      List<String> newSuggestions = [];
      for (Location location in locations.take(5)) {
        try {
          List<Placemark> placemarks = await placemarkFromCoordinates(
            location.latitude,
            location.longitude,
          );
          
          if (placemarks.isNotEmpty) {
            Placemark place = placemarks[0];
            String suggestion = '${place.locality}, ${place.administrativeArea}';
            if (!newSuggestions.contains(suggestion)) {
              newSuggestions.add(suggestion);
            }
          }
        } catch (e) {
          AppLogger.error('Failed to get placemark: $e', 'LocationSearchBar');
        }
      }

      // Add recent searches that match
      for (String search in _recentSearches) {
        if (search.toLowerCase().contains(query.toLowerCase()) && 
            !newSuggestions.contains(search)) {
          newSuggestions.add(search);
        }
      }

      setState(() {
        _suggestions = newSuggestions;
        _showSuggestions = true;
        _isSearching = false;
      });
    } catch (e) {
      AppLogger.error('Failed to get suggestions: $e', 'LocationSearchBar');
      setState(() {
        _isSearching = false;
      });
    }
  }

  void _onSuggestionTap(String suggestion) {
    _controller.text = suggestion;
    _saveRecentSearch(suggestion);
    widget.onLocationSearch(suggestion);
    
    setState(() {
      _showSuggestions = false;
    });
  }

  void _saveRecentSearch(String search) {
    if (!_recentSearches.contains(search)) {
      _recentSearches.insert(0, search);
      if (_recentSearches.length > 10) {
        _recentSearches = _recentSearches.take(10).toList();
      }
    }
  }

  void _clearSearch() {
    _controller.clear();
    widget.onSearchChanged('');
    setState(() {
      _showSuggestions = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search bar
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _controller,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search location or event...',
              hintStyle: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
              prefixIcon: Icon(
                Icons.search,
                color: Colors.grey[500],
                size: 20,
              ),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      onPressed: _clearSearch,
                      icon: Icon(
                        Icons.clear,
                        color: Colors.grey[500],
                        size: 20,
                      ),
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            style: const TextStyle(fontSize: 14),
          ),
        ),
        
        // Suggestions dropdown
        if (_showSuggestions && _suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Recent searches header
                if (_recentSearches.any((search) => 
                    search.toLowerCase().contains(_controller.text.toLowerCase())))
                  Container(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(
                          Icons.history,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Recent Searches',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // Suggestions list
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _suggestions.length,
                  itemBuilder: (context, index) {
                    final suggestion = _suggestions[index];
                    final isRecent = _recentSearches.contains(suggestion);
                    
                    return ListTile(
                      dense: true,
                      leading: Icon(
                        isRecent ? Icons.history : Icons.location_on,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      title: Text(
                        suggestion,
                        style: const TextStyle(fontSize: 14),
                      ),
                      onTap: () => _onSuggestionTap(suggestion),
                    );
                  },
                ),
                
                // Loading indicator
                if (_isSearching)
                  const Padding(
                    padding: EdgeInsets.all(12),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Searching...',
                          style: TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
