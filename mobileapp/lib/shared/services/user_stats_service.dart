import '../../core/network/api_client.dart';

class UserStatsService {
  static final UserStatsService _instance = UserStatsService._internal();
  factory UserStatsService() => _instance;
  UserStatsService._internal();

  final ApiClient _apiClient = ApiClient();

  // Get user dashboard statistics
  Future<Map<String, dynamic>> getUserDashboardStats() async {
    try {
      final response = await _apiClient.get('/user-stats/dashboard');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'],
          };
        }
      }
      
      return {
        'success': false,
        'message': 'Failed to get dashboard stats',
      };
    } catch (e) {
      print('Get user dashboard stats error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }
}
