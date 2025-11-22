import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'map_picker.dart';

class LocationPicker extends StatefulWidget {
  final String? initialLocation;
  final double? initialLatitude;
  final double? initialLongitude;
  final Function(Map<String, dynamic>) onLocationSelected;
  final String placeholder;

  const LocationPicker({
    super.key,
    this.initialLocation,
    this.initialLatitude,
    this.initialLongitude,
    required this.onLocationSelected,
    this.placeholder = 'Search location...',
  });

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  bool _isLoadingLocation = false;
  String? _currentLocation;

  @override
  void initState() {
    super.initState();
    if (widget.initialLocation != null) {
      _searchController.text = widget.initialLocation!;
      _currentLocation = widget.initialLocation;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchLocation(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    try {
      final locations = await locationFromAddress(query);
      final results = <Map<String, dynamic>>[];

      for (final location in locations.take(5)) {
        try {
          final placemarks = await placemarkFromCoordinates(
            location.latitude,
            location.longitude,
          );

          if (placemarks.isNotEmpty) {
            final placemark = placemarks.first;
            results.add({
              'latitude': location.latitude,
              'longitude': location.longitude,
              'address': _buildAddress(placemark),
              'city': placemark.locality ?? '',
              'province': placemark.administrativeArea ?? '',
              'country': placemark.country ?? '',
              'postalCode': placemark.postalCode ?? '',
            });
          }
        } catch (e) {
          // Skip invalid locations
          continue;
        }
      }

      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
    }
  }

  String _buildAddress(Placemark placemark) {
    final parts = <String>[];
    
    if (placemark.street != null && placemark.street!.isNotEmpty) {
      parts.add(placemark.street!);
    }
    if (placemark.locality != null && placemark.locality!.isNotEmpty) {
      parts.add(placemark.locality!);
    }
    if (placemark.administrativeArea != null && placemark.administrativeArea!.isNotEmpty) {
      parts.add(placemark.administrativeArea!);
    }
    if (placemark.country != null && placemark.country!.isNotEmpty) {
      parts.add(placemark.country!);
    }

    return parts.join(', ');
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showErrorSnackBar('Location services are disabled. Please enable location services.');
        return;
      }

      // Check permissions with better error handling
      LocationPermission permission;
      try {
        permission = await Geolocator.checkPermission();
      } catch (e) {
        _showErrorSnackBar('Unable to check location permission. Please check your device settings.');
        return;
      }

      if (permission == LocationPermission.denied) {
        try {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) {
            _showErrorSnackBar('Location permission denied');
            return;
          }
        } catch (e) {
          _showErrorSnackBar('Unable to request location permission. Please check your device settings.');
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _showErrorSnackBar('Location permission permanently denied. Please enable it in device settings.');
        return;
      }

      // Get current position with timeout
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 10),
      );

      // Get address from coordinates
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        final locationData = {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'address': _buildAddress(placemark),
          'city': placemark.locality ?? '',
          'province': placemark.administrativeArea ?? '',
          'country': placemark.country ?? '',
          'postalCode': placemark.postalCode ?? '',
        };

        setState(() {
          _searchController.text = locationData['address'] as String;
          _currentLocation = locationData['address'] as String?;
        });

        widget.onLocationSelected(locationData);
      }
    } catch (e) {
      // More specific error handling
      String errorMessage = 'Failed to get current location';
      if (e.toString().contains('MissingPluginException')) {
        errorMessage = 'Location services not available. Please check if the app has location permissions.';
      } else if (e.toString().contains('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      } else {
        errorMessage = 'Failed to get current location: ${e.toString()}';
      }
      _showErrorSnackBar(errorMessage);
    } finally {
      setState(() {
        _isLoadingLocation = false;
      });
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _selectLocation(Map<String, dynamic> location) {
    setState(() {
      _searchController.text = location['address'];
      _currentLocation = location['address'];
      _searchResults = [];
    });

    widget.onLocationSelected(location);
  }

  void _openMapPicker() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => MapPicker(
          initialLatitude: widget.initialLatitude,
          initialLongitude: widget.initialLongitude,
          onLocationSelected: (locationData) {
            setState(() {
              _searchController.text = locationData['address'];
              _currentLocation = locationData['address'];
              _searchResults = [];
            });
            widget.onLocationSelected(locationData);
          },
          title: 'Select Event Location',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search Field
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: widget.placeholder,
            hintStyle: TextStyle(color: Colors.grey[500]),
            prefixIcon: Icon(Icons.search, color: Colors.grey[600]),
            filled: true,
            fillColor: Colors.white,
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(Icons.map, color: Colors.grey[600]),
                  onPressed: _openMapPicker,
                  tooltip: 'Pick from map',
                ),
                if (_isLoadingLocation)
                  const Padding(
                    padding: EdgeInsets.all(12.0),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                else
                  IconButton(
                    icon: Icon(Icons.my_location, color: Colors.grey[600]),
                    onPressed: _getCurrentLocation,
                    tooltip: 'Use current location',
                  ),
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    icon: Icon(Icons.clear, color: Colors.grey[600]),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchResults = [];
                        _currentLocation = null;
                      });
                    },
                  ),
              ],
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: const Color(0xFF2563EB), width: 2),
            ),
          ),
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 16,
          ),
          onChanged: (value) {
            if (value.trim().isNotEmpty) {
              _searchLocation(value);
            } else {
              setState(() {
                _searchResults = [];
                _isSearching = false;
              });
            }
          },
        ),

        const SizedBox(height: 8),

        // Search Results
        if (_isSearching)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 12),
                Text('Searching locations...'),
              ],
            ),
          )
        else if (_searchResults.isNotEmpty)
          Container(
            constraints: const BoxConstraints(maxHeight: 200),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _searchResults.length,
              itemBuilder: (context, index) {
                final location = _searchResults[index];
                return ListTile(
                  leading: const Icon(Icons.location_on, color: const Color(0xFF2563EB)),
                  title: Text(
                    location['address'],
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  subtitle: Text(
                    '${location['city']}, ${location['province']}',
                    style: const TextStyle(color: Color(0xFF64748B)),
                  ),
                  onTap: () => _selectLocation(location),
                );
              },
            ),
          ),

        // Current Location Display
        if (_currentLocation != null)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: const Color(0xFF2563EB), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Selected: $_currentLocation',
                    style: const TextStyle(
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
