import 'package:dio/dio.dart';
import '../models/registration_model.dart';
import '../models/event_model.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';

class RegistrationService {
  static final ApiClient _apiClient = ApiClient();

  /// Register for an event
  static Future<Map<String, dynamic>> registerForEvent(String eventId, {String? privatePassword}) async {
    try {
      print('🔵 Registering for event: $eventId');
      
      final response = await _apiClient.dio.post(
        '/events/$eventId/register',
        data: privatePassword != null ? {'privatePassword': privatePassword} : {}, // Include privatePassword if provided
      );

      print('✅ Registration successful: ${response.data}');
      
      if (response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Registration successful',
          'registration': response.data['data']['registration'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Registration failed',
        };
      }
    } on DioException catch (e) {
      print('❌ Registration error: ${e.response?.data}');
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Registration failed',
      };
    } catch (e) {
      print('❌ Registration error: $e');
      return {
        'success': false,
        'message': 'Registration failed: $e',
      };
    }
  }

  /// Cancel event registration
  static Future<Map<String, dynamic>> cancelRegistration(String eventId) async {
    try {
      print('🔵 Canceling registration for event: $eventId');
      
      final response = await _apiClient.dio.delete(
        '/events/$eventId/cancel-registration',
      );

      print('✅ Registration canceled: ${response.data}');
      
      if (response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Registration canceled',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to cancel registration',
        };
      }
    } on DioException catch (e) {
      print('❌ Cancel registration error: ${e.response?.data}');
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to cancel registration',
      };
    } catch (e) {
      print('❌ Cancel registration error: $e');
      return {
        'success': false,
        'message': 'Failed to cancel registration: $e',
      };
    }
  }

  /// Check if user is registered for an event
  static Future<bool> isRegisteredForEvent(String eventId) async {
    try {
      print('🔵 Checking registration status for event: $eventId');
      
      final response = await _apiClient.dio.get(ApiConstants.myRegistrations);
      
      if (response.data['success'] == true) {
        final registrations = response.data['data']['registrations'] as List<dynamic>? ?? [];
        
        for (final reg in registrations) {
          if (reg['eventId'] == eventId) {
            print('✅ User is registered for event: $eventId');
            return true;
          }
        }
        
        print('ℹ️ User is not registered for event: $eventId');
        return false;
      }
      
      return false;
    } catch (e) {
      print('❌ Error checking registration status: $e');
      return false;
    }
  }

  /// Get user's registration for a specific event
  static Future<RegistrationModel?> getUserRegistrationForEvent(String eventId) async {
    try {
      print('🔵 Getting user registration for event: $eventId');
      
      final response = await _apiClient.dio.get(ApiConstants.myRegistrations);
      
      if (response.data['success'] == true) {
        final registrations = response.data['data']['registrations'] as List<dynamic>? ?? [];
        
        for (final reg in registrations) {
          if (reg['eventId'] == eventId) {
            print('✅ Found user registration for event: $eventId');
            return RegistrationModel.fromJson(reg as Map<String, dynamic>);
          }
        }
        
        print('ℹ️ No registration found for event: $eventId');
        return null;
      }
      
      return null;
    } catch (e) {
      print('❌ Error getting user registration: $e');
      return null;
    }
  }

  /// Validate if event can be registered
  static bool canRegisterForEvent(EventModel event) {
    final now = DateTime.now();
    final eventDate = event.eventDate;
    final registrationDeadline = event.registrationDeadline;
    
    // Check if event is published
    if (!event.isPublished) {
      return false;
    }
    
    // Check if registration deadline has passed
    if (now.isAfter(registrationDeadline)) {
      return false;
    }
    
    // Check if event has started
    if (now.isAfter(eventDate)) {
      return false;
    }
    
    // Check if event is full
    if (event.registrationCount != null &&
        event.registrationCount! >= event.maxParticipants) {
      return false;
    }
    
    return true;
  }

  /// Get registration status text
  static String getRegistrationStatusText(EventModel event) {
    final now = DateTime.now();
    final eventDate = event.eventDate;
    final registrationDeadline = event.registrationDeadline;
    
    if (!event.isPublished) {
      return 'Event Belum Dipublish';
    }
    
    if (now.isAfter(registrationDeadline)) {
      return 'Pendaftaran Ditutup';
    }
    
    if (now.isAfter(eventDate)) {
      return 'Event Dimulai';
    }
    
    if (event.registrationCount != null &&
        event.registrationCount! >= event.maxParticipants) {
      return 'Kuota Penuh';
    }
    
    return 'Daftar Sekarang';
  }

  /// Get user's registrations with pagination
  static Future<Map<String, dynamic>> getUserRegistrations({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      print('🔵 Getting user registrations: page=$page, limit=$limit');
      
      final response = await _apiClient.dio.get(
        ApiConstants.myRegistrations,
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      print('✅ User registrations loaded: ${response.data}');
      
      if (response.data['success'] == true) {
        return {
          'success': true,
          'registrations': response.data['data']['registrations'],
          'pagination': response.data['data']['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to load registrations',
        };
      }
    } on DioException catch (e) {
      print('❌ Get user registrations error: ${e.response?.data}');
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load registrations',
      };
    } catch (e) {
      print('❌ Get user registrations error: $e');
      return {
        'success': false,
        'message': 'Failed to load registrations: $e',
      };
    }
  }

  /// Download ticket for registration
  static Future<String?> downloadTicket(String registrationId) async {
    try {
      print('🔵 Downloading ticket for registration: $registrationId');
      
      final response = await _apiClient.dio.get(
        '/tickets/registration/$registrationId',
      );

      print('✅ Ticket download response: ${response.data}');
      
      if (response.data['success'] == true) {
        return response.data['data']['ticketUrl'];
      } else {
        print('❌ Ticket download failed: ${response.data['message']}');
        return null;
      }
    } on DioException catch (e) {
      print('❌ Download ticket error: ${e.response?.data}');
      return null;
    } catch (e) {
      print('❌ Download ticket error: $e');
      return null;
    }
  }
}