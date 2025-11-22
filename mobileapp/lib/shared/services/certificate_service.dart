import 'package:nusa/core/network/api_client.dart';
import 'package:nusa/core/constants/api_constants.dart';

class CertificateService {
  final ApiClient _apiClient = ApiClient();

  /// Generate certificate for a registration
  Future<Map<String, dynamic>> generateCertificate(String registrationId) async {
    try {
      final response = await _apiClient.post(
        '${ApiConstants.certificates}/generate/$registrationId',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'],
            'message': data['message'] ?? 'Certificate generated successfully',
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to generate certificate',
      };
    } catch (e) {
      print('Generate certificate error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  /// Get user certificates
  Future<Map<String, dynamic>> getUserCertificates({
    int page = 1,
    int limit = 10,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiClient.get(
        '${ApiConstants.certificates}/my',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'],
            'message': data['message'] ?? 'Certificates loaded successfully',
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to load certificates',
      };
    } catch (e) {
      print('Get user certificates error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  /// Get certificate URL for viewing/downloading
  String getCertificateUrl(String? certificateUrl) {
    if (certificateUrl == null || certificateUrl.isEmpty) {
      return '';
    }
    
    // If it's already a full URL, return as is
    if (certificateUrl.startsWith('http')) {
      return certificateUrl;
    }
    
    // If it's a relative path, construct full URL
    return '${ApiConstants.fileBaseUrl}$certificateUrl';
  }

  /// Download certificate
  Future<Map<String, dynamic>> downloadCertificate(String certificateUrl) async {
    try {
      // For mobile, we'll return the URL for the user to download
      return {
        'success': true,
        'data': {
          'certificateUrl': certificateUrl,
        },
        'message': 'Certificate ready for download',
      };
    } catch (e) {
      print('Download certificate error: $e');
      return {
        'success': false,
        'message': 'Failed to download certificate',
      };
    }
  }
}