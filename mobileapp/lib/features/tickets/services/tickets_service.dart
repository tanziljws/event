import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../models/ticket.dart';

class TicketsService {
  static final TicketsService _instance = TicketsService._internal();
  factory TicketsService() => _instance;
  TicketsService._internal();

  final ApiClient _apiClient = ApiClient();

  /// Get user's tickets with pagination and filtering
  Future<Map<String, dynamic>> getMyTickets({
    int page = 1,
    int limit = 10,
    String? status,
    String? search,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      // Use /tickets endpoint (standard endpoint for user tickets)
      final uri = Uri.parse('${ApiConstants.baseUrl}${ApiConstants.myTickets}')
          .replace(queryParameters: queryParams);

      final response = await _apiClient.dio.get(uri.toString());

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          final tickets = (data['data']['registrations'] as List)
              .map((json) => Ticket.fromJson(json))
              .toList();

          return {
            'success': true,
            'data': {
              'tickets': tickets,
              'pagination': data['data']['pagination'],
            },
          };
        } else {
          return {
            'success': false,
            'message': data['message'] ?? 'Failed to load tickets',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Failed to load tickets: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error loading tickets: ${e.toString()}',
      };
    }
  }

  /// Get ticket by registration ID
  Future<Map<String, dynamic>> getTicketByRegistration(String registrationId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiConstants.baseUrl}/tickets/registration/$registrationId',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': Ticket.fromJson(data['data']),
          };
        } else {
          return {
            'success': false,
            'message': data['message'] ?? 'Failed to load ticket',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Failed to load ticket: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error loading ticket: ${e.toString()}',
      };
    }
  }

  /// Get ticket download URL
  Future<Map<String, dynamic>> getTicketDownloadUrl(String registrationId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiConstants.baseUrl}/payments/ticket/registration/$registrationId',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': {
              'downloadUrl': data['data']['downloadUrl'],
              'ticketUrl': data['data']['ticketUrl'],
            },
          };
        } else {
          return {
            'success': false,
            'message': data['message'] ?? 'Failed to get download URL',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Failed to get download URL: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error getting download URL: ${e.toString()}',
      };
    }
  }

  /// Download ticket as PDF
  Future<Map<String, dynamic>> downloadTicket(String registrationId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiConstants.baseUrl}/payments/ticket/registration/$registrationId/download',
        options: Options(
          headers: {'Accept': 'application/pdf'},
        ),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.data,
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to download ticket',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error downloading ticket: ${e.toString()}',
      };
    }
  }

  /// Get QR code for ticket
  Future<Map<String, dynamic>> getTicketQRCode(String ticketNumber) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiConstants.baseUrl}/tickets/qr/$ticketNumber',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': {
              'qrCodeUrl': data['data']['qrCodeUrl'],
              'qrCodeData': data['data']['qrCodeData'],
            },
          };
        } else {
          return {
            'success': false,
            'message': data['message'] ?? 'Failed to get QR code',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Failed to get QR code: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error getting QR code: ${e.toString()}',
      };
    }
  }

}