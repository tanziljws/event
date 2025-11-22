import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../utils/logger.dart';
import '../network/api_client.dart';
import '../../shared/models/event_model.dart';

class LocationDiscoveryService {
  static final LocationDiscoveryService _instance = LocationDiscoveryService._internal();
  factory LocationDiscoveryService() => _instance;
  LocationDiscoveryService._internal();

  final ApiClient _apiClient = ApiClient();
  Position? _currentPosition;
  String? _currentAddress;

  Position? get currentPosition => _currentPosition;
  String? get currentAddress => _currentAddress;

  /// Get current location
  Future<Position?> getCurrentLocation() async {
    try {
      AppLogger.info('Getting current location', 'LocationDiscoveryService');
      
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        AppLogger.warning('Location services are disabled', 'LocationDiscoveryService');
        return null;
      }

      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          AppLogger.warning('Location permissions are denied', 'LocationDiscoveryService');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        AppLogger.warning('Location permissions are permanently denied', 'LocationDiscoveryService');
        return null;
      }

      // Get current position
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // Get address from coordinates
      await _getAddressFromPosition(_currentPosition!);

      AppLogger.info('Current location: ${_currentPosition!.latitude}, ${_currentPosition!.longitude}', 'LocationDiscoveryService');
      return _currentPosition;
    } catch (e) {
      AppLogger.error('Failed to get current location: $e', 'LocationDiscoveryService');
      return null;
    }
  }

  /// Get address from position
  Future<String?> _getAddressFromPosition(Position position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _currentAddress = '${place.locality}, ${place.administrativeArea}';
        AppLogger.info('Current address: $_currentAddress', 'LocationDiscoveryService');
        return _currentAddress;
      }
    } catch (e) {
      AppLogger.error('Failed to get address from position: $e', 'LocationDiscoveryService');
    }
    return null;
  }

  /// Calculate distance between two points in kilometers
  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // Earth's radius in kilometers
    
    double dLat = _degreesToRadians(lat2 - lat1);
    double dLon = _degreesToRadians(lon2 - lon1);
    
    double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) * cos(_degreesToRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }

  /// Get events near current location
  Future<List<EventModel>> getEventsNearMe({
    double radiusKm = 50.0, // Increased default radius to 50km
    int limit = 20,
    int page = 1,
  }) async {
    try {
      if (_currentPosition == null) {
        await getCurrentLocation();
        if (_currentPosition == null) {
          AppLogger.warning('No current location available, using Jakarta default', 'LocationDiscoveryService');
          // Fallback to Jakarta center if location not available
          _currentPosition = Position(
            latitude: -6.2088,
            longitude: 106.8456,
            timestamp: DateTime.now(),
            accuracy: 0,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            headingAccuracy: 0,
            speed: 0,
            speedAccuracy: 0,
          );
        }
      }

      AppLogger.info('Getting events near me within ${radiusKm}km', 'LocationDiscoveryService');

      final response = await _apiClient.get('/events', queryParameters: {
        'page': page,
        'limit': limit,
        'latitude': _currentPosition!.latitude,
        'longitude': _currentPosition!.longitude,
        'radius': radiusKm,
        'isPublished': true,
        'sortBy': 'distance',
        'sortOrder': 'asc',
      });

      if (response.data['success'] == true) {
        final eventsData = response.data['data']['events'] as List<dynamic>;
        final events = eventsData
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Calculate distances for each event
        for (var event in events) {
          if (event.latitude != null && event.longitude != null) {
            event.distance = calculateDistance(
              _currentPosition!.latitude,
              _currentPosition!.longitude,
              event.latitude!,
              event.longitude!,
            );
          }
        }

        AppLogger.info('Found ${events.length} events near me', 'LocationDiscoveryService');
        return events;
      } else {
        AppLogger.error('Failed to get events near me: ${response.data['message']}', 'LocationDiscoveryService');
        return [];
      }
    } catch (e) {
      AppLogger.error('Failed to get events near me: $e', 'LocationDiscoveryService');
      return [];
    }
  }

  /// Get events by location search
  Future<List<EventModel>> searchEventsByLocation({
    required String location,
    double radiusKm = 10.0,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      AppLogger.info('Searching events by location: $location', 'LocationDiscoveryService');

      // Get coordinates from location string
      List<Location> locations = await locationFromAddress(location);
      if (locations.isEmpty) {
        AppLogger.warning('Location not found: $location', 'LocationDiscoveryService');
        return [];
      }

      Location targetLocation = locations[0];

      final response = await _apiClient.get('/events', queryParameters: {
        'page': page,
        'limit': limit,
        'latitude': targetLocation.latitude,
        'longitude': targetLocation.longitude,
        'radius': radiusKm,
        'isPublished': true,
        'sortBy': 'distance',
        'sortOrder': 'asc',
      });

      if (response.data['success'] == true) {
        final eventsData = response.data['data']['events'] as List<dynamic>;
        final events = eventsData
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Calculate distances for each event
        for (var event in events) {
          if (event.latitude != null && event.longitude != null) {
            event.distance = calculateDistance(
              targetLocation.latitude,
              targetLocation.longitude,
              event.latitude!,
              event.longitude!,
            );
          }
        }

        AppLogger.info('Found ${events.length} events near $location', 'LocationDiscoveryService');
        return events;
      } else {
        AppLogger.error('Failed to search events by location: ${response.data['message']}', 'LocationDiscoveryService');
        return [];
      }
    } catch (e) {
      AppLogger.error('Failed to search events by location: $e', 'LocationDiscoveryService');
      return [];
    }
  }

  /// Get recommended events based on location and preferences
  Future<List<EventModel>> getRecommendedEvents({
    double radiusKm = 15.0,
    int limit = 10,
  }) async {
    try {
      if (_currentPosition == null) {
        await getCurrentLocation();
        if (_currentPosition == null) {
          AppLogger.warning('No current location available for recommendations', 'LocationDiscoveryService');
          return [];
        }
      }

      AppLogger.info('Getting recommended events', 'LocationDiscoveryService');

      final response = await _apiClient.get('/events/recommended', queryParameters: {
        'latitude': _currentPosition!.latitude,
        'longitude': _currentPosition!.longitude,
        'radius': radiusKm,
        'limit': limit,
      });

      if (response.data['success'] == true) {
        final eventsData = response.data['data']['events'] as List<dynamic>;
        final events = eventsData
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Calculate distances for each event
        for (var event in events) {
          if (event.latitude != null && event.longitude != null) {
            event.distance = calculateDistance(
              _currentPosition!.latitude,
              _currentPosition!.longitude,
              event.latitude!,
              event.longitude!,
            );
          }
        }

        AppLogger.info('Found ${events.length} recommended events', 'LocationDiscoveryService');
        return events;
      } else {
        AppLogger.error('Failed to get recommended events: ${response.data['message']}', 'LocationDiscoveryService');
        return [];
      }
    } catch (e) {
      AppLogger.error('Failed to get recommended events: $e', 'LocationDiscoveryService');
      return [];
    }
  }

  /// Get events within radius of a specific point
  Future<List<EventModel>> getEventsWithinRadius({
    required double latitude,
    required double longitude,
    required double radiusKm,
    int limit = 20,
    int page = 1,
  }) async {
    try {
      AppLogger.info('Getting events within ${radiusKm}km of $latitude, $longitude', 'LocationDiscoveryService');

      final response = await _apiClient.get('/events', queryParameters: {
        'page': page,
        'limit': limit,
        'latitude': latitude,
        'longitude': longitude,
        'radius': radiusKm,
        'isPublished': true,
        'sortBy': 'distance',
        'sortOrder': 'asc',
      });

      if (response.data['success'] == true) {
        final eventsData = response.data['data']['events'] as List<dynamic>;
        final events = eventsData
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Calculate distances for each event
        for (var event in events) {
          if (event.latitude != null && event.longitude != null) {
            event.distance = calculateDistance(
              latitude,
              longitude,
              event.latitude!,
              event.longitude!,
            );
          }
        }

        AppLogger.info('Found ${events.length} events within radius', 'LocationDiscoveryService');
        return events;
      } else {
        AppLogger.error('Failed to get events within radius: ${response.data['message']}', 'LocationDiscoveryService');
        return [];
      }
    } catch (e) {
      AppLogger.error('Failed to get events within radius: $e', 'LocationDiscoveryService');
      return [];
    }
  }

  /// Format distance for display
  String formatDistance(double distanceKm) {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).round()}m';
    } else if (distanceKm < 10) {
      return '${distanceKm.toStringAsFixed(1)}km';
    } else {
      return '${distanceKm.round()}km';
    }
  }

  /// Check if location is within radius
  bool isWithinRadius({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
    required double radiusKm,
  }) {
    double distance = calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusKm;
  }

  /// Get location permission status
  Future<LocationPermission> getLocationPermissionStatus() async {
    return await Geolocator.checkPermission();
  }

  /// Request location permission
  Future<LocationPermission> requestLocationPermission() async {
    return await Geolocator.requestPermission();
  }

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Open location settings
  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  /// Open app settings
  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }
}
