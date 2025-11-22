import 'package:flutter/material.dart';

class AppConstants {
  // App Info
  static const String appName = 'Nusa';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String isLoggedInKey = 'is_logged_in';
  static const String userRoleKey = 'user_role';
  
  // User Roles
  static const String roleParticipant = 'PARTICIPANT';
  static const String roleOrganizer = 'ORGANIZER';
  static const String roleAdmin = 'ADMIN';
  static const String roleOpsHead = 'OPS_HEAD';
  static const String roleOpsAgent = 'OPS_AGENT';
  
  // Organizer Types
  static const String organizerIndividual = 'INDIVIDUAL';
  static const String organizerCommunity = 'COMMUNITY';
  static const String organizerSmallBusiness = 'SMALL_BUSINESS';
  static const String organizerInstitution = 'INSTITUTION';
  
  // Event Categories
  static const String categoryTechnology = 'TECHNOLOGY';
  static const String categoryAcademic = 'ACADEMIC';
  static const String categorySports = 'SPORTS';
  static const String categoryArts = 'ARTS';
  static const String categoryCulture = 'CULTURE';
  static const String categoryBusiness = 'BUSINESS';
  static const String categoryHealth = 'HEALTH';
  static const String categoryEducation = 'EDUCATION';
  static const String categoryEntertainment = 'ENTERTAINMENT';
  static const String categoryOther = 'OTHER';
  
  // Event Status
  static const String statusDraft = 'DRAFT';
  static const String statusUnderReview = 'UNDER_REVIEW';
  static const String statusApproved = 'APPROVED';
  static const String statusPublished = 'PUBLISHED';
  static const String statusRejected = 'REJECTED';
  static const String statusCompleted = 'COMPLETED';
  static const String statusCancelled = 'CANCELLED';
  
  // Payment Methods
  static const String paymentBankTransfer = 'BANK_TRANSFER';
  static const String paymentEWallet = 'E_WALLET';
  static const String paymentCreditCard = 'CREDIT_CARD';
  static const String paymentQrCode = 'QR_CODE';
  static const String paymentCash = 'CASH';
  static const String paymentCrypto = 'CRYPTO';
  
  // Payment Status
  static const String paymentPending = 'PENDING';
  static const String paymentPaid = 'PAID';
  static const String paymentFailed = 'FAILED';
  static const String paymentExpired = 'EXPIRED';
  static const String paymentRefunded = 'REFUNDED';
  
  // Registration Status
  static const String registrationActive = 'ACTIVE';
  static const String registrationCancelled = 'CANCELLED';
  static const String registrationRefunded = 'REFUNDED';
  static const String registrationCompleted = 'COMPLETED';
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 50;
  static const int minNameLength = 2;
  static const int maxNameLength = 100;
  static const int maxDescriptionLength = 1000;
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double borderRadius = 12.0;
  static const double smallBorderRadius = 8.0;
  
  // Colors (Matching Web Frontend)
  static const primaryColor = Color(0xFF2563EB); // Blue-600
  static const secondaryColor = Color(0xFF10B981); // Emerald-500
  static const accentColor = Color(0xFFF59E0B); // Amber-500
  static const errorColor = Color(0xFFEF4444); // Red-500
  static const successColor = Color(0xFF10B981); // Emerald-500
  static const warningColor = Color(0xFFF59E0B); // Amber-500
  static const infoColor = Color(0xFF2563EB); // Blue-600
  
  // Background Colors
  static const backgroundColor = Color(0xFFFFFFFF); // White
  static const surfaceColor = Color(0xFFF8FAFC); // Slate-50
  static const cardColor = Color(0xFFFFFFFF); // White
  static const cardBackground = Color(0xFFFFFFFF); // White
  
  // Text Colors
  static const textPrimary = Color(0xFF1F2937); // Gray-800
  static const textSecondary = Color(0xFF6B7280); // Gray-500
  static const textMuted = Color(0xFF9CA3AF); // Gray-400
  
  // Border Colors
  static const borderColor = Color(0xFFE5E7EB); // Gray-200
  static const borderLight = Color(0xFFF3F4F6); // Gray-100
  
  // Animation Duration
  static const int shortAnimationDuration = 200;
  static const int mediumAnimationDuration = 300;
  static const int longAnimationDuration = 500;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // File Upload
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  
  // File Base URL
  // NOTE: Backend runs on port 5002 (not 5000) because port 5000 is used by macOS AirPlay
  static const String fileBaseUrl = 'http://10.0.2.2:5002';
}

