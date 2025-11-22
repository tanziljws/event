import 'package:equatable/equatable.dart';

class NotificationModel extends Equatable {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.data,
    required this.isRead,
    required this.createdAt,
    this.readAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      type: json['type'] as String,
      data: json['data'] as Map<String, dynamic>?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'data': data,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'readAt': readAt?.toIso8601String(),
    };
  }

  NotificationModel copyWith({
    String? id,
    String? title,
    String? body,
    String? type,
    Map<String, dynamic>? data,
    bool? isRead,
    DateTime? createdAt,
    DateTime? readAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      type: type ?? this.type,
      data: data ?? this.data,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      readAt: readAt ?? this.readAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        body,
        type,
        data,
        isRead,
        createdAt,
        readAt,
      ];

  // Helper getters for backward compatibility
  String get message => body;
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  // Type checkers for backward compatibility
  bool get isEventReminderH1 => type == 'event_reminder' && data?['hoursBefore'] == 1;
  bool get isEventReminderH0 => type == 'event_reminder' && data?['hoursBefore'] == 0;
  bool get isRegistrationConfirmed => type == 'event_registration';
  bool get isEventCancelled => type == 'event_cancellation';
  bool get isEventUpdated => type == 'event_update';
  bool get isNewRegistration => type == 'event_registration';
  bool get isPaymentSuccess => type == 'payment_confirmation' && data?['status'] == 'success';
  bool get isPaymentFailed => type == 'payment_confirmation' && data?['status'] == 'failed';
  bool get isCertificateReady => type == 'certificate_ready';
}

/// Notification types
class NotificationType {
  static const String eventRegistration = 'event_registration';
  static const String eventReminder = 'event_reminder';
  static const String paymentConfirmation = 'payment_confirmation';
  static const String eventUpdate = 'event_update';
  static const String eventCancellation = 'event_cancellation';
  static const String organizerApproval = 'organizer_approval';
  static const String organizerRejection = 'organizer_rejection';
  static const String systemAnnouncement = 'system_announcement';
  static const String registrationDeadline = 'registration_deadline';
  static const String eventStarting = 'event_starting';
}

/// Notification data models
class EventNotificationData {
  final String eventId;
  final String eventTitle;
  final String? eventDate;
  final String? eventLocation;

  const EventNotificationData({
    required this.eventId,
    required this.eventTitle,
    this.eventDate,
    this.eventLocation,
  });

  factory EventNotificationData.fromJson(Map<String, dynamic> json) {
    return EventNotificationData(
      eventId: json['eventId'] as String,
      eventTitle: json['eventTitle'] as String,
      eventDate: json['eventDate'] as String?,
      eventLocation: json['eventLocation'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'eventId': eventId,
      'eventTitle': eventTitle,
      'eventDate': eventDate,
      'eventLocation': eventLocation,
    };
  }
}

class PaymentNotificationData {
  final String paymentId;
  final String eventId;
  final String eventTitle;
  final String amount;
  final String status;

  const PaymentNotificationData({
    required this.paymentId,
    required this.eventId,
    required this.eventTitle,
    required this.amount,
    required this.status,
  });

  factory PaymentNotificationData.fromJson(Map<String, dynamic> json) {
    return PaymentNotificationData(
      paymentId: json['paymentId'] as String,
      eventId: json['eventId'] as String,
      eventTitle: json['eventTitle'] as String,
      amount: json['amount'] as String,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'paymentId': paymentId,
      'eventId': eventId,
      'eventTitle': eventTitle,
      'amount': amount,
      'status': status,
    };
  }
}

class OrganizerNotificationData {
  final String organizerId;
  final String organizerName;
  final String? reason;
  final String? approvalDate;

  const OrganizerNotificationData({
    required this.organizerId,
    required this.organizerName,
    this.reason,
    this.approvalDate,
  });

  factory OrganizerNotificationData.fromJson(Map<String, dynamic> json) {
    return OrganizerNotificationData(
      organizerId: json['organizerId'] as String,
      organizerName: json['organizerName'] as String,
      reason: json['reason'] as String?,
      approvalDate: json['approvalDate'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'organizerId': organizerId,
      'organizerName': organizerName,
      'reason': reason,
      'approvalDate': approvalDate,
    };
  }
}