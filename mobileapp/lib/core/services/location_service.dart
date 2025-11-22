import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Position? _currentPosition;
  String? _currentLocationName;

  Position? get currentPosition => _currentPosition;
  String? get currentLocationName => _currentLocationName;

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Check location permissions
  Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }

  /// Request location permissions
  Future<LocationPermission> requestPermission() async {
    return await Geolocator.requestPermission();
  }

  /// Get current location
  Future<Position?> getCurrentLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) {
        print('Location services are disabled.');
        return null;
      }

      // Check permissions
      LocationPermission permission = await checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await requestPermission();
        if (permission == LocationPermission.denied) {
          print('Location permissions are denied');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        print('Location permissions are permanently denied');
        return null;
      }

      // Get current position
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // Get location name from coordinates
      if (_currentPosition != null) {
        await _getLocationName(_currentPosition!);
      }

      return _currentPosition;
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  /// Get location name from coordinates
  Future<void> _getLocationName(Position position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        // Format: City, Country
        String city = place.locality ?? place.administrativeArea ?? 'Unknown';
        String country = place.country ?? 'ID';
        
        _currentLocationName = '$city, $country';
      }
    } catch (e) {
      print('Error getting location name: $e');
      _currentLocationName = 'Unknown Location';
    }
  }

  /// Get location name from coordinates (public method)
  Future<String?> getLocationName(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        latitude,
        longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String city = place.locality ?? place.administrativeArea ?? 'Unknown';
        String country = place.country ?? 'ID';
        return '$city, $country';
      }
    } catch (e) {
      print('Error getting location name: $e');
    }
    return null;
  }

  /// Get formatted location string
  String getFormattedLocation() {
    if (_currentLocationName != null) {
      return _currentLocationName!;
    }
    return 'Undefined'; // Default fallback
  }

  /// Clear cached location data
  void clearLocationData() {
    _currentPosition = null;
    _currentLocationName = null;
  }
}
