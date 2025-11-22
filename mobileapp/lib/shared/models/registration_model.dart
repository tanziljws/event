import 'event_model.dart';

class RegistrationModel {
  final String id;
  final String registrationToken;
  final bool hasAttended;
  final String status;
  final DateTime registeredAt;
  final DateTime? attendedAt;
  final String? certificateUrl;
  final String? qrCodeUrl;
  final EventModel event;

  RegistrationModel({
    required this.id,
    required this.registrationToken,
    required this.hasAttended,
    required this.status,
    required this.registeredAt,
    this.attendedAt,
    this.certificateUrl,
    this.qrCodeUrl,
    required this.event,
  });

  factory RegistrationModel.fromJson(Map<String, dynamic> json) {
    return RegistrationModel(
      id: json['id'] ?? '',
      registrationToken: json['registrationToken'] ?? '',
      hasAttended: json['hasAttended'] ?? false,
      status: json['status'] ?? 'ACTIVE',
      registeredAt: json['registeredAt'] != null 
          ? DateTime.parse(json['registeredAt'])
          : DateTime.now(),
      attendedAt: json['attendedAt'] != null 
          ? DateTime.parse(json['attendedAt'])
          : null,
      certificateUrl: json['certificateUrl'],
      qrCodeUrl: json['qrCodeUrl'],
      event: EventModel.fromJson(json['event'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationToken': registrationToken,
      'hasAttended': hasAttended,
      'status': status,
      'registeredAt': registeredAt.toIso8601String(),
      'attendedAt': attendedAt?.toIso8601String(),
      'certificateUrl': certificateUrl,
      'qrCodeUrl': qrCodeUrl,
      'event': event.toJson(),
    };
  }
}
