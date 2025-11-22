import 'package:dio/dio.dart';
import '../../core/network/network_config.dart';
import '../../core/network/api_client.dart';

class PaymentService {
  // Use ApiClient which has AuthInterceptor built-in
  static final ApiClient _apiClient = ApiClient();
  static Dio get _dio => _apiClient.dio;
  
  // Initialize Midtrans SDK
  static Future<void> initializeMidtrans() async {
    try {
      print('🔄 Initializing Midtrans SDK...');
      
      // Initialize ApiClient if not already initialized
      _apiClient.initialize();
      
      print('✅ Midtrans SDK initialized successfully');
    } catch (e) {
      print('❌ Failed to initialize Midtrans: $e');
      throw Exception('Failed to initialize Midtrans: $e');
    }
  }
  
  // Create Payment Order
  static Future<Map<String, dynamic>> createPaymentOrder({
    required String eventId,
    required String eventTitle,
    required double amount,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
    int? quantity,
    String? ticketTypeId,
  }) async {
    try {
      final url = '${NetworkConfig.baseUrl}/payments/create-order';
      
      print('🎯 Payment API URL: $url');
      print('🎫 Ticket Type ID: $ticketTypeId');
      print('🎫 Quantity: $quantity');
      
      // ApiClient will automatically add auth token via AuthInterceptor
      final requestData = {
        'eventId': eventId,
        'eventTitle': eventTitle,
        'amount': amount,
        if (quantity != null) 'quantity': quantity,
        if (ticketTypeId != null && ticketTypeId.isNotEmpty) 'ticketTypeId': ticketTypeId,
        'customerName': customerName,
        'customerEmail': customerEmail,
        'customerPhone': customerPhone,
        'paymentMethod': 'midtrans',
      };
      
      print('📦 Payment Request Data: $requestData');
      
      final response = await _dio.post(
        url,
        data: requestData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      
      print('✅ Payment Response Status: ${response.statusCode}');
      print('✅ Payment Response Data: ${response.data}');
      
      if (response.statusCode == 200) {
        print('✅✅✅ Payment order created successfully!');
        return response.data;
      } else {
        print('❌ Payment failed with status: ${response.statusCode}');
        throw Exception('Failed to create payment order: ${response.statusMessage}');
      }
    } catch (e) {
      print('❌❌❌ createPaymentOrder exception: $e');
      print('❌ Exception type: ${e.runtimeType}');
      if (e is DioException) {
        print('❌ DioException type: ${e.type}');
        print('❌ DioException message: ${e.message}');
        print('❌ DioException response: ${e.response?.data}');
      }
      throw Exception('Error creating payment order: $e');
    }
  }
  
  // Process Payment with Midtrans
  static Future<Map<String, dynamic>> processPayment({
    required String orderId,
    required double amount,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
  }) async {
    try {
      print('🔄 Processing payment for order: $orderId');
      
      final url = '${NetworkConfig.baseUrl}/payments/process';
      
      // ApiClient will automatically add auth token via AuthInterceptor
      final response = await _dio.post(
        url,
        data: {
          'orderId': orderId,
          'amount': amount,
          'customerName': customerName,
          'customerEmail': customerEmail,
          'customerPhone': customerPhone,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        print('✅ Payment processed successfully');
        return response.data;
      } else {
        throw Exception('Failed to process payment: ${response.statusMessage}');
      }
    } catch (e) {
      print('❌ Error processing payment: $e');
      throw Exception('Error processing payment: $e');
    }
  }
  
  // Check Payment Status
  static Future<Map<String, dynamic>> checkPaymentStatus(String orderId) async {
    try {
      print('🔍 Checking payment status for: $orderId');
      
      final url = '${NetworkConfig.baseUrl}/payments/status/$orderId';
      print('🎯 Payment Status URL: $url');
      
      // ApiClient will automatically add auth token via AuthInterceptor
      final response = await _dio.get(
        url,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      
      print('✅ Payment Status Response: ${response.statusCode}');
      print('✅ Payment Status Data: ${response.data}');
      if (response.statusCode == 200) {
        print('✅ Payment status retrieved successfully');
        return response.data;
      } else {
        print('❌ Payment status check failed: ${response.statusCode}');
        print('❌ Response data: ${response.data}');
        throw Exception('Failed to check payment status: ${response.statusMessage}');
      }
    } catch (e) {
      print('❌❌❌ checkPaymentStatus exception: $e');
      if (e is DioException) {
        print('❌ DioException response data: ${e.response?.data}');
        print('❌ DioException response: ${e.response}');
      }
      throw Exception('Error checking payment status: $e');
    }
  }
  
  // Get Payment History
  static Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    try {
      // ApiClient will automatically add auth token via AuthInterceptor
      final response = await _dio.get(
        '${NetworkConfig.baseUrl}/payments/history',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
      } else {
        throw Exception('Failed to get payment history: ${response.statusMessage}');
      }
    } catch (e) {
      throw Exception('Error getting payment history: $e');
    }
  }
  
  // Create Event Payment (for compatibility with existing code)
  static Future<Map<String, dynamic>> createEventPayment({
    required String eventId,
    required double amount,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
    int? quantity,
    String? ticketTypeId,
  }) async {
    print('🔵 PaymentService.createEventPayment called');
    print('🔵 Event ID: $eventId');
    print('🔵 Amount: $amount');
    print('🔵 Quantity: $quantity');
    print('🔵 Ticket Type ID: $ticketTypeId');
    
    try {
      final result = await createPaymentOrder(
        eventId: eventId,
        eventTitle: 'Event Registration',
        amount: amount,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        quantity: quantity,
        ticketTypeId: ticketTypeId,
      );
      print('✅ PaymentService.createEventPayment result: $result');
      return result;
    } catch (e) {
      print('❌❌❌ PaymentService.createEventPayment error: $e');
      rethrow;
    }
  }
  
  // Get Payment Status (for compatibility with existing code)
  static Future<Map<String, dynamic>> getPaymentStatus(String paymentId) async {
    return await checkPaymentStatus(paymentId);
  }
}