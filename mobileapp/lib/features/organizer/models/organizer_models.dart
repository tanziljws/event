class OrganizerDashboardStats {
  final int totalEvents;
  final int publishedEvents;
  final int totalRegistrations;
  final double totalRevenue;

  OrganizerDashboardStats({
    required this.totalEvents,
    required this.publishedEvents,
    required this.totalRegistrations,
    required this.totalRevenue,
  });

  factory OrganizerDashboardStats.fromJson(Map<String, dynamic> json) {
    return OrganizerDashboardStats(
      totalEvents: json['totalEvents'] ?? 0,
      publishedEvents: json['publishedEvents'] ?? 0,
      totalRegistrations: json['totalRegistrations'] ?? 0,
      totalRevenue: double.tryParse((json['totalRevenue'] ?? 0).toString()) ?? 0.0,
    );
  }
}

class OrganizerEvent {
  final String id;
  final String title;
  final String description;
  final DateTime eventDate;
  final String eventTime;
  final String location;
  final int maxParticipants;
  final bool isPublished;
  final bool generateCertificate;
  final String category;
  final String createdAt;
  final int registrationCount;
  final String status;
  final double? price;
  final bool isFree;
  final String? thumbnailUrl;
  final List<String> galleryUrls;

  OrganizerEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.eventDate,
    required this.eventTime,
    required this.location,
    required this.maxParticipants,
    required this.isPublished,
    required this.generateCertificate,
    required this.category,
    required this.createdAt,
    required this.registrationCount,
    required this.status,
    this.price,
    required this.isFree,
    this.thumbnailUrl,
    required this.galleryUrls,
  });

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
      return 'https://web-production-38c7.up.railway.app/uploads/$filename';
    }
    
    // If it's a relative path, assume it's a server path
    if (url.startsWith('/')) {
      return 'https://web-production-38c7.up.railway.app$url';
    }
    
    // Default: assume it's a filename in uploads folder
    return 'https://web-production-38c7.up.railway.app/uploads/$url';
  }

  factory OrganizerEvent.fromJson(Map<String, dynamic> json) {
    return OrganizerEvent(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      eventDate: DateTime.parse(json['eventDate'] ?? DateTime.now().toIso8601String()),
      eventTime: json['eventTime'] ?? '',
      location: json['location'] ?? '',
      maxParticipants: json['maxParticipants'] ?? 0,
      isPublished: json['isPublished'] ?? false,
      generateCertificate: json['generateCertificate'] ?? false,
      category: json['category'] ?? '',
      createdAt: json['createdAt'] ?? '',
      registrationCount: json['_count']?['registrations'] ?? 0,
      status: json['status'] ?? 'DRAFT',
      price: json['price'] != null ? double.tryParse(json['price'].toString()) : null,
      isFree: json['isFree'] ?? true,
      thumbnailUrl: _processImageUrl(json['thumbnailUrl'] ?? json['flyerUrl']),
      galleryUrls: (json['galleryUrls'] as List<dynamic>? ?? [])
          .map((url) => _processImageUrl(url.toString()))
          .where((url) => url != null)
          .cast<String>()
          .toList(),
    );
  }

  String get formattedPrice {
    if (isFree) return 'Free';
    return 'Rp ${price?.toStringAsFixed(0) ?? '0'}';
  }

  String get statusDisplayName {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Published';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }

  double get registrationRate {
    if (maxParticipants == 0) return 0.0;
    return (registrationCount / maxParticipants) * 100;
  }

  int get daysUntilEvent {
    final now = DateTime.now();
    return eventDate.difference(now).inDays;
  }
}

class OrganizerDashboardData {
  final OrganizerDashboardStats stats;
  final List<OrganizerEvent> recentEvents;

  OrganizerDashboardData({
    required this.stats,
    required this.recentEvents,
  });

  factory OrganizerDashboardData.fromJson(Map<String, dynamic> json) {
    return OrganizerDashboardData(
      stats: OrganizerDashboardStats.fromJson(json['stats'] ?? {}),
      recentEvents: (json['recentEvents'] as List?)
          ?.map((event) => OrganizerEvent.fromJson(event))
          .toList() ?? [],
    );
  }
}

class EventAnalytics {
  final String eventId;
  final String title;
  final String eventDate;
  final String eventTime;
  final String location;
  final int maxParticipants;
  final double? price;
  final bool isFree;
  final String category;
  final int totalRegistrations;
  final int totalAttendance;
  final double attendanceRate;
  final double totalRevenue;
  final double averageTicketPrice;
  final List<DailyRegistration> dailyRegistrations;
  final List<AttendanceData> attendanceData;

  EventAnalytics({
    required this.eventId,
    required this.title,
    required this.eventDate,
    required this.eventTime,
    required this.location,
    required this.maxParticipants,
    this.price,
    required this.isFree,
    required this.category,
    required this.totalRegistrations,
    required this.totalAttendance,
    required this.attendanceRate,
    required this.totalRevenue,
    required this.averageTicketPrice,
    required this.dailyRegistrations,
    required this.attendanceData,
  });

  factory EventAnalytics.fromJson(Map<String, dynamic> json) {
    return EventAnalytics(
      eventId: json['eventId'] ?? '',
      title: json['title'] ?? '',
      eventDate: json['eventDate'] ?? '',
      eventTime: json['eventTime'] ?? '',
      location: json['location'] ?? '',
      maxParticipants: json['maxParticipants'] ?? 0,
      price: json['price'] != null ? double.tryParse(json['price'].toString()) : null,
      isFree: json['isFree'] ?? true,
      category: json['category'] ?? '',
      totalRegistrations: json['totalRegistrations'] ?? 0,
      totalAttendance: json['totalAttendance'] ?? 0,
      attendanceRate: double.tryParse((json['attendanceRate'] ?? 0).toString()) ?? 0.0,
      totalRevenue: double.tryParse((json['totalRevenue'] ?? 0).toString()) ?? 0.0,
      averageTicketPrice: double.tryParse((json['averageTicketPrice'] ?? 0).toString()) ?? 0.0,
      dailyRegistrations: (json['dailyRegistrations'] as List?)
          ?.map((item) => DailyRegistration.fromJson(item))
          .toList() ?? [],
      attendanceData: (json['attendanceData'] as List?)
          ?.map((item) => AttendanceData.fromJson(item))
          .toList() ?? [],
    );
  }
}

class DailyRegistration {
  final String date;
  final int registrations;
  final double revenue;

  DailyRegistration({
    required this.date,
    required this.registrations,
    required this.revenue,
  });

  factory DailyRegistration.fromJson(Map<String, dynamic> json) {
    return DailyRegistration(
      date: json['date'] ?? '',
      registrations: json['registrations'] ?? 0,
      revenue: double.tryParse((json['revenue'] ?? 0).toString()) ?? 0.0,
    );
  }
}

class AttendanceData {
  final String status;
  final int count;
  final double percentage;

  AttendanceData({
    required this.status,
    required this.count,
    required this.percentage,
  });

  factory AttendanceData.fromJson(Map<String, dynamic> json) {
    return AttendanceData(
      status: json['status'] ?? '',
      count: json['count'] ?? 0,
      percentage: double.tryParse((json['percentage'] ?? 0).toString()) ?? 0.0,
    );
  }
}
