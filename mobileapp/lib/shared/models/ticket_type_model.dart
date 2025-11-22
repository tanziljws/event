import 'package:flutter/material.dart';

class TicketType {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final double? price;
  final bool isFree;
  final int capacity;
  final int soldCount;
  final DateTime? saleStartDate;
  final DateTime? saleEndDate;
  final List<String> benefits;
  final bool isActive;
  final int sortOrder;
  
  // Custom styling
  final String color;
  final String icon;
  final String? badgeText;
  
  // Advanced settings
  final int minQuantity;
  final int maxQuantity;
  final bool requiresApproval;
  final String? termsConditions;
  
  // Discount & promotion
  final double? originalPrice;
  final double? discountPercentage;
  final String? promoCode;
  
  // Metadata for custom fields
  final Map<String, dynamic>? metadata;
  
  final DateTime createdAt;
  final DateTime updatedAt;

  TicketType({
    required this.id,
    required this.eventId,
    required this.name,
    this.description,
    this.price,
    required this.isFree,
    required this.capacity,
    required this.soldCount,
    this.saleStartDate,
    this.saleEndDate,
    required this.benefits,
    required this.isActive,
    required this.sortOrder,
    this.color = '#2563EB',
    this.icon = 'ticket',
    this.badgeText,
    this.minQuantity = 1,
    this.maxQuantity = 10,
    this.requiresApproval = false,
    this.termsConditions,
    this.originalPrice,
    this.discountPercentage,
    this.promoCode,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
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

  // Computed properties
  bool get isAvailable => soldCount < capacity && isActive;
  bool get isSoldOut => soldCount >= capacity;
  int get remainingCapacity => capacity - soldCount;
  
  bool get isSaleActive {
    final now = DateTime.now();
    if (saleStartDate != null && now.isBefore(saleStartDate!)) return false;
    if (saleEndDate != null && now.isAfter(saleEndDate!)) return false;
    return true;
  }
  
  bool get hasDiscount => discountPercentage != null && discountPercentage! > 0;
  
  double get finalPrice {
    if (isFree) return 0;
    if (price == null) return 0;
    if (hasDiscount) {
      return price! * (1 - (discountPercentage! / 100));
    }
    return price!;
  }
  
  String get formattedPrice {
    if (isFree) return 'Free';
    return 'Rp ${finalPrice.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), 
      (Match m) => '${m[1]},'
    )}';
  }
  
  String get formattedOriginalPrice {
    if (originalPrice == null) return formattedPrice;
    return 'Rp ${originalPrice!.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), 
      (Match m) => '${m[1]},'
    )}';
  }
  
  Color get colorValue {
    try {
      return Color(int.parse(color.replaceFirst('#', '0xFF')));
    } catch (e) {
      return const Color(0xFF2563EB); // Default blue
    }
  }
  
  IconData get iconData {
    switch (icon.toLowerCase()) {
      case 'star': return Icons.star;
      case 'crown': return Icons.workspace_premium;
      case 'diamond': return Icons.diamond;
      case 'heart': return Icons.favorite;
      case 'fire': return Icons.local_fire_department;
      case 'flash': return Icons.flash_on;
      case 'gift': return Icons.card_giftcard;
      case 'student': return Icons.school;
      case 'group': return Icons.group;
      case 'early': return Icons.access_time;
      default: return Icons.confirmation_number;
    }
  }

  factory TicketType.fromJson(Map<String, dynamic> json) {
    return TicketType(
      id: json['id'] ?? '',
      eventId: json['eventId'] ?? json['event_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      price: json['price'] != null ? double.tryParse(json['price'].toString()) : null,
      isFree: json['isFree'] ?? json['is_free'] ?? false,
      capacity: json['capacity'] ?? 0,
      soldCount: json['soldCount'] ?? json['sold_count'] ?? 0,
      saleStartDate: json['saleStartDate'] != null || json['sale_start_date'] != null
          ? DateTime.parse(json['saleStartDate'] ?? json['sale_start_date'])
          : null,
      saleEndDate: json['saleEndDate'] != null || json['sale_end_date'] != null
          ? DateTime.parse(json['saleEndDate'] ?? json['sale_end_date'])
          : null,
      benefits: _parseArrayField(json['benefits'])
          .map((e) => e.toString())
          .toList(),
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      sortOrder: json['sortOrder'] ?? json['sort_order'] ?? 0,
      color: json['color'] ?? '#2563EB',
      icon: json['icon'] ?? 'ticket',
      badgeText: json['badgeText'] ?? json['badge_text'],
      minQuantity: json['minQuantity'] ?? json['min_quantity'] ?? 1,
      maxQuantity: json['maxQuantity'] ?? json['max_quantity'] ?? 10,
      requiresApproval: json['requiresApproval'] ?? json['requires_approval'] ?? false,
      termsConditions: json['termsConditions'] ?? json['terms_conditions'],
      originalPrice: json['originalPrice'] != null || json['original_price'] != null
          ? double.tryParse((json['originalPrice'] ?? json['original_price']).toString())
          : null,
      discountPercentage: json['discountPercentage'] != null || json['discount_percentage'] != null
          ? double.tryParse((json['discountPercentage'] ?? json['discount_percentage']).toString())
          : null,
      promoCode: json['promoCode'] ?? json['promo_code'],
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'name': name,
      'description': description,
      'price': price,
      'isFree': isFree,
      'capacity': capacity,
      'soldCount': soldCount,
      'saleStartDate': saleStartDate?.toIso8601String(),
      'saleEndDate': saleEndDate?.toIso8601String(),
      'benefits': benefits,
      'isActive': isActive,
      'sortOrder': sortOrder,
      'color': color,
      'icon': icon,
      'badgeText': badgeText,
      'minQuantity': minQuantity,
      'maxQuantity': maxQuantity,
      'requiresApproval': requiresApproval,
      'termsConditions': termsConditions,
      'originalPrice': originalPrice,
      'discountPercentage': discountPercentage,
      'promoCode': promoCode,
      'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  TicketType copyWith({
    String? id,
    String? eventId,
    String? name,
    String? description,
    double? price,
    bool? isFree,
    int? capacity,
    int? soldCount,
    DateTime? saleStartDate,
    DateTime? saleEndDate,
    List<String>? benefits,
    bool? isActive,
    int? sortOrder,
    String? color,
    String? icon,
    String? badgeText,
    int? minQuantity,
    int? maxQuantity,
    bool? requiresApproval,
    String? termsConditions,
    double? originalPrice,
    double? discountPercentage,
    String? promoCode,
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TicketType(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      isFree: isFree ?? this.isFree,
      capacity: capacity ?? this.capacity,
      soldCount: soldCount ?? this.soldCount,
      saleStartDate: saleStartDate ?? this.saleStartDate,
      saleEndDate: saleEndDate ?? this.saleEndDate,
      benefits: benefits ?? this.benefits,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      badgeText: badgeText ?? this.badgeText,
      minQuantity: minQuantity ?? this.minQuantity,
      maxQuantity: maxQuantity ?? this.maxQuantity,
      requiresApproval: requiresApproval ?? this.requiresApproval,
      termsConditions: termsConditions ?? this.termsConditions,
      originalPrice: originalPrice ?? this.originalPrice,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      promoCode: promoCode ?? this.promoCode,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Create empty ticket type for form
  static TicketType createEmpty(String eventId) {
    return TicketType(
      id: '',
      eventId: eventId,
      name: '',
      description: '',
      price: 0,
      isFree: true,
      capacity: 100,
      soldCount: 0,
      benefits: [],
      isActive: true,
      sortOrder: 0,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Create default ticket type
  static TicketType createDefault(String eventId, {String name = 'General Admission'}) {
    return TicketType(
      id: '',
      eventId: eventId,
      name: name,
      description: 'Standard ticket for event access',
      price: 0,
      isFree: true,
      capacity: 100,
      soldCount: 0,
      benefits: ['Event access', 'Certificate of attendance'],
      isActive: true,
      sortOrder: 0,
      color: '#2563EB',
      icon: 'ticket',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}

// Predefined ticket templates for inspiration
class TicketTemplates {
  static List<Map<String, dynamic>> get templates => [
    {
      'name': 'General Admission',
      'description': 'Standard access to the event',
      'color': '#2563EB',
      'icon': 'ticket',
      'benefits': ['Event access', 'Certificate'],
    },
    {
      'name': 'Early Bird',
      'description': 'Special price for early registrants',
      'color': '#10B981',
      'icon': 'early',
      'badgeText': 'EARLY',
      'benefits': ['Event access', 'Certificate', 'Priority seating'],
    },
    {
      'name': 'Student Discount',
      'description': 'Special rate for students',
      'color': '#F59E0B',
      'icon': 'student',
      'badgeText': 'STUDENT',
      'benefits': ['Event access', 'Certificate', 'Student networking'],
    },
    {
      'name': 'Premium Package',
      'description': 'Enhanced experience with extras',
      'color': '#8B5CF6',
      'icon': 'crown',
      'badgeText': 'PREMIUM',
      'benefits': ['Event access', 'Certificate', 'Welcome kit', 'Lunch included', 'Priority support'],
    },
    {
      'name': 'Group Booking',
      'description': 'Special rate for groups (5+ people)',
      'color': '#EF4444',
      'icon': 'group',
      'badgeText': 'GROUP',
      'benefits': ['Event access', 'Certificate', 'Group photo', 'Bulk discount'],
    },
    {
      'name': 'VIP Experience',
      'description': 'Exclusive access and premium amenities',
      'color': '#DC2626',
      'icon': 'diamond',
      'badgeText': 'VIP',
      'benefits': ['Event access', 'Certificate', 'VIP lounge', 'Meet & greet', 'Premium seating', 'Welcome gift'],
    },
  ];

  static TicketType createFromTemplate(String eventId, Map<String, dynamic> template) {
    return TicketType(
      id: '',
      eventId: eventId,
      name: template['name'],
      description: template['description'],
      price: 0,
      isFree: true,
      capacity: 100,
      soldCount: 0,
      benefits: List<String>.from(template['benefits']),
      isActive: true,
      sortOrder: 0,
      color: template['color'],
      icon: template['icon'],
      badgeText: template['badgeText'],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}