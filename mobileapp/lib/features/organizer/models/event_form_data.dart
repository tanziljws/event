import '../../../shared/models/ticket_type_model.dart';

class EventFormData {
  // Basic Info
  String title;
  String description;
  String location;
  double? latitude;
  double? longitude;
  String? address;
  String? city;
  String? province;
  String? country;
  String? postalCode;

  // Details
  String eventDate;
  String? eventEndDate;
  String eventTime;
  String? eventEndTime;
  int maxParticipants;
  String registrationDeadline;

  // Media
  String thumbnailUrl;
  List<String> galleryUrls;

  // Settings
  String category;
  double price;
  bool isFree;
  bool isPublished;
  bool generateCertificate;
  bool isPrivate;
  String privatePassword;
  
  // Ticketing
  bool hasMultipleTicketTypes;
  List<TicketType> ticketTypes;

  EventFormData({
    this.title = '',
    this.description = '',
    this.location = '',
    this.latitude,
    this.longitude,
    this.address,
    this.city,
    this.province,
    this.country,
    this.postalCode,
    this.eventDate = '',
    this.eventEndDate,
    this.eventTime = '',
    this.eventEndTime,
    this.maxParticipants = 100,
    this.registrationDeadline = '',
    this.thumbnailUrl = '',
    this.galleryUrls = const [],
    this.category = 'OTHER',
    this.price = 0,
    this.isFree = true,
    this.isPublished = false,
    this.generateCertificate = false,
    this.isPrivate = false,
    this.privatePassword = '',
    this.hasMultipleTicketTypes = false,
    this.ticketTypes = const [],
  });

  // Validation methods
  bool get isBasicInfoValid {
    return title.trim().isNotEmpty &&
           description.trim().isNotEmpty &&
           location.trim().isNotEmpty &&
           latitude != null &&
           longitude != null;
  }

  bool get isDetailsValid {
    return eventDate.isNotEmpty &&
           eventTime.isNotEmpty &&
           maxParticipants > 0 &&
           registrationDeadline.isNotEmpty;
  }

  bool get isMediaValid {
    return thumbnailUrl.isNotEmpty || galleryUrls.isNotEmpty;
  }

  bool get isSettingsValid {
    // Category must be selected
    if (category.isEmpty) {
      return false;
    }
    
    // If private event, password must be provided
    if (isPrivate && privatePassword.trim().isEmpty) {
      return false;
    }
    
    return true;
  }

  bool get isFormValid {
    return isBasicInfoValid && isDetailsValid && isSettingsValid;
  }

  // Get completion percentage
  double get completionPercentage {
    int completedSections = 0;
    if (isBasicInfoValid) completedSections++;
    if (isDetailsValid) completedSections++;
    if (isMediaValid) completedSections++;
    // Ticketing step
    if (!hasMultipleTicketTypes || ticketTypes.isNotEmpty) completedSections++;
    if (isSettingsValid) completedSections++;
    return completedSections / 5.0; // Now 5 sections instead of 4
  }

  // Convert to API format
  Map<String, dynamic> toApiFormat() {
    final data = {
      'title': title.trim(),
      'description': description.trim(),
      'eventDate': DateTime.parse(eventDate).toIso8601String(),
      'eventEndDate': eventEndDate != null ? DateTime.parse(eventEndDate!).toIso8601String() : null,
      'eventTime': eventTime,
      'eventEndTime': eventEndTime,
      'location': location.trim(),
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'city': city,
      'province': province,
      'country': country,
      'postalCode': postalCode,
      'maxParticipants': maxParticipants,
      'registrationDeadline': DateTime.parse(registrationDeadline).toIso8601String(),
      'category': category,
      'price': hasMultipleTicketTypes ? null : (isFree ? null : price),
      'isFree': hasMultipleTicketTypes ? false : isFree,
      'thumbnailUrl': thumbnailUrl,
      'galleryUrls': galleryUrls,
      'isPublished': isPublished,
      'generateCertificate': generateCertificate,
      'isPrivate': isPrivate,
      'privatePassword': isPrivate ? privatePassword.trim() : null,
      'hasMultipleTicketTypes': hasMultipleTicketTypes,
    };
    
    // Add ticket types if using multiple ticket types
    if (hasMultipleTicketTypes && ticketTypes.isNotEmpty) {
      data['ticketTypes'] = ticketTypes.map((ticket) => ticket.toJson()).toList();
    }
    
    return data;
  }

  // Copy with method
  EventFormData copyWith({
    String? title,
    String? description,
    String? location,
    double? latitude,
    double? longitude,
    String? address,
    String? city,
    String? province,
    String? country,
    String? postalCode,
    String? eventDate,
    String? eventEndDate,
    String? eventTime,
    String? eventEndTime,
    int? maxParticipants,
    String? registrationDeadline,
    String? thumbnailUrl,
    List<String>? galleryUrls,
    String? category,
    double? price,
    bool? isFree,
    bool? isPublished,
    bool? generateCertificate,
    bool? isPrivate,
    String? privatePassword,
    bool? hasMultipleTicketTypes,
    List<TicketType>? ticketTypes,
  }) {
    return EventFormData(
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      city: city ?? this.city,
      province: province ?? this.province,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      eventDate: eventDate ?? this.eventDate,
      eventEndDate: eventEndDate ?? this.eventEndDate,
      eventTime: eventTime ?? this.eventTime,
      eventEndTime: eventEndTime ?? this.eventEndTime,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      galleryUrls: galleryUrls ?? this.galleryUrls,
      category: category ?? this.category,
      price: price ?? this.price,
      isFree: isFree ?? this.isFree,
      isPublished: isPublished ?? this.isPublished,
      generateCertificate: generateCertificate ?? this.generateCertificate,
      isPrivate: isPrivate ?? this.isPrivate,
      privatePassword: privatePassword ?? this.privatePassword,
      hasMultipleTicketTypes: hasMultipleTicketTypes ?? this.hasMultipleTicketTypes,
      ticketTypes: ticketTypes ?? this.ticketTypes,
    );
  }

  // Reset form
  void reset() {
    title = '';
    description = '';
    location = '';
    latitude = null;
    longitude = null;
    address = null;
    city = null;
    province = null;
    country = null;
    postalCode = null;
    eventDate = '';
    eventEndDate = null;
    eventTime = '';
    eventEndTime = null;
    maxParticipants = 100;
    registrationDeadline = '';
    thumbnailUrl = '';
    galleryUrls = <String>[];
    category = 'OTHER';
    price = 0;
    isFree = true;
    isPublished = false;
    generateCertificate = false;
    isPrivate = false;
    privatePassword = '';
    hasMultipleTicketTypes = false;
    ticketTypes = <TicketType>[];
  }
}

// Event categories
class EventCategories {
  static const List<Map<String, String>> categories = [
    {'value': 'ACADEMIC', 'label': 'Academic'},
    {'value': 'SPORTS', 'label': 'Sports'},
    {'value': 'ARTS', 'label': 'Arts'},
    {'value': 'CULTURE', 'label': 'Culture'},
    {'value': 'TECHNOLOGY', 'label': 'Technology'},
    {'value': 'BUSINESS', 'label': 'Business'},
    {'value': 'HEALTH', 'label': 'Health'},
    {'value': 'EDUCATION', 'label': 'Education'},
    {'value': 'ENTERTAINMENT', 'label': 'Entertainment'},
    {'value': 'OTHER', 'label': 'Other'},
  ];

  static String getCategoryLabel(String value) {
    final category = categories.firstWhere(
      (cat) => cat['value'] == value,
      orElse: () => {'value': value, 'label': value},
    );
    return category['label']!;
  }
}
