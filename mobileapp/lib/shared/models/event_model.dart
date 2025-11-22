import 'user_model.dart';
import 'ticket_type_model.dart';
import '../../core/constants/api_constants.dart';

class EventModel {
  final String id;
  final String title;
  final DateTime eventDate;
  final DateTime? eventEndDate;
  final String eventTime;
  final String? eventEndTime;
  final String location;
  final double? latitude;
  final double? longitude;
  final String? address;
  final String? city;
  final String? province;
  final String? country;
  final String? postalCode;
  final String? thumbnailUrl;
  final List<String> galleryUrls;
  final String? flyerUrl;
  final String? certificateTemplateUrl;
  final String? description;
  final int maxParticipants;
  final DateTime registrationDeadline;
  final bool isPublished;
  final bool generateCertificate;
  final bool isPrivate;
  final String? privatePassword;
  final bool hasMultipleTicketTypes;
  final String status;
  final String category;
  final double? price;
  final bool isFree;
  final double? platformFee;
  final double? organizerRevenue;
  final String createdBy;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? rejectionReason;
  final String? assignedTo;
  final DateTime? assignedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Location-based properties
  double? distance;
  
  // Relations
  final UserModel? creator;
  final UserModel? approver;
  final List<EventRegistration>? registrations;
  final List<TicketType>? ticketTypes;
  final int? registrationCount;
  final bool? isRegistered;
  final bool? hasAttended;

  EventModel({
    required this.id,
    required this.title,
    required this.eventDate,
    this.eventEndDate,
    required this.eventTime,
    this.eventEndTime,
    required this.location,
    this.latitude,
    this.longitude,
    this.address,
    this.city,
    this.province,
    this.country,
    this.postalCode,
    this.thumbnailUrl,
    required this.galleryUrls,
    this.flyerUrl,
    this.certificateTemplateUrl,
    this.description,
    required this.maxParticipants,
    required this.registrationDeadline,
    required this.isPublished,
    required this.generateCertificate,
    required this.isPrivate,
    this.privatePassword,
    required this.hasMultipleTicketTypes,
    required this.status,
    required this.category,
    this.price,
    required this.isFree,
    this.platformFee,
    this.organizerRevenue,
    required this.createdBy,
    this.approvedBy,
    this.approvedAt,
    this.rejectionReason,
    this.assignedTo,
    this.assignedAt,
    required this.createdAt,
    required this.updatedAt,
    this.creator,
    this.approver,
    this.registrations,
    this.ticketTypes,
    this.registrationCount,
    this.isRegistered,
    this.hasAttended,
  });

  // Helper function to safely parse array fields (handles object with numeric keys)
  static List<dynamic> _parseArrayField(dynamic field) {
    if (field == null) return [];
    if (field is List) return field;
    if (field is Map) {
      // Convert object with numeric keys to array
      return field.values.toList();
    }
    return [];
  }

  // Helper function to process image URLs
  static String? _processImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a local file path, convert to server URL
    if (url.startsWith('/data/') || url.startsWith('/storage/') || url.contains('cache/')) {
      // Extract filename from path
      final filename = url.split('/').last;
      return '${ApiConstants.fileBaseUrl}/uploads/$filename';
    }
    
    // If it's a relative path, assume it's a server path
    if (url.startsWith('/')) {
      return '${ApiConstants.fileBaseUrl}$url';
    }
    
    // Default: assume it's a filename in uploads folder
    return '${ApiConstants.fileBaseUrl}/uploads/$url';
  }

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      eventDate: json['eventDate'] != null 
          ? DateTime.parse(json['eventDate'])
          : DateTime.now(),
      eventEndDate: json['eventEndDate'] != null 
          ? DateTime.parse(json['eventEndDate'])
          : null,
      eventTime: json['eventTime'] ?? '',
      eventEndTime: json['eventEndTime'],
      location: json['location'] ?? '',
      latitude: json['latitude'] != null 
          ? double.tryParse(json['latitude'].toString()) 
          : null,
      longitude: json['longitude'] != null 
          ? double.tryParse(json['longitude'].toString()) 
          : null,
      address: json['address'],
      city: json['city'],
      province: json['province'],
      country: json['country'],
      postalCode: json['postalCode'],
      thumbnailUrl: _processImageUrl(json['thumbnailUrl'] ?? json['flyerUrl']),
      galleryUrls: _parseArrayField(json['galleryUrls'])
          .map((url) => _processImageUrl(url.toString()))
          .where((url) => url != null)
          .cast<String>()
          .toList(),
      flyerUrl: _processImageUrl(json['flyerUrl']),
      certificateTemplateUrl: _processImageUrl(json['certificateTemplateUrl']),
      description: json['description'],
      maxParticipants: json['maxParticipants'] ?? 0,
      registrationDeadline: json['registrationDeadline'] != null 
          ? DateTime.parse(json['registrationDeadline'])
          : DateTime.now(),
      isPublished: json['isPublished'] ?? false,
      generateCertificate: json['generateCertificate'] ?? false,
      isPrivate: json['isPrivate'] ?? false,
      privatePassword: json['privatePassword'],
      hasMultipleTicketTypes: json['hasMultipleTicketTypes'] ?? false,
      status: json['status'] ?? '',
      category: json['category'] ?? '',
      price: json['price'] != null 
          ? double.tryParse(json['price'].toString()) 
          : null,
      isFree: json['isFree'] ?? true,
      platformFee: json['platformFee'] != null 
          ? double.tryParse(json['platformFee'].toString()) 
          : null,
      organizerRevenue: json['organizerRevenue'] != null 
          ? double.tryParse(json['organizerRevenue'].toString()) 
          : null,
      createdBy: json['createdBy'] ?? '',
      approvedBy: json['approvedBy'],
      approvedAt: json['approvedAt'] != null 
          ? DateTime.parse(json['approvedAt']) 
          : null,
      rejectionReason: json['rejectionReason'],
      assignedTo: json['assignedTo'],
      assignedAt: json['assignedAt'] != null 
          ? DateTime.parse(json['assignedAt']) 
          : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
      creator: json['creator'] != null 
          ? UserModel.fromJson(json['creator']) 
          : null,
      approver: json['approver'] != null 
          ? UserModel.fromJson(json['approver']) 
          : null,
      registrations: json['registrations'] != null 
          ? _parseArrayField(json['registrations'])
              .map((e) => EventRegistration.fromJson(e))
              .toList()
          : null,
      ticketTypes: json['ticketTypes'] != null 
          ? _parseArrayField(json['ticketTypes'])
              .map((e) => TicketType.fromJson(e))
              .toList()
          : null,
      registrationCount: json['registrationCount'] ?? json['_count']?['registrations'],
      isRegistered: json['isRegistered'],
      hasAttended: json['hasAttended'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'eventDate': eventDate.toIso8601String(),
      'eventEndDate': eventEndDate?.toIso8601String(),
      'eventTime': eventTime,
      'eventEndTime': eventEndTime,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'city': city,
      'province': province,
      'country': country,
      'postalCode': postalCode,
      'thumbnailUrl': thumbnailUrl,
      'galleryUrls': galleryUrls,
      'flyerUrl': flyerUrl,
      'certificateTemplateUrl': certificateTemplateUrl,
      'description': description,
      'maxParticipants': maxParticipants,
      'registrationDeadline': registrationDeadline.toIso8601String(),
      'isPublished': isPublished,
      'generateCertificate': generateCertificate,
      'isPrivate': isPrivate,
      'privatePassword': privatePassword,
      'status': status,
      'category': category,
      'price': price,
      'isFree': isFree,
      'platformFee': platformFee,
      'organizerRevenue': organizerRevenue,
      'createdBy': createdBy,
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toIso8601String(),
      'rejectionReason': rejectionReason,
      'assignedTo': assignedTo,
      'assignedAt': assignedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'creator': creator?.toJson(),
      'approver': approver?.toJson(),
      'registrations': registrations?.map((e) => e.toJson()).toList(),
      'registrationCount': registrationCount,
      'isRegistered': isRegistered,
      'hasAttended': hasAttended,
    };
  }

  EventModel copyWith({
    String? id,
    String? title,
    DateTime? eventDate,
    DateTime? eventEndDate,
    String? eventTime,
    String? eventEndTime,
    String? location,
    double? latitude,
    double? longitude,
    String? address,
    String? city,
    String? province,
    String? country,
    String? postalCode,
    String? thumbnailUrl,
    List<String>? galleryUrls,
    String? flyerUrl,
    String? certificateTemplateUrl,
    String? description,
    int? maxParticipants,
    DateTime? registrationDeadline,
    bool? isPublished,
    bool? generateCertificate,
    String? status,
    String? category,
    double? price,
    bool? isFree,
    double? platformFee,
    double? organizerRevenue,
    String? createdBy,
    String? approvedBy,
    DateTime? approvedAt,
    String? rejectionReason,
    String? assignedTo,
    DateTime? assignedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserModel? creator,
    UserModel? approver,
    List<EventRegistration>? registrations,
    int? registrationCount,
    bool? isRegistered,
    bool? hasAttended,
  }) {
    return EventModel(
      id: id ?? this.id,
      title: title ?? this.title,
      eventDate: eventDate ?? this.eventDate,
      eventEndDate: eventEndDate ?? this.eventEndDate,
      eventTime: eventTime ?? this.eventTime,
      eventEndTime: eventEndTime ?? this.eventEndTime,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      city: city ?? this.city,
      province: province ?? this.province,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      galleryUrls: galleryUrls ?? this.galleryUrls,
      flyerUrl: flyerUrl ?? this.flyerUrl,
      certificateTemplateUrl: certificateTemplateUrl ?? this.certificateTemplateUrl,
      description: description ?? this.description,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      isPublished: isPublished ?? this.isPublished,
      generateCertificate: generateCertificate ?? this.generateCertificate,
      isPrivate: isPrivate ?? this.isPrivate,
      privatePassword: privatePassword ?? this.privatePassword,
      hasMultipleTicketTypes: hasMultipleTicketTypes ?? this.hasMultipleTicketTypes,
      status: status ?? this.status,
      category: category ?? this.category,
      price: price ?? this.price,
      isFree: isFree ?? this.isFree,
      platformFee: platformFee ?? this.platformFee,
      organizerRevenue: organizerRevenue ?? this.organizerRevenue,
      createdBy: createdBy ?? this.createdBy,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedAt: assignedAt ?? this.assignedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      creator: creator ?? this.creator,
      approver: approver ?? this.approver,
      registrations: registrations ?? this.registrations,
      registrationCount: registrationCount ?? this.registrationCount,
      isRegistered: isRegistered ?? this.isRegistered,
      hasAttended: hasAttended ?? this.hasAttended,
    );
  }

  // Helper methods
  bool get isMultiDay => eventEndDate != null && 
                        eventEndDate!.difference(eventDate).inDays > 0;
  
  bool get isUpcoming => eventDate.isAfter(DateTime.now());
  bool get isPast => (eventEndDate ?? eventDate).isBefore(DateTime.now());
  bool get isToday => eventDate.day == DateTime.now().day && 
                     eventDate.month == DateTime.now().month && 
                     eventDate.year == DateTime.now().year;
  
  bool get canRegister => isPublished && 
                         registrationDeadline.isAfter(DateTime.now()) && 
                         (registrationCount ?? 0) < maxParticipants;
  
  bool get isRegistrationClosed => registrationDeadline.isBefore(DateTime.now());
  bool get isFullyBooked => (registrationCount ?? 0) >= maxParticipants;
  
  String get formattedDate {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    if (isMultiDay) {
      final startDay = eventDate.day;
      final endDay = eventEndDate!.day;
      final startMonth = months[eventDate.month - 1];
      final endMonth = months[eventEndDate!.month - 1];
      
      if (eventDate.month == eventEndDate!.month && eventDate.year == eventEndDate!.year) {
        // Same month: "5-7 Oct 2025"
        return '$startDay-$endDay $startMonth ${eventDate.year}';
      } else if (eventDate.year == eventEndDate!.year) {
        // Different month, same year: "30 Oct - 2 Nov 2025"
        return '$startDay $startMonth - $endDay $endMonth ${eventDate.year}';
      } else {
        // Different year: "30 Dec 2024 - 2 Jan 2025"
        return '$startDay $startMonth ${eventDate.year} - $endDay $endMonth ${eventEndDate!.year}';
      }
    }
    
    return '${eventDate.day} ${months[eventDate.month - 1]} ${eventDate.year}';
  }
  
  String get formattedTime {
    if (eventEndTime != null && eventEndTime != eventTime) {
      return '$eventTime - $eventEndTime';
    }
    return eventTime;
  }
  
  String get formattedPrice {
    if (isFree) return 'Free';
    if (price == null) return 'Free';
    return 'Rp ${price!.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), 
      (Match m) => '${m[1]},'
    )}';
  }
  
  String get statusText {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'APPROVED': return 'Approved';
      case 'PUBLISHED': return 'Published';
      case 'REJECTED': return 'Rejected';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }
  
  String get categoryText {
    switch (category) {
      case 'TECHNOLOGY': return 'Technology';
      case 'ACADEMIC': return 'Academic';
      case 'SPORTS': return 'Sports';
      case 'ARTS': return 'Arts';
      case 'CULTURE': return 'Culture';
      case 'BUSINESS': return 'Business';
      case 'HEALTH': return 'Health';
      case 'EDUCATION': return 'Education';
      case 'ENTERTAINMENT': return 'Entertainment';
      case 'OTHER': return 'Other';
      default: return category;
    }
  }
  
  // Location helper methods
  String get formattedLocation {
    if (address != null && address!.isNotEmpty) {
      return address!;
    }
    return location;
  }
  
  String get shortLocation {
    if (city != null && province != null) {
      return '$city, $province';
    }
    return location;
  }
  
  bool get hasCoordinates => latitude != null && longitude != null;
  
  String get coordinatesText {
    if (hasCoordinates) {
      return '${latitude!.toStringAsFixed(6)}, ${longitude!.toStringAsFixed(6)}';
    }
    return 'No coordinates';
  }
}

class EventRegistration {
  final String id;
  final String eventId;
  final String participantId;
  final String registrationToken;
  final bool hasAttended;
  final DateTime? attendanceTime;
  final String? certificateUrl;
  final String? qrCodeUrl;
  final String status;
  final DateTime? cancelledAt;
  final DateTime registeredAt;
  final DateTime? attendedAt;
  
  // Relations
  final EventModel? event;
  final UserModel? participant;
  final List<Payment>? payments;
  final List<Ticket>? tickets;
  final Certificate? certificate;

  EventRegistration({
    required this.id,
    required this.eventId,
    required this.participantId,
    required this.registrationToken,
    required this.hasAttended,
    this.attendanceTime,
    this.certificateUrl,
    this.qrCodeUrl,
    required this.status,
    this.cancelledAt,
    required this.registeredAt,
    this.attendedAt,
    this.event,
    this.participant,
    this.payments,
    this.tickets,
    this.certificate,
  });

  factory EventRegistration.fromJson(Map<String, dynamic> json) {
    // Safely parse registeredAt with fallback
    DateTime registeredAt;
    try {
      if (json['registeredAt'] != null) {
        registeredAt = DateTime.parse(json['registeredAt'].toString());
      } else {
        registeredAt = DateTime.now();
      }
    } catch (e) {
      // If parsing fails, use current date
      registeredAt = DateTime.now();
    }
    
    // Safely parse other date fields
    DateTime? parseDateSafely(dynamic dateValue) {
      if (dateValue == null) return null;
      try {
        return DateTime.parse(dateValue.toString());
      } catch (e) {
        return null;
      }
    }
    
    return EventRegistration(
      id: json['id']?.toString() ?? '',
      eventId: json['eventId']?.toString() ?? '',
      participantId: json['participantId']?.toString() ?? '',
      registrationToken: json['registrationToken']?.toString() ?? '',
      hasAttended: json['hasAttended'] == true || json['hasAttended'] == 'true',
      attendanceTime: parseDateSafely(json['attendanceTime']),
      certificateUrl: json['certificateUrl']?.toString(),
      qrCodeUrl: json['qrCodeUrl']?.toString(),
      status: json['status']?.toString() ?? 'ACTIVE',
      cancelledAt: parseDateSafely(json['cancelledAt']),
      registeredAt: registeredAt,
      attendedAt: parseDateSafely(json['attendedAt']),
      event: json['event'] != null 
          ? (() {
              try {
                return EventModel.fromJson(json['event'] as Map<String, dynamic>);
              } catch (e) {
                return null;
              }
            })()
          : null,
      participant: json['participant'] != null 
          ? (() {
              try {
                return UserModel.fromJson(json['participant'] as Map<String, dynamic>);
              } catch (e) {
                return null;
              }
            })()
          : null,
      payments: json['payments'] != null 
          ? (() {
              try {
                return EventModel._parseArrayField(json['payments'])
                    .map((e) {
                      try {
                        return Payment.fromJson(e);
                      } catch (e) {
                        return null;
                      }
                    })
                    .whereType<Payment>()
                    .toList();
              } catch (e) {
                return null;
              }
            })()
          : null,
      tickets: json['tickets'] != null 
          ? (() {
              try {
                return EventModel._parseArrayField(json['tickets'])
                    .map((e) {
                      try {
                        return Ticket.fromJson(e);
                      } catch (e) {
                        return null;
                      }
                    })
                    .whereType<Ticket>()
                    .toList();
              } catch (e) {
                return null;
              }
            })()
          : null,
      certificate: json['certificate'] != null 
          ? (() {
              try {
                return Certificate.fromJson(json['certificate'] as Map<String, dynamic>);
              } catch (e) {
                return null;
              }
            })()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'participantId': participantId,
      'registrationToken': registrationToken,
      'hasAttended': hasAttended,
      'attendanceTime': attendanceTime?.toIso8601String(),
      'certificateUrl': certificateUrl,
      'qrCodeUrl': qrCodeUrl,
      'status': status,
      'cancelledAt': cancelledAt?.toIso8601String(),
      'registeredAt': registeredAt.toIso8601String(),
      'attendedAt': attendedAt?.toIso8601String(),
      'event': event?.toJson(),
      'participant': participant?.toJson(),
      'payments': payments?.map((e) => e.toJson()).toList(),
      'tickets': tickets?.map((e) => e.toJson()).toList(),
      'certificate': certificate?.toJson(),
    };
  }

  bool get isActive => status == 'ACTIVE';
  bool get isCancelled => status == 'CANCELLED';
  bool get isRefunded => status == 'REFUNDED';
  bool get isCompleted => status == 'COMPLETED';
}

class Payment {
  final String id;
  final String registrationId;
  final double amount;
  final String currency;
  final String paymentMethod;
  final String paymentStatus;
  final String? paymentReference;
  final String? paymentUrl;
  final String? qrCodeUrl;
  final String? qrCodeData;
  final DateTime? paidAt;
  final DateTime? expiredAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Payment({
    required this.id,
    required this.registrationId,
    required this.amount,
    required this.currency,
    required this.paymentMethod,
    required this.paymentStatus,
    this.paymentReference,
    this.paymentUrl,
    this.qrCodeUrl,
    this.qrCodeData,
    this.paidAt,
    this.expiredAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] ?? '',
      registrationId: json['registrationId'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'IDR',
      paymentMethod: json['paymentMethod'] ?? '',
      paymentStatus: json['paymentStatus'] ?? '',
      paymentReference: json['paymentReference'],
      paymentUrl: json['paymentUrl'],
      qrCodeUrl: json['qrCodeUrl'],
      qrCodeData: json['qrCodeData'],
      paidAt: json['paidAt'] != null 
          ? DateTime.parse(json['paidAt']) 
          : null,
      expiredAt: json['expiredAt'] != null 
          ? DateTime.parse(json['expiredAt']) 
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationId': registrationId,
      'amount': amount,
      'currency': currency,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'paymentReference': paymentReference,
      'paymentUrl': paymentUrl,
      'qrCodeUrl': qrCodeUrl,
      'qrCodeData': qrCodeData,
      'paidAt': paidAt?.toIso8601String(),
      'expiredAt': expiredAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isPending => paymentStatus == 'PENDING';
  bool get isPaid => paymentStatus == 'PAID';
  bool get isFailed => paymentStatus == 'FAILED';
  bool get isExpired => paymentStatus == 'EXPIRED';
  bool get isRefunded => paymentStatus == 'REFUNDED';
}

class Ticket {
  final String id;
  final String registrationId;
  final String ticketNumber;
  final String? qrCodeUrl;
  final String? qrCodeData;
  final bool isUsed;
  final DateTime? usedAt;
  final String? usedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  Ticket({
    required this.id,
    required this.registrationId,
    required this.ticketNumber,
    this.qrCodeUrl,
    this.qrCodeData,
    required this.isUsed,
    this.usedAt,
    this.usedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'] ?? '',
      registrationId: json['registrationId'] ?? '',
      ticketNumber: json['ticketNumber'] ?? '',
      qrCodeUrl: json['qrCodeUrl'],
      qrCodeData: json['qrCodeData'],
      isUsed: json['isUsed'] ?? false,
      usedAt: json['usedAt'] != null 
          ? DateTime.parse(json['usedAt']) 
          : null,
      usedBy: json['usedBy'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationId': registrationId,
      'ticketNumber': ticketNumber,
      'qrCodeUrl': qrCodeUrl,
      'qrCodeData': qrCodeData,
      'isUsed': isUsed,
      'usedAt': usedAt?.toIso8601String(),
      'usedBy': usedBy,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class Certificate {
  final String id;
  final String registrationId;
  final String certificateNumber;
  final String certificateUrl;
  final String? verificationHash;
  final DateTime issuedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Certificate({
    required this.id,
    required this.registrationId,
    required this.certificateNumber,
    required this.certificateUrl,
    this.verificationHash,
    required this.issuedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      id: json['id'] ?? '',
      registrationId: json['registrationId'] ?? '',
      certificateNumber: json['certificateNumber'] ?? '',
      certificateUrl: json['certificateUrl'] ?? '',
      verificationHash: json['verificationHash'],
      issuedAt: DateTime.parse(json['issuedAt']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationId': registrationId,
      'certificateNumber': certificateNumber,
      'certificateUrl': certificateUrl,
      'verificationHash': verificationHash,
      'issuedAt': issuedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
