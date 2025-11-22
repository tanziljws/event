import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/constants/api_constants.dart';
import '../../../core/services/secure_storage_service.dart';
import '../../../shared/models/ticket_type_model.dart';

class TicketTypeService {
  // Get auth headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await SecureStorageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Create ticket type for event
  Future<TicketType> createTicketType(String eventId, TicketType ticketType) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/events/$eventId/ticket-types');

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(ticketType.toJson()),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return TicketType.fromJson(data['data']['ticketType']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to create ticket type');
      }
    } catch (e) {
      throw Exception('Failed to create ticket type: $e');
    }
  }

  // Bulk create ticket types
  Future<List<TicketType>> bulkCreateTicketTypes(String eventId, List<TicketType> ticketTypes) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/events/$eventId/ticket-types/bulk');

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'ticketTypes': ticketTypes.map((t) => t.toJson()).toList(),
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return (data['data']['ticketTypes'] as List)
            .map((t) => TicketType.fromJson(t))
            .toList();
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to create ticket types');
      }
    } catch (e) {
      throw Exception('Failed to create ticket types: $e');
    }
  }

  // Get ticket types for event
  Future<List<TicketType>> getEventTicketTypes(String eventId, {bool includeInactive = false}) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse(
        '${ApiConstants.baseUrl}/events/$eventId/ticket-types?includeInactive=$includeInactive'
      );

      print('🔍 Fetching ticket types from: $url');
      final response = await http.get(url, headers: headers);
      print('📥 Ticket types response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Ticket types data: ${data['data']['ticketTypes'].length} types');
        return (data['data']['ticketTypes'] as List)
            .map((t) => TicketType.fromJson(t))
            .toList();
      } else {
        print('❌ Error response: ${response.body}');
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to fetch ticket types');
      }
    } catch (e) {
      print('❌ Exception fetching ticket types: $e');
      throw Exception('Failed to fetch ticket types: $e');
    }
  }

  // Update ticket type
  Future<TicketType> updateTicketType(String ticketTypeId, TicketType ticketType) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/ticket-types/$ticketTypeId');

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(ticketType.toJson()),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TicketType.fromJson(data['data']['ticketType']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to update ticket type');
      }
    } catch (e) {
      throw Exception('Failed to update ticket type: $e');
    }
  }

  // Delete ticket type
  Future<void> deleteTicketType(String ticketTypeId) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/ticket-types/$ticketTypeId');

      final response = await http.delete(url, headers: headers);

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to delete ticket type');
      }
    } catch (e) {
      throw Exception('Failed to delete ticket type: $e');
    }
  }

  // Check ticket availability
  Future<Map<String, dynamic>> checkTicketAvailability(String ticketTypeId, int quantity) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse(
        '${ApiConstants.baseUrl}/ticket-types/$ticketTypeId/availability?quantity=$quantity'
      );

      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to check availability');
      }
    } catch (e) {
      throw Exception('Failed to check availability: $e');
    }
  }

  // Get ticket type statistics
  Future<Map<String, dynamic>> getTicketTypeStats(String eventId) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/events/$eventId/ticket-types/stats');

      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to fetch stats');
      }
    } catch (e) {
      throw Exception('Failed to fetch stats: $e');
    }
  }

  // Reorder ticket types
  Future<void> reorderTicketTypes(String eventId, List<String> ticketTypeIds) async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${ApiConstants.baseUrl}/events/$eventId/ticket-types/reorder');

      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode({'ticketTypeIds': ticketTypeIds}),
      );

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to reorder ticket types');
      }
    } catch (e) {
      throw Exception('Failed to reorder ticket types: $e');
    }
  }
}
