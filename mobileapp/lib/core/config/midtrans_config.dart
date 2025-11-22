class MidtransConfig {
  // Sandbox Configuration
  // NOTE: Use environment variables or secure storage for production
  // These are placeholder values - replace with actual keys from environment
  static const String serverKey = 'YOUR_MIDTRANS_SERVER_KEY';
  static const String clientKey = 'YOUR_MIDTRANS_CLIENT_KEY';
  
  // Merchant ID
  static const String merchantId = 'G043146849';
  
  // Production Configuration (uncomment when ready for production)
  // static const String serverKey = 'Mid-server-your-production-server-key';
  // static const String clientKey = 'Mid-client-your-production-client-key';
  
  // Environment
  static const bool isProduction = false; // Set to true for production
  
  // Payment Methods
  static const List<String> enabledPaymentMethods = [
    'credit_card',
    'bca_va',
    'bni_va',
    'bri_va',
    'mandiri_va',
    'permata_va',
    'gopay',
    'shopeepay',
    'qris',
  ];
  
  // Currency
  static const String currency = 'IDR';
  
  // Callback URLs
  static const String finishUrl = 'https://nusa-event.com/payment/finish';
  static const String unfinishUrl = 'https://nusa-event.com/payment/unfinish';
  static const String errorUrl = 'https://nusa-event.com/payment/error';
}
