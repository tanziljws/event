import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/event_analytics_models.dart';

class EventAnalyticsService {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>> getEventAnalytics(String eventId) async {
    try {
      // Get event details
      final eventResponse = await _apiClient.get(
        '${ApiConstants.organizerEventById}$eventId',
      );

      if (eventResponse.statusCode == 200) {
        final eventData = eventResponse.data;
        if (eventData['success'] == true) {
          final event = eventData['data']['event'] ?? eventData['data'];
          
          // Get attendance for this event (this endpoint exists and has registrations data)
          final attendanceResponse = await _apiClient.get(
            '${ApiConstants.organizerEvents}/attendance/$eventId',
          );
          
          // Process the data
          final analyticsData = _processEventAnalyticsData(
            event,
            attendanceResponse.data,
          );
          
          return {
            'success': true,
            'message': 'Event analytics loaded successfully',
            'analyticsData': analyticsData,
          };
        }
      }

      return {
        'success': false,
        'message': 'Failed to get event analytics',
      };
    } catch (e) {
      print('Get event analytics error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  Future<Map<String, dynamic>> getEventRegistrations(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.organizerEvents}/$eventId/registrations',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event registrations loaded successfully',
            'registrations': (data['data']['registrations'] as List)
                .map((e) => RegistrationAnalytics.fromJson(e))
                .toList(),
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to get event registrations',
      };
    } catch (e) {
      print('Get event registrations error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  Future<Map<String, dynamic>> getEventAttendance(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.organizerEvents}/$eventId/attendance',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event attendance loaded successfully',
            'attendance': (data['data']['attendance'] as List)
                .map((e) => AttendanceAnalytics.fromJson(e))
                .toList(),
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to get event attendance',
      };
    } catch (e) {
      print('Get event attendance error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  Future<Map<String, dynamic>> getEventCheckIns(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.organizerEvents}/$eventId/check-ins',
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'] ?? 'Event check-ins loaded successfully',
            'checkIns': (data['data']['checkIns'] as List)
                .map((e) => CheckInAnalytics.fromJson(e))
                .toList(),
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to get event check-ins',
      };
    } catch (e) {
      print('Get event check-ins error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  EventAnalyticsData _processEventAnalyticsData(
    Map<String, dynamic> event,
    Map<String, dynamic> attendanceData,
  ) {
    // Process registrations from attendance data
    final registrationsList = attendanceData['success'] == true 
        ? (attendanceData['data']['registrations'] as List?) ?? []
        : <Map<String, dynamic>>[];
    
    final registrations = <RegistrationAnalytics>[
      for (final reg in registrationsList)
        RegistrationAnalytics(
          id: reg['id'] ?? '',
          participantName: reg['participant']?['fullName'] ?? 'Unknown',
          participantEmail: reg['participant']?['email'] ?? '',
          registrationDate: reg['registeredAt'] ?? DateTime.now().toIso8601String(),
          status: reg['status'] ?? 'ACTIVE',
        )
    ];
    
    // Process attendance
    final attendance = <AttendanceAnalytics>[
      for (final reg in registrationsList.where((reg) => reg['hasAttended'] == true))
        AttendanceAnalytics(
          id: reg['id'] ?? '',
          participantName: reg['participant']?['fullName'] ?? 'Unknown',
          participantEmail: reg['participant']?['email'] ?? '',
          attendanceDate: reg['attendedAt'] ?? reg['attendanceTime'] ?? DateTime.now().toIso8601String(),
          status: reg['status'] ?? 'ACTIVE',
          notes: 'Attended event',
        )
    ];
    
    // Process check-ins (same as attendance for now)
    final checkIns = attendance.map((att) => CheckInAnalytics(
      id: att.id,
      participantName: att.participantName,
      participantEmail: att.participantEmail,
      checkInDate: att.attendanceDate,
      checkInTime: '09:00', // Default time
      location: 'Main Entrance',
      notes: att.notes,
    )).toList();
    
    // Calculate metrics
    final totalRegistrations = registrations.length;
    final totalAttendees = attendance.length;
    final totalCheckIns = checkIns.length;
    final maxParticipants = event['maxParticipants'] ?? 0;
    
    final registrationRate = maxParticipants > 0 
        ? (totalRegistrations / maxParticipants * 100)
        : 0.0;
    
    final attendanceRate = totalRegistrations > 0
        ? (totalAttendees / totalRegistrations * 100)
        : 0.0;
    
    final checkInRate = totalAttendees > 0
        ? (totalCheckIns / totalAttendees * 100)
        : 0.0;
    
    // Generate timeline data
    final registrationByDay = _generateRegistrationTimeline(registrations);
    final attendanceByDay = _generateAttendanceTimeline(attendance);
    final checkInByDay = _generateCheckInTimeline(checkIns);
    
    // Generate demographics
    final demographics = _generateDemographics(registrations);
    
    // Calculate revenue data
    final isFree = event['isFree'] == true;
    final eventPrice = event['price'] != null ? double.tryParse(event['price'].toString()) ?? 0.0 : 0.0;
    final totalRevenue = isFree ? 0.0 : (totalRegistrations * eventPrice).toDouble();
    final averageRevenuePerRegistration = totalRegistrations > 0 
        ? (totalRevenue / totalRegistrations) 
        : 0.0;

    return EventAnalyticsData(
      eventId: event['id'] ?? '',
      eventTitle: event['title'] ?? 'Event',
      eventDate: event['eventDate'] ?? DateTime.now().toIso8601String(),
      location: event['location'] ?? '',
      category: event['category'] ?? 'GENERAL',
      maxParticipants: maxParticipants,
      totalRegistrations: totalRegistrations,
      totalAttendees: totalAttendees,
      totalCheckIns: totalCheckIns,
      registrationRate: registrationRate,
      attendanceRate: attendanceRate,
      checkInRate: checkInRate,
      isFree: isFree,
      totalRevenue: totalRevenue,
      averageRevenuePerRegistration: averageRevenuePerRegistration,
      registrationAnalytics: registrations,
      attendanceAnalytics: attendance,
      checkInAnalytics: checkIns,
      registrationByDay: registrationByDay,
      attendanceByDay: attendanceByDay,
      checkInByDay: checkInByDay,
      demographics: demographics,
    );
  }

  Map<String, int> _generateRegistrationTimeline(List<RegistrationAnalytics> registrations) {
    final Map<String, int> timeline = {};
    for (final reg in registrations) {
      final date = DateTime.parse(reg.registrationDate);
      final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      timeline[dateKey] = (timeline[dateKey] ?? 0) + 1;
    }
    return timeline;
  }

  Map<String, int> _generateAttendanceTimeline(List<AttendanceAnalytics> attendance) {
    final Map<String, int> timeline = {};
    for (final att in attendance) {
      final date = DateTime.parse(att.attendanceDate);
      final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      timeline[dateKey] = (timeline[dateKey] ?? 0) + 1;
    }
    return timeline;
  }

  Map<String, int> _generateCheckInTimeline(List<CheckInAnalytics> checkIns) {
    final Map<String, int> timeline = {};
    for (final checkIn in checkIns) {
      final date = DateTime.parse(checkIn.checkInDate);
      final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      timeline[dateKey] = (timeline[dateKey] ?? 0) + 1;
    }
    return timeline;
  }

  List<ParticipantDemographics> _generateDemographics(List<RegistrationAnalytics> registrations) {
    // Simple age-based demographics (mock for now)
    final total = registrations.length;
    if (total == 0) return [];
    
    return [
      ParticipantDemographics(category: 'Age 18-25', count: (total * 0.3).round(), percentage: 30.0),
      ParticipantDemographics(category: 'Age 26-35', count: (total * 0.4).round(), percentage: 40.0),
      ParticipantDemographics(category: 'Age 36-45', count: (total * 0.2).round(), percentage: 20.0),
      ParticipantDemographics(category: 'Age 46+', count: (total * 0.1).round(), percentage: 10.0),
    ];
  }

  // Generate mock data for development/testing
  EventAnalyticsData generateMockEventAnalytics(String eventId, String eventTitle, {bool isFree = false}) {
    final now = DateTime.now();
    final eventDate = now.add(const Duration(days: 30));
    
    final totalRegistrations = 75;
    final eventPrice = isFree ? 0.0 : 50000.0;
    final totalRevenue = isFree ? 0.0 : (totalRegistrations * eventPrice);
    final averageRevenuePerRegistration = totalRegistrations > 0 
        ? (totalRevenue / totalRegistrations) 
        : 0.0;
    
    return EventAnalyticsData(
      eventId: eventId,
      eventTitle: eventTitle,
      eventDate: eventDate.toIso8601String(),
      location: 'Jakarta Convention Center',
      category: 'Technology',
      maxParticipants: 100,
      totalRegistrations: totalRegistrations,
      totalAttendees: 68,
      totalCheckIns: 65,
      registrationRate: 75.0,
      attendanceRate: 90.7,
      checkInRate: 95.6,
      isFree: isFree,
      totalRevenue: totalRevenue,
      averageRevenuePerRegistration: averageRevenuePerRegistration,
      registrationAnalytics: _generateMockRegistrations(),
      attendanceAnalytics: _generateMockAttendance(),
      checkInAnalytics: _generateMockCheckIns(),
      registrationByDay: _generateMockRegistrationByDay(),
      attendanceByDay: _generateMockAttendanceByDay(),
      checkInByDay: _generateMockCheckInByDay(),
      demographics: _generateMockDemographics(),
    );
  }

  List<RegistrationAnalytics> _generateMockRegistrations() {
    return List.generate(10, (index) {
      final date = DateTime.now().subtract(Duration(days: index));
      return RegistrationAnalytics(
        id: 'reg_$index',
        participantName: 'Participant ${index + 1}',
        participantEmail: 'participant${index + 1}@example.com',
        registrationDate: date.toIso8601String(),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        amountPaid: 50000.0,
      );
    });
  }

  List<AttendanceAnalytics> _generateMockAttendance() {
    return List.generate(8, (index) {
      final date = DateTime.now().subtract(Duration(days: index));
      return AttendanceAnalytics(
        id: 'att_$index',
        participantName: 'Participant ${index + 1}',
        participantEmail: 'participant${index + 1}@example.com',
        attendanceDate: date.toIso8601String(),
        status: 'PRESENT',
        notes: 'On time',
      );
    });
  }

  List<CheckInAnalytics> _generateMockCheckIns() {
    return List.generate(6, (index) {
      final date = DateTime.now().subtract(Duration(days: index));
      return CheckInAnalytics(
        id: 'check_$index',
        participantName: 'Participant ${index + 1}',
        participantEmail: 'participant${index + 1}@example.com',
        checkInDate: date.toIso8601String(),
        checkInTime: '${9 + index}:00',
        location: 'Main Entrance',
        notes: 'QR Code scanned',
      );
    });
  }

  Map<String, int> _generateMockRegistrationByDay() {
    return {
      '2024-01-15': 5,
      '2024-01-16': 8,
      '2024-01-17': 12,
      '2024-01-18': 15,
      '2024-01-19': 20,
      '2024-01-20': 10,
      '2024-01-21': 5,
    };
  }

  Map<String, int> _generateMockAttendanceByDay() {
    return {
      '2024-01-15': 3,
      '2024-01-16': 6,
      '2024-01-17': 10,
      '2024-01-18': 12,
      '2024-01-19': 18,
      '2024-01-20': 8,
      '2024-01-21': 4,
    };
  }

  Map<String, int> _generateMockCheckInByDay() {
    return {
      '2024-01-15': 2,
      '2024-01-16': 5,
      '2024-01-17': 8,
      '2024-01-18': 10,
      '2024-01-19': 15,
      '2024-01-20': 6,
      '2024-01-21': 3,
    };
  }

  List<ParticipantDemographics> _generateMockDemographics() {
    return [
      const ParticipantDemographics(category: 'Age 18-25', count: 25, percentage: 33.3),
      const ParticipantDemographics(category: 'Age 26-35', count: 30, percentage: 40.0),
      const ParticipantDemographics(category: 'Age 36-45', count: 15, percentage: 20.0),
      const ParticipantDemographics(category: 'Age 46+', count: 5, percentage: 6.7),
    ];
  }

  // Export event attendance as Excel
  Future<Map<String, dynamic>> exportEventAttendance(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.exportAttendance}$eventId',
        options: Options(
          responseType: ResponseType.bytes,
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ),
      );

      if (response.statusCode == 200) {
        // Convert response data to List<int> if it's not already
        List<int> fileData;
        if (response.data is List<int>) {
          fileData = response.data as List<int>;
        } else if (response.data is List) {
          fileData = (response.data as List).cast<int>();
        } else {
          fileData = List<int>.from(response.data);
        }
        
        return {
          'success': true,
          'data': fileData,
          'filename': 'attendance_$eventId.xlsx',
        };
      }

      return {
        'success': false,
        'message': 'Failed to export attendance data',
      };
    } catch (e) {
      print('Export attendance error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }

  // Export event registrations as Excel
  Future<Map<String, dynamic>> exportEventRegistrations(String eventId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.exportRegistrations}$eventId',
        options: Options(
          responseType: ResponseType.bytes,
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ),
      );

      if (response.statusCode == 200) {
        // Convert response data to List<int> if it's not already
        List<int> fileData;
        if (response.data is List<int>) {
          fileData = response.data as List<int>;
        } else if (response.data is List) {
          fileData = (response.data as List).cast<int>();
        } else {
          fileData = List<int>.from(response.data);
        }
        
        return {
          'success': true,
          'data': fileData,
          'filename': 'registrations_$eventId.xlsx',
        };
      }

      return {
        'success': false,
        'message': 'Failed to export registrations data',
      };
    } catch (e) {
      print('Export registrations error: $e');
      return {
        'success': false,
        'message': 'Network error. Please check your connection.',
      };
    }
  }
}
