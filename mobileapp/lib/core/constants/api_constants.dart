class ApiConstants {
  // Base URL - Local Development
  // LOCAL DEVELOPMENT - Android Emulator uses 10.0.2.2 to access host's localhost
  // Untuk device fisik, gunakan IP komputer (misalnya: 192.168.x.x:5002)
  // NOTE: Backend runs on port 5002 (not 5000) because port 5000 is used by macOS AirPlay
  static const String baseUrl = 'http://10.0.2.2:5002/api';
  static const String fileBaseUrl = 'http://10.0.2.2:5002';
  
  // Authentication endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String registerOrganizer = '/auth/register-organizer';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendOtp = '/auth/resend-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  
  // Event endpoints
  static const String events = '/events';
  static const String eventById = '/events/';
  static const String registerEvent = '/events/';
  static const String createEvent = '/events';
  static const String updateEvent = '/events/organizer/';
  static const String publishEvent = '/events/organizer/';
  static const String checkIn = '/events/organizer/check-in';
  static const String scanQr = '/events/scan-qr';
  static const String attendance = '/events/organizer/attendance/';
  static const String myRegistrations = '/events/my/registrations';
  static const String organizerEvents = '/events/organizer';
  static const String organizerEventById = '/events/organizer/';
  static const String exportAttendance = '/events/organizer/export/attendance/';
  static const String exportRegistrations = '/events/organizer/export/registrations/';
  
  // Ticket endpoints
  static const String tickets = '/tickets';
  static const String myTickets = '/tickets';
  
  // Payment endpoints
  static const String payments = '/payments';
  static const String createPayment = '/payments/create';
  static const String paymentCallback = '/payments/callback';
  static const String paymentStatus = '/payments/';
  
  // Certificate endpoints
  static const String certificates = '/certificates';
  static const String generateCertificate = '/certificates/generate';
  static const String verifyCertificate = '/certificates/verify';
  
  // Profile endpoints
  static const String profile = '/profile';
  static const String updateProfile = '/profile/update';
  
  // Upload endpoints
  static const String upload = '/upload';
  static const String uploadImage = '/upload/single';
  static const String uploadMultiple = '/upload/multiple';
  
  // Organizer endpoints
  static const String organizers = '/organizers';
  static const String organizerDashboard = '/organizers/';
  
  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Timeout
  static const int timeoutDuration = 60; // seconds - increased for better connectivity
}

