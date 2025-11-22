import 'dart:convert';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/attendance_models.dart';

class AttendanceService {
  final ApiClient _apiClient = ApiClient();

  // Get organizer events for attendance
  Future<Map<String, dynamic>> getOrganizerEvents({
    int page = 1,
    int limit = 100,
    String? search,
    String? category,
    String? status,
    String? sortBy = 'createdAt',
    String? sortOrder = 'desc',
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.organizerEvents,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (search != null && search.isNotEmpty) 'search': search,
          if (category != null && category.isNotEmpty) 'category': category,
          if (status != null && status.isNotEmpty) 'status': status,
          'sortBy': sortBy,
          'sortOrder': sortOrder,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': {
              'events': (data['data']['events'] as List<dynamic>? ?? [])
                  .map((item) => AttendanceEvent.fromJson(item))
                  .toList(),
              'pagination': data['data']['pagination'],
            },
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get organizer events',
      };
    } catch (e) {
      print('Get organizer events error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Get attendance data for specific event
  Future<Map<String, dynamic>> getEventAttendance(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.attendance}$eventId',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': AttendanceData.fromJson(data['data']),
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to get attendance data',
      };
    } catch (e) {
      print('Get event attendance error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Check-in participant
  Future<Map<String, dynamic>> checkInParticipant(String eventId, String qrCodeData) async {
    try {
      print('🔍 CHECK-IN DEBUG START');
      print('📱 Event ID: $eventId');
      print('📱 Original QR Data: $qrCodeData');
      print('📱 QR Data Length: ${qrCodeData.length}');
      
      // Convert QR code data to proper format (same as frontend)
      String qrDataToSend = qrCodeData;
      
      // Try to parse as JSON first
      try {
        // If it's already JSON, use as is
        final parsed = jsonDecode(qrCodeData);
        qrDataToSend = qrCodeData;
        print('📱 QR code is already JSON format: $qrDataToSend');
      } catch (e) {
        // If it's plain token, convert to JSON format (same as frontend)
        qrDataToSend = jsonEncode({
          'type': 'TICKET',
          'token': qrCodeData.trim(),
        });
        print('📱 Converted plain token to JSON: $qrDataToSend');
      }
      
      print('📱 Final QR Data to Send: $qrDataToSend');
      print('📱 API Endpoint: ${ApiConstants.checkIn}');
      
      final response = await _apiClient.post(
        ApiConstants.checkIn,
        data: {
          'eventId': eventId,
          'qrCodeData': qrDataToSend,
        },
      );

      print('📱 Response Status: ${response.statusCode}');
      print('📱 Response Data: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          print('✅ Check-in successful!');
          return {
            'success': true,
            'message': data['message'] ?? 'Participant checked in successfully',
            'data': data['data'],
          };
        } else {
          print('❌ Check-in failed: ${data['message']}');
        }
      } else {
        print('❌ HTTP Error: ${response.statusCode}');
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to check in participant',
      };
    } catch (e) {
      print('❌ Check-in participant error: $e');
      print('❌ Error type: ${e.runtimeType}');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Detect event from token
  Future<Map<String, dynamic>> detectEventFromToken(String token) async {
    try {
      final response = await _apiClient.post(
        '/events/organizer/detect-event',
        data: {
          'token': token,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': DetectedEventData.fromJson(data['data']),
            'message': data['message'] ?? 'Event detected successfully',
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to detect event from token',
      };
    } catch (e) {
      print('Detect event from token error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }
}