import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';

/// Service for handling user upgrade to organizer functionality
class UpgradeService {
  static final Dio _dio = ApiClient().dio;

  /// Upgrade user from participant to organizer
  /// 
  /// [organizerType] - Type of organizer (INDIVIDUAL, COMMUNITY, SMALL_BUSINESS, INSTITUTION)
  /// [profileData] - Additional profile data based on organizer type
  /// 
  /// Returns upgrade response with success status and user data
  static Future<Map<String, dynamic>> upgradeToBusiness({
    required String organizerType,
    required Map<String, dynamic> profileData,
  }) async {
    try {
      print('🚀 UPGRADE: Starting upgrade to $organizerType');
      
      final response = await _dio.post(
        '/upgrade/business',
        data: {
          'organizerType': organizerType,
          ...profileData,
        },
      );

      print('📥 UPGRADE Response: ${response.data}');

      // Check if backend returned success
      if (response.data['success'] == true) {
        print('✅ UPGRADE: Upgrade successful');
        return {
          'success': true,
          'message': response.data['message'] ?? 'Upgrade successful',
          'data': response.data['data'],
        };
      } else {
        print('❌ UPGRADE: Backend returned error');
        return {
          'success': false,
          'message': response.data['message'] ?? 'Upgrade failed',
          'errors': response.data['errors'],
        };
      }
    } on DioException catch (e) {
      print('❌ UPGRADE: Upgrade failed');
      print('📤 UPGRADE Error: ${e.response?.data}');
      
      String errorMessage = 'Failed to upgrade account';
      
      if (e.response?.statusCode == 400) {
        errorMessage = e.response?.data['message'] ?? 'Invalid upgrade data';
      } else if (e.response?.statusCode == 401) {
        errorMessage = 'Authentication required';
      } else if (e.response?.statusCode == 403) {
        errorMessage = 'You are not eligible for upgrade';
      } else if (e.response?.statusCode == 409) {
        errorMessage = 'You are already an organizer';
      } else if (e.response?.statusCode == 500) {
        errorMessage = 'Server error. Please try again later';
      }

      return {
        'success': false,
        'message': errorMessage,
        'error': e.response?.data,
      };
    } catch (e) {
      print('❌ UPGRADE: Unexpected error: $e');
      return {
        'success': false,
        'message': 'An unexpected error occurred. Please try again.',
        'error': e.toString(),
      };
    }
  }

  /// Get current upgrade status for the user
  /// 
  /// Returns upgrade status including eligibility and current role
  static Future<Map<String, dynamic>> getUpgradeStatus() async {
    try {
      print('🔍 UPGRADE: Checking upgrade status');
      
      final response = await _dio.get('/upgrade/status');

      print('✅ UPGRADE: Status check successful');
      print('📥 UPGRADE Status: ${response.data}');

      final responseData = response.data;
      final data = responseData?['data'];
      
      return {
        'success': true,
        'data': data,
        'canUpgrade': data?['canUpgrade'] ?? false,
        'isUpgraded': data?['isUpgraded'] ?? false,
        'isVerified': data?['isVerified'] ?? false,
      };
    } on DioException catch (e) {
      print('❌ UPGRADE: Status check failed');
      print('📤 UPGRADE Status Error: ${e.response?.data}');
      
      String errorMessage = 'Failed to check upgrade status';
      
      if (e.response?.statusCode == 401) {
        errorMessage = 'Authentication required';
      } else if (e.response?.statusCode == 404) {
        // User might not have upgrade status yet, or they're already an organizer
        // Try to get user info from auth endpoint
        try {
          final userResponse = await _dio.get('/auth/me');
          if (userResponse.statusCode == 200) {
            final userData = userResponse.data['data'];
            return {
              'success': true,
              'data': userData,
              'canUpgrade': userData['role'] == 'PARTICIPANT' || 
                          (userData['role'] == 'ORGANIZER' && userData['verificationStatus'] == 'REJECTED'),
              'isUpgraded': userData['role'] == 'ORGANIZER',
              'isVerified': userData['verificationStatus'] == 'APPROVED',
            };
          }
        } catch (userError) {
          print('❌ UPGRADE: Error getting user info: $userError');
        }
        
        // Fallback: assume can upgrade if no status found
        return {
          'success': true,
          'data': null,
          'canUpgrade': true,
          'isUpgraded': false,
          'isVerified': false,
        };
      }

      return {
        'success': false,
        'message': errorMessage,
        'error': e.response?.data,
      };
    } catch (e) {
      print('❌ UPGRADE: Unexpected error checking status: $e');
      return {
        'success': false,
        'message': 'An unexpected error occurred while checking status.',
        'error': e.toString(),
      };
    }
  }

  /// Check if user can upgrade to organizer
  /// 
  /// Returns true if user is eligible for upgrade
  static Future<bool> canUpgrade() async {
    try {
      final status = await getUpgradeStatus();
      
      if (status['success'] == true) {
        final userData = status['data'];
        final verificationStatus = userData?['verificationStatus'];
        final role = userData?['role'];
        
        // User can upgrade if:
        // 1. They are PARTICIPANT (never upgraded)
        // 2. They are ORGANIZER with REJECTED status (can re-apply)
        if (role == 'PARTICIPANT') {
          return true;
        } else if (role == 'ORGANIZER' && verificationStatus == 'REJECTED') {
          return true;
        }
      }
      
      return false;
    } catch (e) {
      print('❌ UPGRADE: Error checking upgrade eligibility: $e');
      return false;
    }
  }

  /// Get organizer types available for upgrade
  /// 
  /// Returns list of available organizer types
  static List<Map<String, dynamic>> getOrganizerTypes() {
    return [
      {
        'value': 'INDIVIDUAL',
        'label': 'Individual/Personal',
        'description': 'Personal event organizer',
        'icon': 'person',
        'requiredFields': ['nik', 'personalAddress', 'personalPhone'],
        'optionalFields': ['portfolio', 'socialMedia'],
      },
      {
        'value': 'COMMUNITY',
        'label': 'Community/Organization',
        'description': 'Community or organization',
        'icon': 'group',
        'requiredFields': ['communityName'],
        'optionalFields': ['communityType', 'communityAddress', 'communityPhone', 'contactPerson', 'legalDocument', 'website', 'socialMedia'],
      },
      {
        'value': 'SMALL_BUSINESS',
        'label': 'Small Business/UMKM',
        'description': 'Small business or UMKM',
        'icon': 'business',
        'requiredFields': ['businessName', 'businessAddress'],
        'optionalFields': ['businessType', 'businessPhone', 'npwp', 'legalDocument', 'logo', 'socialMedia', 'portfolio'],
      },
      {
        'value': 'INSTITUTION',
        'label': 'Institution',
        'description': 'Educational or government institution',
        'icon': 'school',
        'requiredFields': ['institutionName'],
        'optionalFields': ['institutionType', 'institutionAddress', 'institutionPhone', 'contactPerson', 'akta', 'siup', 'website', 'socialMedia'],
      },
    ];
  }

  /// Validate profile data for specific organizer type
  /// 
  /// [organizerType] - Type of organizer
  /// [profileData] - Profile data to validate
  /// 
  /// Returns validation result with errors if any
  static Map<String, dynamic> validateProfileData({
    required String organizerType,
    required Map<String, dynamic> profileData,
  }) {
    print('🔍 VALIDATION: Validating $organizerType with data: $profileData');
    
    final organizerTypes = getOrganizerTypes();
    final organizerTypeData = organizerTypes.firstWhere(
      (type) => type['value'] == organizerType,
      orElse: () => throw Exception('Invalid organizer type'),
    );

    final requiredFields = organizerTypeData['requiredFields'] as List<String>;
    print('🔍 VALIDATION: Required fields: $requiredFields');
    
    final errors = <String>[];

    // Check required fields
    for (final field in requiredFields) {
      final value = profileData[field];
      print('🔍 VALIDATION: Checking field $field = $value');
      
      if (!profileData.containsKey(field) || 
          profileData[field] == null || 
          profileData[field].toString().trim().isEmpty) {
        final error = '${_getFieldLabel(field)} is required';
        errors.add(error);
        print('❌ VALIDATION: $error');
      } else {
        print('✅ VALIDATION: $field is valid');
      }
    }

    // Additional validation for specific fields
    if (profileData.containsKey('email') && profileData['email'] != null) {
      final email = profileData['email'].toString();
      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
        errors.add('Invalid email format');
      }
    }

    if (profileData.containsKey('phone') && profileData['phone'] != null) {
      final phone = profileData['phone'].toString();
      if (phone.length < 10) {
        errors.add('Phone number must be at least 10 digits');
      }
    }

    return {
      'isValid': errors.isEmpty,
      'errors': errors,
    };
  }

  /// Get human-readable field label
  static String _getFieldLabel(String field) {
    switch (field) {
      case 'nik':
        return 'NIK/KTP';
      case 'personalAddress':
        return 'Personal Address';
      case 'personalPhone':
        return 'Personal Phone';
      case 'communityName':
        return 'Community Name';
      case 'communityType':
        return 'Community Type';
      case 'communityAddress':
        return 'Community Address';
      case 'communityPhone':
        return 'Community Phone';
      case 'contactPerson':
        return 'Contact Person';
      case 'legalDocument':
        return 'Legal Document';
      case 'businessName':
        return 'Business Name';
      case 'businessType':
        return 'Business Type';
      case 'businessAddress':
        return 'Business Address';
      case 'businessPhone':
        return 'Business Phone';
      case 'npwp':
        return 'NPWP';
      case 'logo':
        return 'Logo';
      case 'institutionName':
        return 'Institution Name';
      case 'institutionType':
        return 'Institution Type';
      case 'institutionAddress':
        return 'Institution Address';
      case 'institutionPhone':
        return 'Institution Phone';
      case 'akta':
        return 'Akta Pendirian';
      case 'siup':
        return 'SIUP';
      case 'website':
        return 'Website';
      case 'socialMedia':
        return 'Social Media';
      case 'portfolio':
        return 'Portfolio';
      default:
        return field;
    }
  }
}
