/// Model for upgrade response and status
class UpgradeResponse {
  final bool success;
  final String message;
  final UpgradeData? data;
  final Map<String, dynamic>? error;

  UpgradeResponse({
    required this.success,
    required this.message,
    this.data,
    this.error,
  });

  factory UpgradeResponse.fromJson(Map<String, dynamic> json) {
    return UpgradeResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null ? UpgradeData.fromJson(json['data']) : null,
      error: json['error'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.toJson(),
      'error': error,
    };
  }
}

/// Model for upgrade data
class UpgradeData {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? organizerType;
  final String? verificationStatus;
  final String? businessName;
  final String? businessAddress;
  final String? businessPhone;
  final List<String>? portfolio;
  final Map<String, dynamic>? socialMedia;
  final DateTime updatedAt;

  UpgradeData({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.organizerType,
    this.verificationStatus,
    this.businessName,
    this.businessAddress,
    this.businessPhone,
    this.portfolio,
    this.socialMedia,
    required this.updatedAt,
  });

  factory UpgradeData.fromJson(Map<String, dynamic> json) {
    return UpgradeData(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      role: json['role'] ?? '',
      organizerType: json['organizerType'],
      verificationStatus: json['verificationStatus'],
      businessName: json['businessName'],
      businessAddress: json['businessAddress'],
      businessPhone: json['businessPhone'],
      portfolio: json['portfolio'] != null 
          ? List<String>.from(json['portfolio']) 
          : null,
      socialMedia: json['socialMedia'],
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'role': role,
      'organizerType': organizerType,
      'verificationStatus': verificationStatus,
      'businessName': businessName,
      'businessAddress': businessAddress,
      'businessPhone': businessPhone,
      'portfolio': portfolio,
      'socialMedia': socialMedia,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

/// Model for upgrade status
class UpgradeStatus {
  final bool canUpgrade;
  final bool isUpgraded;
  final bool isVerified;
  final UpgradeData? userData;

  UpgradeStatus({
    required this.canUpgrade,
    required this.isUpgraded,
    required this.isVerified,
    this.userData,
  });

  factory UpgradeStatus.fromJson(Map<String, dynamic> json) {
    return UpgradeStatus(
      canUpgrade: json['canUpgrade'] ?? false,
      isUpgraded: json['isUpgraded'] ?? false,
      isVerified: json['isVerified'] ?? false,
      userData: json['user'] != null ? UpgradeData.fromJson(json['user']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'canUpgrade': canUpgrade,
      'isUpgraded': isUpgraded,
      'isVerified': isVerified,
      'user': userData?.toJson(),
    };
  }
}

/// Model for organizer type information
class OrganizerType {
  final String value;
  final String label;
  final String description;
  final String icon;
  final List<String> requiredFields;
  final List<String> optionalFields;

  OrganizerType({
    required this.value,
    required this.label,
    required this.description,
    required this.icon,
    required this.requiredFields,
    required this.optionalFields,
  });

  factory OrganizerType.fromJson(Map<String, dynamic> json) {
    return OrganizerType(
      value: json['value'] ?? '',
      label: json['label'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? 'person',
      requiredFields: List<String>.from(json['requiredFields'] ?? []),
      optionalFields: List<String>.from(json['optionalFields'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'value': value,
      'label': label,
      'description': description,
      'icon': icon,
      'requiredFields': requiredFields,
      'optionalFields': optionalFields,
    };
  }
}

/// Model for upgrade validation result
class UpgradeValidation {
  final bool isValid;
  final List<String> errors;

  UpgradeValidation({
    required this.isValid,
    required this.errors,
  });

  factory UpgradeValidation.fromJson(Map<String, dynamic> json) {
    return UpgradeValidation(
      isValid: json['isValid'] ?? false,
      errors: List<String>.from(json['errors'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isValid': isValid,
      'errors': errors,
    };
  }
}
