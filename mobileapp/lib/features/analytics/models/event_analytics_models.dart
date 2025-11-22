import 'package:equatable/equatable.dart';

class EventAnalyticsData extends Equatable {
  final String eventId;
  final String eventTitle;
  final String eventDate;
  final String location;
  final String category;
  final int maxParticipants;
  final int totalRegistrations;
  final int totalAttendees;
  final int totalCheckIns;
  final double registrationRate;
  final double attendanceRate;
  final double checkInRate;
  final bool isFree;
  final double totalRevenue;
  final double averageRevenuePerRegistration;
  final List<RegistrationAnalytics> registrationAnalytics;
  final List<AttendanceAnalytics> attendanceAnalytics;
  final List<CheckInAnalytics> checkInAnalytics;
  final Map<String, int> registrationByDay;
  final Map<String, int> attendanceByDay;
  final Map<String, int> checkInByDay;
  final List<ParticipantDemographics> demographics;

  const EventAnalyticsData({
    required this.eventId,
    required this.eventTitle,
    required this.eventDate,
    required this.location,
    required this.category,
    required this.maxParticipants,
    required this.totalRegistrations,
    required this.totalAttendees,
    required this.totalCheckIns,
    required this.registrationRate,
    required this.attendanceRate,
    required this.checkInRate,
    required this.isFree,
    required this.totalRevenue,
    required this.averageRevenuePerRegistration,
    required this.registrationAnalytics,
    required this.attendanceAnalytics,
    required this.checkInAnalytics,
    required this.registrationByDay,
    required this.attendanceByDay,
    required this.checkInByDay,
    required this.demographics,
  });

  factory EventAnalyticsData.fromJson(Map<String, dynamic> json) {
    return EventAnalyticsData(
      eventId: json['eventId'],
      eventTitle: json['eventTitle'],
      eventDate: json['eventDate'],
      location: json['location'],
      category: json['category'],
      maxParticipants: json['maxParticipants'],
      totalRegistrations: json['totalRegistrations'],
      totalAttendees: json['totalAttendees'],
      totalCheckIns: json['totalCheckIns'],
      registrationRate: json['registrationRate']?.toDouble() ?? 0.0,
      attendanceRate: json['attendanceRate']?.toDouble() ?? 0.0,
      checkInRate: json['checkInRate']?.toDouble() ?? 0.0,
      isFree: json['isFree'] ?? false,
      totalRevenue: json['totalRevenue']?.toDouble() ?? 0.0,
      averageRevenuePerRegistration: json['averageRevenuePerRegistration']?.toDouble() ?? 0.0,
      registrationAnalytics: (json['registrationAnalytics'] as List?)
          ?.map((e) => RegistrationAnalytics.fromJson(e))
          .toList() ?? [],
      attendanceAnalytics: (json['attendanceAnalytics'] as List?)
          ?.map((e) => AttendanceAnalytics.fromJson(e))
          .toList() ?? [],
      checkInAnalytics: (json['checkInAnalytics'] as List?)
          ?.map((e) => CheckInAnalytics.fromJson(e))
          .toList() ?? [],
      registrationByDay: Map<String, int>.from(json['registrationByDay'] ?? {}),
      attendanceByDay: Map<String, int>.from(json['attendanceByDay'] ?? {}),
      checkInByDay: Map<String, int>.from(json['checkInByDay'] ?? {}),
      demographics: (json['demographics'] as List?)
          ?.map((e) => ParticipantDemographics.fromJson(e))
          .toList() ?? [],
    );
  }

  @override
  List<Object?> get props => [
        eventId,
        eventTitle,
        eventDate,
        location,
        category,
        maxParticipants,
        totalRegistrations,
        totalAttendees,
        totalCheckIns,
        registrationRate,
        attendanceRate,
        checkInRate,
        isFree,
        totalRevenue,
        averageRevenuePerRegistration,
        registrationAnalytics,
        attendanceAnalytics,
        checkInAnalytics,
        registrationByDay,
        attendanceByDay,
        checkInByDay,
        demographics,
      ];
}

class RegistrationAnalytics extends Equatable {
  final String id;
  final String participantName;
  final String participantEmail;
  final String registrationDate;
  final String status;
  final String? paymentStatus;
  final double? amountPaid;

  const RegistrationAnalytics({
    required this.id,
    required this.participantName,
    required this.participantEmail,
    required this.registrationDate,
    required this.status,
    this.paymentStatus,
    this.amountPaid,
  });

  factory RegistrationAnalytics.fromJson(Map<String, dynamic> json) {
    return RegistrationAnalytics(
      id: json['id'],
      participantName: json['participantName'],
      participantEmail: json['participantEmail'],
      registrationDate: json['registrationDate'],
      status: json['status'],
      paymentStatus: json['paymentStatus'],
      amountPaid: json['amountPaid']?.toDouble(),
    );
  }

  @override
  List<Object?> get props => [
        id,
        participantName,
        participantEmail,
        registrationDate,
        status,
        paymentStatus,
        amountPaid,
      ];
}

class AttendanceAnalytics extends Equatable {
  final String id;
  final String participantName;
  final String participantEmail;
  final String attendanceDate;
  final String status;
  final String? notes;

  const AttendanceAnalytics({
    required this.id,
    required this.participantName,
    required this.participantEmail,
    required this.attendanceDate,
    required this.status,
    this.notes,
  });

  factory AttendanceAnalytics.fromJson(Map<String, dynamic> json) {
    return AttendanceAnalytics(
      id: json['id'],
      participantName: json['participantName'],
      participantEmail: json['participantEmail'],
      attendanceDate: json['attendanceDate'],
      status: json['status'],
      notes: json['notes'],
    );
  }

  @override
  List<Object?> get props => [
        id,
        participantName,
        participantEmail,
        attendanceDate,
        status,
        notes,
      ];
}

class CheckInAnalytics extends Equatable {
  final String id;
  final String participantName;
  final String participantEmail;
  final String checkInDate;
  final String checkInTime;
  final String location;
  final String? notes;

  const CheckInAnalytics({
    required this.id,
    required this.participantName,
    required this.participantEmail,
    required this.checkInDate,
    required this.checkInTime,
    required this.location,
    this.notes,
  });

  factory CheckInAnalytics.fromJson(Map<String, dynamic> json) {
    return CheckInAnalytics(
      id: json['id'],
      participantName: json['participantName'],
      participantEmail: json['participantEmail'],
      checkInDate: json['checkInDate'],
      checkInTime: json['checkInTime'],
      location: json['location'],
      notes: json['notes'],
    );
  }

  @override
  List<Object?> get props => [
        id,
        participantName,
        participantEmail,
        checkInDate,
        checkInTime,
        location,
        notes,
      ];
}

class ParticipantDemographics extends Equatable {
  final String category;
  final int count;
  final double percentage;

  const ParticipantDemographics({
    required this.category,
    required this.count,
    required this.percentage,
  });

  factory ParticipantDemographics.fromJson(Map<String, dynamic> json) {
    return ParticipantDemographics(
      category: json['category'],
      count: json['count'],
      percentage: json['percentage']?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [category, count, percentage];
}
