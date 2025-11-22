import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

class ErrorHandler {
  static void handleError(dynamic error, {String? context}) {
    String message = 'An unexpected error occurred';
    String type = 'Unknown';

    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          message = 'Connection timeout. Please check your internet connection.';
          type = 'Connection Timeout';
          break;
        case DioExceptionType.sendTimeout:
          message = 'Request timeout. Please try again.';
          type = 'Send Timeout';
          break;
        case DioExceptionType.receiveTimeout:
          message = 'Response timeout. Please try again.';
          type = 'Receive Timeout';
          break;
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          if (statusCode == 401) {
            message = 'Unauthorized. Please login again.';
            type = 'Unauthorized';
          } else if (statusCode == 403) {
            message = 'Access forbidden. You don\'t have permission.';
            type = 'Forbidden';
          } else if (statusCode == 404) {
            message = 'Resource not found.';
            type = 'Not Found';
          } else if (statusCode == 500) {
            message = 'Server error. Please try again later.';
            type = 'Server Error';
          } else {
            message = 'Server error (${statusCode}). Please try again.';
            type = 'Server Error';
          }
          break;
        case DioExceptionType.cancel:
          message = 'Request was cancelled.';
          type = 'Cancelled';
          break;
        case DioExceptionType.connectionError:
          message = 'No internet connection. Please check your network.';
          type = 'Connection Error';
          break;
        case DioExceptionType.badCertificate:
          message = 'Certificate error. Please try again.';
          type = 'Certificate Error';
          break;
        case DioExceptionType.unknown:
          message = 'Network error. Please check your connection.';
          type = 'Network Error';
          break;
      }
    } else if (error is FormatException) {
      message = 'Data format error. Please try again.';
      type = 'Format Error';
    } else if (error is TypeError) {
      message = 'Data type error. Please try again.';
      type = 'Type Error';
    } else if (error is Exception) {
      message = error.toString();
      type = 'Exception';
    }

    // Log error with context
    final logMessage = context != null ? '[$context] $type: $message' : '$type: $message';
    print('❌ ERROR: $logMessage');
    
    // You can also send to crash reporting service here
    // Crashlytics.recordError(error, stackTrace);
  }

  static void showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  static void showErrorDialog(BuildContext context, String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return 'Connection timeout';
        case DioExceptionType.sendTimeout:
          return 'Request timeout';
        case DioExceptionType.receiveTimeout:
          return 'Response timeout';
        case DioExceptionType.badResponse:
          return 'Server error';
        case DioExceptionType.cancel:
          return 'Request cancelled';
        case DioExceptionType.connectionError:
          return 'No internet connection';
        case DioExceptionType.badCertificate:
          return 'Certificate error';
        case DioExceptionType.unknown:
          return 'Network error';
      }
    }
    return 'An unexpected error occurred';
  }
}
