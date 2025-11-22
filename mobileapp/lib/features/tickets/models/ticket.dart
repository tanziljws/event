import 'dart:convert';
import 'package:flutter/material.dart';

class Ticket {
  final String id;
  final String registrationToken;
  final bool hasAttended;
  final String registeredAt;
  final Event event;
  final Payment? payment;
  final TicketType? ticketType;
  final String? ticketTypeId;

  Ticket({
    required this.id,
    required this.registrationToken,
    required this.hasAttended,
    required this.registeredAt,
    required this.event,
    this.payment,
    this.ticketType,
    this.ticketTypeId,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    // Debug: Check if ticketType exists
    // print('🎫 Ticket.fromJson - ticketType: ${json['ticketType']}');
    // print('🎫 Ticket.fromJson - ticketTypeId: ${json['ticketTypeId']}');
    
    // Parse ticketType - handle both object and null
    TicketType? parsedTicketType;
    if (json['ticketType'] != null) {
      try {
        if (json['ticketType'] is Map) {
          parsedTicketType = TicketType.fromJson(json['ticketType'] as Map<String, dynamic>);
        } else if (json['ticketType'] is String) {
          // If it's a string, try to parse it as JSON
          try {
            final parsed = jsonDecode(json['ticketType'] as String);
            if (parsed is Map) {
              parsedTicketType = TicketType.fromJson(parsed as Map<String, dynamic>);
            }
          } catch (e) {
            // If parsing fails, ticketType will be null
          }
        }
      } catch (e) {
        // Debug: Print error
        // print('❌ Error parsing ticketType: $e');
      }
    }
    
    return Ticket(
      id: json['id']?.toString() ?? '',
      registrationToken: json['registrationToken']?.toString() ?? '',
      hasAttended: json['hasAttended'] == true || json['hasAttended'] == 'true',
      registeredAt: json['registeredAt']?.toString() ?? 
                    (json['registeredAt'] != null ? json['registeredAt'].toString() : ''),
      event: Event.fromJson(json['event'] ?? {}),
      payment: json['payments'] != null && (json['payments'] as List).isNotEmpty
          ? Payment.fromJson((json['payments'] as List).first)
          : json['payment'] != null
              ? Payment.fromJson(json['payment'])
              : null,
      ticketType: parsedTicketType,
      ticketTypeId: json['ticketTypeId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationToken': registrationToken,
      'hasAttended': hasAttended,
      'registeredAt': registeredAt,
      'event': event.toJson(),
      'payment': payment?.toJson(),
      'ticketType': ticketType?.toJson(),
      'ticketTypeId': ticketTypeId,
    };
  }

  // Get display price - prefer ticketType price over event price
  String get displayPrice {
    if (ticketType != null) {
      return ticketType!.formattedPrice;
    }
    return event.formattedPrice;
  }

  // Get display name - ticket type name if available
  String get displayTicketName {
    if (ticketType != null && ticketType!.name.isNotEmpty) {
      return ticketType!.name;
    }
    return 'General Admission';
  }

  // Get ticket type color, default to blue
  Color get ticketTypeColor {
    if (ticketType != null && ticketType!.color != null) {
      return ticketType!.colorValue;
    }
    return const Color(0xFF2563EB); // Default blue
  }

  String get status {
    if (hasAttended) {
      return 'USED';
    } else if (event.isPublished) {
      return 'ACTIVE';
    } else {
      return 'CANCELLED';
    }
  }

  String get statusDisplayName {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'USED':
        return 'Used';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  String get formattedRegisteredAt {
    try {
      final date = DateTime.parse(registeredAt);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return registeredAt;
    }
  }
}

class Event {
  final String id;
  final String title;
  final String? description;
  final String location;
  final double? latitude;
  final double? longitude;
  final String? thumbnailUrl;
  final String? eventDate;
  final String? eventTime;
  final int? maxParticipants;
  final bool isFree;
  final String? price;
  final String? category;
  final bool isPublished;
  final int? participantCount;
  final String? flyerUrl;
  final String? createdBy;
  final Creator? creator;

  Event({
    required this.id,
    required this.title,
    this.description,
    required this.location,
    this.latitude,
    this.longitude,
    this.thumbnailUrl,
    this.eventDate,
    this.eventTime,
    this.maxParticipants,
    required this.isFree,
    this.price,
    this.category,
    required this.isPublished,
    this.participantCount,
    this.flyerUrl,
    this.createdBy,
    this.creator,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      location: json['location'] ?? '',
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      thumbnailUrl: json['thumbnailUrl'],
      eventDate: json['eventDate'],
      eventTime: json['eventTime'],
      maxParticipants: json['maxParticipants'],
      isFree: json['isFree'] ?? true,
      price: json['price'],
      category: json['category'],
      isPublished: json['isPublished'] ?? false,
      participantCount: json['participantCount'] ?? json['_count']?['registrations'],
      flyerUrl: json['flyerUrl'],
      createdBy: json['createdBy'],
      creator: json['creator'] != null ? Creator.fromJson(json['creator']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'thumbnailUrl': thumbnailUrl,
      'eventDate': eventDate,
      'eventTime': eventTime,
      'maxParticipants': maxParticipants,
      'isFree': isFree,
      'price': price,
      'category': category,
      'isPublished': isPublished,
      'participantCount': participantCount,
      'flyerUrl': flyerUrl,
      'createdBy': createdBy,
      'creator': creator?.toJson(),
    };
  }

  String get formattedEventDate {
    if (eventDate == null) return 'TBA';
    try {
      final date = DateTime.parse(eventDate!);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return eventDate!;
    }
  }

  String get formattedEventTime {
    if (eventTime == null) return 'TBA';
    try {
      final time = DateTime.parse('2000-01-01T$eventTime');
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return eventTime!;
    }
  }

  String get formattedPrice {
    if (isFree) return 'Free';
    if (price == null) return 'TBA';
    return 'Rp ${price!.replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), '.')}';
  }
}

class Payment {
  final String id;
  final String status;
  final String? method;
  final String? amount;
  final String? currency;
  final String? transactionId;
  final String? paymentUrl;
  final String? paidAt;

  Payment({
    required this.id,
    required this.status,
    this.method,
    this.amount,
    this.currency,
    this.transactionId,
    this.paymentUrl,
    this.paidAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] ?? '',
      status: json['status'] ?? '',
      method: json['method'],
      amount: json['amount'],
      currency: json['currency'],
      transactionId: json['transactionId'],
      paymentUrl: json['paymentUrl'],
      paidAt: json['paidAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'method': method,
      'amount': amount,
      'currency': currency,
      'transactionId': transactionId,
      'paymentUrl': paymentUrl,
      'paidAt': paidAt,
    };
  }

  String get statusDisplayName {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'PAID':
        return 'Paid';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return status;
    }
  }

  String get formattedAmount {
    if (amount == null) return 'N/A';
    return 'Rp ${amount!.replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), '.')}';
  }
}

class Creator {
  final String id;
  final String fullName;
  final String email;

  Creator({
    required this.id,
    required this.fullName,
    required this.email,
  });

  factory Creator.fromJson(Map<String, dynamic> json) {
    return Creator(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
    };
  }
}

class TicketType {
  final String id;
  final String name;
  final String? description;
  final double? price;
  final bool isFree;
  final String? color;
  final String? icon;
  final String? badgeText;

  TicketType({
    required this.id,
    required this.name,
    this.description,
    this.price,
    required this.isFree,
    this.color,
    this.icon,
    this.badgeText,
  });

  factory TicketType.fromJson(Map<String, dynamic> json) {
    // Debug: Print received JSON
    // print('🎫 TicketType.fromJson: $json');
    
    return TicketType(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      price: json['price'] != null 
        ? (json['price'] is double 
            ? json['price'] 
            : json['price'] is int 
              ? json['price'].toDouble()
              : double.tryParse(json['price'].toString()))
        : null,
      isFree: json['isFree'] is bool 
        ? json['isFree'] 
        : (json['isFree'] == true || json['isFree'] == 'true' || json['price'] == null || json['price'] == 0),
      color: json['color']?.toString(),
      icon: json['icon']?.toString(),
      badgeText: json['badgeText']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'isFree': isFree,
      'color': color,
      'icon': icon,
      'badgeText': badgeText,
    };
  }

  String get formattedPrice {
    if (isFree) return 'Free';
    if (price == null) return 'TBA';
    return 'Rp ${price!.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    )}';
  }

  // Get Color from hex string, default to blue if invalid
  Color get colorValue {
    if (color == null || color!.isEmpty || color!.trim().isEmpty) {
      return const Color(0xFF2563EB); // Default blue
    }
    try {
      // Remove # if present and add 0xFF prefix for alpha
      String hexColor = color!.trim().replaceFirst('#', '').toUpperCase();
      
      // Handle different hex color formats
      if (hexColor.length == 6) {
        // Format: RRGGBB -> 0xFFRRGGBB
        return Color(int.parse('FF$hexColor', radix: 16));
      } else if (hexColor.length == 8) {
        // Format: AARRGGBB -> parse directly
        return Color(int.parse(hexColor, radix: 16));
      } else if (hexColor.length == 3) {
        // Format: RGB -> expand to RRGGBB
        String expanded = '';
        for (int i = 0; i < 3; i++) {
          expanded += hexColor[i] + hexColor[i];
        }
        return Color(int.parse('FF$expanded', radix: 16));
      }
      // Debug: Print invalid color
      // print('⚠️ Invalid hex color format: $color (length: ${hexColor.length})');
      return const Color(0xFF2563EB); // Default if invalid format
    } catch (e) {
      // Debug: Print error
      // print('❌ Error parsing color $color: $e');
      return const Color(0xFF2563EB); // Default on error
    }
  }
}
