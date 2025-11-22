class AttendanceEvent {
  final String id;
  final String title;
  final String eventDate;
  final String eventTime;
  final String location;

  AttendanceEvent({
    required this.id,
    required this.title,
    required this.eventDate,
    required this.eventTime,
    required this.location,
  });

  factory AttendanceEvent.fromJson(Map<String, dynamic> json) {
    return AttendanceEvent(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      eventDate: json['eventDate'] ?? '',
      eventTime: json['eventTime'] ?? '',
      location: json['location'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'eventDate': eventDate,
      'eventTime': eventTime,
      'location': location,
    };
  }
}

class AttendanceParticipant {
  final String id;
  final String fullName;
  final String email;
  final String phoneNumber;

  AttendanceParticipant({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
  });

  factory AttendanceParticipant.fromJson(Map<String, dynamic> json) {
    return AttendanceParticipant(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
    };
  }
}

class AttendanceRegistration {
  final String id;
  final String eventId;
  final String participantId;
  final String registrationToken;
  final bool hasAttended;
  final String? attendanceTime;
  final String? certificateUrl;
  final String qrCodeUrl;
  final String status;
  final String? cancelledAt;
  final String registeredAt;
  final String? attendedAt;
  final AttendanceParticipant participant;

  AttendanceRegistration({
    required this.id,
    required this.eventId,
    required this.participantId,
    required this.registrationToken,
    required this.hasAttended,
    this.attendanceTime,
    this.certificateUrl,
    required this.qrCodeUrl,
    required this.status,
    this.cancelledAt,
    required this.registeredAt,
    this.attendedAt,
    required this.participant,
  });

  factory AttendanceRegistration.fromJson(Map<String, dynamic> json) {
    return AttendanceRegistration(
      id: json['id'] ?? '',
      eventId: json['eventId'] ?? '',
      participantId: json['participantId'] ?? '',
      registrationToken: json['registrationToken'] ?? '',
      hasAttended: json['hasAttended'] ?? false,
      attendanceTime: json['attendanceTime'],
      certificateUrl: json['certificateUrl'],
      qrCodeUrl: json['qrCodeUrl'] ?? '',
      status: json['status'] ?? '',
      cancelledAt: json['cancelledAt'],
      registeredAt: json['registeredAt'] ?? '',
      attendedAt: json['attendedAt'],
      participant: AttendanceParticipant.fromJson(json['participant'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'participantId': participantId,
      'registrationToken': registrationToken,
      'hasAttended': hasAttended,
      'attendanceTime': attendanceTime,
      'certificateUrl': certificateUrl,
      'qrCodeUrl': qrCodeUrl,
      'status': status,
      'cancelledAt': cancelledAt,
      'registeredAt': registeredAt,
      'attendedAt': attendedAt,
      'participant': participant.toJson(),
    };
  }
}

class AttendanceStatistics {
  final int totalRegistrations;
  final int attendedRegistrations;
  final double attendanceRate;

  AttendanceStatistics({
    required this.totalRegistrations,
    required this.attendedRegistrations,
    required this.attendanceRate,
  });

  factory AttendanceStatistics.fromJson(Map<String, dynamic> json) {
    return AttendanceStatistics(
      totalRegistrations: json['totalRegistrations'] ?? 0,
      attendedRegistrations: json['attendedRegistrations'] ?? 0,
      attendanceRate: double.tryParse((json['attendanceRate'] ?? 0).toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalRegistrations': totalRegistrations,
      'attendedRegistrations': attendedRegistrations,
      'attendanceRate': attendanceRate,
    };
  }
}

class AttendanceData {
  final AttendanceEvent event;
  final AttendanceStatistics statistics;
  final List<AttendanceRegistration> registrations;

  AttendanceData({
    required this.event,
    required this.statistics,
    required this.registrations,
  });

  factory AttendanceData.fromJson(Map<String, dynamic> json) {
    return AttendanceData(
      event: AttendanceEvent.fromJson(json['event'] ?? {}),
      statistics: AttendanceStatistics.fromJson(json['statistics'] ?? {}),
      registrations: (json['registrations'] as List<dynamic>? ?? [])
          .map((item) => AttendanceRegistration.fromJson(item))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'event': event.toJson(),
      'statistics': statistics.toJson(),
      'registrations': registrations.map((item) => item.toJson()).toList(),
    };
  }
}

class DetectedEventData {
  final AttendanceEvent event;
  final AttendanceParticipant participant;

  DetectedEventData({
    required this.event,
    required this.participant,
  });

  factory DetectedEventData.fromJson(Map<String, dynamic> json) {
    return DetectedEventData(
      event: AttendanceEvent.fromJson(json['event'] ?? {}),
      participant: AttendanceParticipant.fromJson(json['participant'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'event': event.toJson(),
      'participant': participant.toJson(),
    };
  }
}
