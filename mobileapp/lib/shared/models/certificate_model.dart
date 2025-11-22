import 'event_model.dart';

class CertificateModel {
  final String id;
  final String certificateNumber;
  final String certificateUrl;
  final String verificationHash;
  final DateTime issuedAt;
  final RegistrationInfo registration;

  CertificateModel({
    required this.id,
    required this.certificateNumber,
    required this.certificateUrl,
    required this.verificationHash,
    required this.issuedAt,
    required this.registration,
  });

  factory CertificateModel.fromJson(Map<String, dynamic> json) {
    return CertificateModel(
      id: json['id'] ?? '',
      certificateNumber: json['certificateNumber'] ?? '',
      certificateUrl: json['certificateUrl'] ?? '',
      verificationHash: json['verificationHash'] ?? '',
      issuedAt: json['issuedAt'] != null 
          ? DateTime.parse(json['issuedAt'])
          : DateTime.now(),
      registration: RegistrationInfo.fromJson(json['registration'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'certificateNumber': certificateNumber,
      'certificateUrl': certificateUrl,
      'verificationHash': verificationHash,
      'issuedAt': issuedAt.toIso8601String(),
      'registration': registration.toJson(),
    };
  }
}

class RegistrationInfo {
  final String id;
  final bool hasAttended;
  final DateTime? attendedAt;
  final EventModel event;

  RegistrationInfo({
    required this.id,
    required this.hasAttended,
    this.attendedAt,
    required this.event,
  });

  factory RegistrationInfo.fromJson(Map<String, dynamic> json) {
    return RegistrationInfo(
      id: json['id'] ?? '',
      hasAttended: json['hasAttended'] ?? false,
      attendedAt: json['attendedAt'] != null 
          ? DateTime.parse(json['attendedAt'])
          : null,
      event: EventModel.fromJson(json['event'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hasAttended': hasAttended,
      'attendedAt': attendedAt?.toIso8601String(),
      'event': event.toJson(),
    };
  }
}
