import 'package:equatable/equatable.dart';

class AnalyticsEvent extends Equatable {
  final String id;
  final String title;
  final String eventDate;
  final String status;
  final String location;
  final int maxParticipants;
  final bool isPublished;
  final bool generateCertificate;
  final String category;
  final String createdAt;
  final int registrationsCount;

  const AnalyticsEvent({
    required this.id,
    required this.title,
    required this.eventDate,
    required this.status,
    required this.location,
    required this.maxParticipants,
    required this.isPublished,
    required this.generateCertificate,
    required this.category,
    required this.createdAt,
    required this.registrationsCount,
  });

  factory AnalyticsEvent.fromJson(Map<String, dynamic> json) {
    // Map status berdasarkan isPublished karena tidak ada rejected
    final mappedStatus = json['isPublished'] == true ? 'PUBLISHED' : 'DRAFT';
    
    return AnalyticsEvent(
      id: json['id'],
      title: json['title'],
      eventDate: json['eventDate'],
      status: mappedStatus, // Use mapped status instead of raw status
      location: json['location'],
      maxParticipants: json['maxParticipants'],
      isPublished: json['isPublished'],
      generateCertificate: json['generateCertificate'],
      category: json['category'],
      createdAt: json['createdAt'],
      registrationsCount: json['_count']?['registrations'] ?? 0,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        eventDate,
        status,
        location,
        maxParticipants,
        isPublished,
        generateCertificate,
        category,
        createdAt,
        registrationsCount,
      ];
}

class ChartData extends Equatable {
  final String month;
  final int events;
  final int participants;
  final double revenue;

  const ChartData({
    required this.month,
    required this.events,
    required this.participants,
    required this.revenue,
  });

  factory ChartData.fromJson(Map<String, dynamic> json) {
    return ChartData(
      month: json['month'],
      events: json['events'],
      participants: json['participants'],
      revenue: (json['revenue'] as num).toDouble(),
    );
  }

  @override
  List<Object?> get props => [month, events, participants, revenue];
}

class EventStatusData extends Equatable {
  final String name;
  final int value;
  final String color;

  const EventStatusData({
    required this.name,
    required this.value,
    required this.color,
  });

  factory EventStatusData.fromJson(Map<String, dynamic> json) {
    return EventStatusData(
      name: json['name'],
      value: json['value'],
      color: json['color'],
    );
  }

  @override
  List<Object?> get props => [name, value, color];
}

class AnalyticsData extends Equatable {
  final List<AnalyticsEvent> events;
  final List<ChartData> chartData;
  final List<EventStatusData> statusData;
  final Map<String, dynamic> pagination;

  const AnalyticsData({
    required this.events,
    required this.chartData,
    required this.statusData,
    required this.pagination,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsData(
      events: (json['events'] as List)
          .map((e) => AnalyticsEvent.fromJson(e))
          .toList(),
      chartData: (json['chartData'] as List)
          .map((e) => ChartData.fromJson(e))
          .toList(),
      statusData: (json['statusData'] as List)
          .map((e) => EventStatusData.fromJson(e))
          .toList(),
      pagination: json['pagination'] ?? {},
    );
  }

  @override
  List<Object?> get props => [events, chartData, statusData, pagination];
}

class AnalyticsFilters extends Equatable {
  final String searchQuery;
  final String statusFilter;
  final String categoryFilter;
  final String sortBy;
  final String sortOrder;

  const AnalyticsFilters({
    this.searchQuery = '',
    this.statusFilter = 'all',
    this.categoryFilter = 'all',
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  AnalyticsFilters copyWith({
    String? searchQuery,
    String? statusFilter,
    String? categoryFilter,
    String? sortBy,
    String? sortOrder,
  }) {
    return AnalyticsFilters(
      searchQuery: searchQuery ?? this.searchQuery,
      statusFilter: statusFilter ?? this.statusFilter,
      categoryFilter: categoryFilter ?? this.categoryFilter,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  @override
  List<Object?> get props => [
        searchQuery,
        statusFilter,
        categoryFilter,
        sortBy,
        sortOrder,
      ];
}
