class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phoneNumber;
  final String? address;
  final String? lastEducation;
  final String role;
  final String? department;
  final String? userPosition;
  final String? managerId;
  final String? employeeId;
  final bool emailVerified;
  final String? verificationToken;
  final DateTime? verificationTokenExpires;
  final String? resetPasswordToken;
  final DateTime? resetPasswordExpires;
  final DateTime? lastActivity;
  final int tokenVersion;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Organizer fields
  final String? organizerType;
  final String? verificationStatus;
  final DateTime? verifiedAt;
  final String? rejectedReason;
  
  // Assignment fields
  final String? assignedTo;
  final DateTime? assignedAt;
  
  // Profile relations
  final IndividualProfile? individualProfile;
  final CommunityProfile? communityProfile;
  final BusinessProfile? businessProfile;
  final InstitutionProfile? institutionProfile;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phoneNumber,
    this.address,
    this.lastEducation,
    required this.role,
    this.department,
    this.userPosition,
    this.managerId,
    this.employeeId,
    required this.emailVerified,
    this.verificationToken,
    this.verificationTokenExpires,
    this.resetPasswordToken,
    this.resetPasswordExpires,
    this.lastActivity,
    required this.tokenVersion,
    required this.createdAt,
    required this.updatedAt,
    this.organizerType,
    this.verificationStatus,
    this.verifiedAt,
    this.rejectedReason,
    this.assignedTo,
    this.assignedAt,
    this.individualProfile,
    this.communityProfile,
    this.businessProfile,
    this.institutionProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString(),
      address: json['address']?.toString(),
      lastEducation: json['lastEducation']?.toString(),
      role: json['role']?.toString() ?? 'PARTICIPANT', // Default to PARTICIPANT
      department: json['department']?.toString(),
      userPosition: json['userPosition']?.toString(),
      managerId: json['managerId']?.toString(),
      employeeId: json['employeeId']?.toString(),
      emailVerified: json['emailVerified'] == true || json['emailVerified'] == 'true',
      verificationToken: json['verificationToken']?.toString(),
      verificationTokenExpires: json['verificationTokenExpires'] != null 
          ? DateTime.parse(json['verificationTokenExpires']) 
          : null,
      resetPasswordToken: json['resetPasswordToken']?.toString(),
      resetPasswordExpires: json['resetPasswordExpires'] != null 
          ? DateTime.parse(json['resetPasswordExpires']) 
          : null,
      lastActivity: json['lastActivity'] != null 
          ? DateTime.parse(json['lastActivity']) 
          : null,
      tokenVersion: json['tokenVersion'] is int ? json['tokenVersion'] : (int.tryParse(json['tokenVersion']?.toString() ?? '0') ?? 0),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
      organizerType: json['organizerType']?.toString(),
      verificationStatus: json['verificationStatus']?.toString(),
      verifiedAt: json['verifiedAt'] != null 
          ? DateTime.parse(json['verifiedAt']) 
          : null,
      rejectedReason: json['rejectedReason']?.toString(),
      assignedTo: json['assignedTo']?.toString(),
      assignedAt: json['assignedAt'] != null 
          ? DateTime.parse(json['assignedAt']) 
          : null,
      individualProfile: json['individualProfile'] != null 
          ? IndividualProfile.fromJson(json['individualProfile']) 
          : null,
      communityProfile: json['communityProfile'] != null 
          ? CommunityProfile.fromJson(json['communityProfile']) 
          : null,
      businessProfile: json['businessProfile'] != null 
          ? BusinessProfile.fromJson(json['businessProfile']) 
          : null,
      institutionProfile: json['institutionProfile'] != null 
          ? InstitutionProfile.fromJson(json['institutionProfile']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
      'address': address,
      'lastEducation': lastEducation,
      'role': role,
      'department': department,
      'userPosition': userPosition,
      'managerId': managerId,
      'employeeId': employeeId,
      'emailVerified': emailVerified,
      'verificationToken': verificationToken,
      'verificationTokenExpires': verificationTokenExpires?.toIso8601String(),
      'resetPasswordToken': resetPasswordToken,
      'resetPasswordExpires': resetPasswordExpires?.toIso8601String(),
      'lastActivity': lastActivity?.toIso8601String(),
      'tokenVersion': tokenVersion,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'organizerType': organizerType,
      'verificationStatus': verificationStatus,
      'verifiedAt': verifiedAt?.toIso8601String(),
      'rejectedReason': rejectedReason,
      'assignedTo': assignedTo,
      'assignedAt': assignedAt?.toIso8601String(),
      'individualProfile': individualProfile?.toJson(),
      'communityProfile': communityProfile?.toJson(),
      'businessProfile': businessProfile?.toJson(),
      'institutionProfile': institutionProfile?.toJson(),
    };
  }

  UserModel copyWith({
    String? id,
    String? fullName,
    String? email,
    String? phoneNumber,
    String? address,
    String? lastEducation,
    String? role,
    String? department,
    String? userPosition,
    String? managerId,
    String? employeeId,
    bool? emailVerified,
    String? verificationToken,
    DateTime? verificationTokenExpires,
    String? resetPasswordToken,
    DateTime? resetPasswordExpires,
    DateTime? lastActivity,
    int? tokenVersion,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? organizerType,
    String? verificationStatus,
    DateTime? verifiedAt,
    String? rejectedReason,
    String? assignedTo,
    DateTime? assignedAt,
    IndividualProfile? individualProfile,
    CommunityProfile? communityProfile,
    BusinessProfile? businessProfile,
    InstitutionProfile? institutionProfile,
  }) {
    return UserModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      address: address ?? this.address,
      lastEducation: lastEducation ?? this.lastEducation,
      role: role ?? this.role,
      department: department ?? this.department,
      userPosition: userPosition ?? this.userPosition,
      managerId: managerId ?? this.managerId,
      employeeId: employeeId ?? this.employeeId,
      emailVerified: emailVerified ?? this.emailVerified,
      verificationToken: verificationToken ?? this.verificationToken,
      verificationTokenExpires: verificationTokenExpires ?? this.verificationTokenExpires,
      resetPasswordToken: resetPasswordToken ?? this.resetPasswordToken,
      resetPasswordExpires: resetPasswordExpires ?? this.resetPasswordExpires,
      lastActivity: lastActivity ?? this.lastActivity,
      tokenVersion: tokenVersion ?? this.tokenVersion,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      organizerType: organizerType ?? this.organizerType,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      rejectedReason: rejectedReason ?? this.rejectedReason,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedAt: assignedAt ?? this.assignedAt,
      individualProfile: individualProfile ?? this.individualProfile,
      communityProfile: communityProfile ?? this.communityProfile,
      businessProfile: businessProfile ?? this.businessProfile,
      institutionProfile: institutionProfile ?? this.institutionProfile,
    );
  }

  bool get isOrganizer => role == 'ORGANIZER';
  bool get isParticipant => role == 'PARTICIPANT';
  bool get isAdmin => ['SUPER_ADMIN', 'CS_HEAD', 'OPS_HEAD', 'FINANCE_HEAD'].contains(role);
  bool get isVerified => emailVerified;
  bool get isOrganizerVerified => verificationStatus == 'APPROVED';
}

// Profile Models
class IndividualProfile {
  final String id;
  final String userId;
  final String? nik;
  final String? personalAddress;
  final String? personalPhone;
  final List<String> portfolio;
  final Map<String, dynamic>? socialMedia;
  final DateTime createdAt;
  final DateTime updatedAt;

  IndividualProfile({
    required this.id,
    required this.userId,
    this.nik,
    this.personalAddress,
    this.personalPhone,
    required this.portfolio,
    this.socialMedia,
    required this.createdAt,
    required this.updatedAt,
  });

  factory IndividualProfile.fromJson(Map<String, dynamic> json) {
    return IndividualProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      nik: json['nik'],
      personalAddress: json['personalAddress'],
      personalPhone: json['personalPhone'],
      portfolio: List<String>.from(json['portfolio'] ?? []),
      socialMedia: json['socialMedia'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'nik': nik,
      'personalAddress': personalAddress,
      'personalPhone': personalPhone,
      'portfolio': portfolio,
      'socialMedia': socialMedia,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class CommunityProfile {
  final String id;
  final String userId;
  final String communityName;
  final String? communityType;
  final String? communityAddress;
  final String? communityPhone;
  final String? contactPerson;
  final String? legalDocument;
  final String? website;
  final Map<String, dynamic>? socialMedia;
  final DateTime createdAt;
  final DateTime updatedAt;

  CommunityProfile({
    required this.id,
    required this.userId,
    required this.communityName,
    this.communityType,
    this.communityAddress,
    this.communityPhone,
    this.contactPerson,
    this.legalDocument,
    this.website,
    this.socialMedia,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CommunityProfile.fromJson(Map<String, dynamic> json) {
    return CommunityProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      communityName: json['communityName'] ?? '',
      communityType: json['communityType'],
      communityAddress: json['communityAddress'],
      communityPhone: json['communityPhone'],
      contactPerson: json['contactPerson'],
      legalDocument: json['legalDocument'],
      website: json['website'],
      socialMedia: json['socialMedia'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'communityName': communityName,
      'communityType': communityType,
      'communityAddress': communityAddress,
      'communityPhone': communityPhone,
      'contactPerson': contactPerson,
      'legalDocument': legalDocument,
      'website': website,
      'socialMedia': socialMedia,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class BusinessProfile {
  final String id;
  final String userId;
  final String businessName;
  final String? businessType;
  final String? businessAddress;
  final String? businessPhone;
  final String? npwp;
  final String? legalDocument;
  final String? logo;
  final Map<String, dynamic>? socialMedia;
  final List<String> portfolio;
  final DateTime createdAt;
  final DateTime updatedAt;

  BusinessProfile({
    required this.id,
    required this.userId,
    required this.businessName,
    this.businessType,
    this.businessAddress,
    this.businessPhone,
    this.npwp,
    this.legalDocument,
    this.logo,
    this.socialMedia,
    required this.portfolio,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BusinessProfile.fromJson(Map<String, dynamic> json) {
    return BusinessProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      businessName: json['businessName'] ?? '',
      businessType: json['businessType'],
      businessAddress: json['businessAddress'],
      businessPhone: json['businessPhone'],
      npwp: json['npwp'],
      legalDocument: json['legalDocument'],
      logo: json['logo'],
      socialMedia: json['socialMedia'],
      portfolio: List<String>.from(json['portfolio'] ?? []),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'businessName': businessName,
      'businessType': businessType,
      'businessAddress': businessAddress,
      'businessPhone': businessPhone,
      'npwp': npwp,
      'legalDocument': legalDocument,
      'logo': logo,
      'socialMedia': socialMedia,
      'portfolio': portfolio,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class InstitutionProfile {
  final String id;
  final String userId;
  final String institutionName;
  final String? institutionType;
  final String? institutionAddress;
  final String? institutionPhone;
  final String? contactPerson;
  final String? akta;
  final String? siup;
  final String? website;
  final Map<String, dynamic>? socialMedia;
  final DateTime createdAt;
  final DateTime updatedAt;

  InstitutionProfile({
    required this.id,
    required this.userId,
    required this.institutionName,
    this.institutionType,
    this.institutionAddress,
    this.institutionPhone,
    this.contactPerson,
    this.akta,
    this.siup,
    this.website,
    this.socialMedia,
    required this.createdAt,
    required this.updatedAt,
  });

  factory InstitutionProfile.fromJson(Map<String, dynamic> json) {
    return InstitutionProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      institutionName: json['institutionName'] ?? '',
      institutionType: json['institutionType'],
      institutionAddress: json['institutionAddress'],
      institutionPhone: json['institutionPhone'],
      contactPerson: json['contactPerson'],
      akta: json['akta'],
      siup: json['siup'],
      website: json['website'],
      socialMedia: json['socialMedia'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'institutionName': institutionName,
      'institutionType': institutionType,
      'institutionAddress': institutionAddress,
      'institutionPhone': institutionPhone,
      'contactPerson': contactPerson,
      'akta': akta,
      'siup': siup,
      'website': website,
      'socialMedia': socialMedia,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

