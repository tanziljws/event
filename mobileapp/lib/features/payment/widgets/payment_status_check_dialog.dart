import 'package:flutter/material.dart';
import '../../../shared/services/payment_service.dart';

class PaymentStatusCheckDialog extends StatefulWidget {
  final String paymentId;
  final VoidCallback onPaymentConfirmed;
  final VoidCallback onPaymentFailed;

  const PaymentStatusCheckDialog({
    super.key,
    required this.paymentId,
    required this.onPaymentConfirmed,
    required this.onPaymentFailed,
  });

  @override
  State<PaymentStatusCheckDialog> createState() => _PaymentStatusCheckDialogState();
}

class _PaymentStatusCheckDialogState extends State<PaymentStatusCheckDialog> {
  final PaymentService _paymentService = PaymentService();
  bool _isChecking = false;
  String _status = 'Checking payment status...';

  @override
  void initState() {
    super.initState();
    _checkPaymentStatus();
  }

  Future<void> _checkPaymentStatus() async {
    setState(() {
      _isChecking = true;
    });

    try {
      final response = await PaymentService.getPaymentStatus(widget.paymentId);
      
      if (response['success'] == true) {
        final payment = response['payment'];
        final paymentStatus = payment['paymentStatus'];
        
        if (paymentStatus == 'PAID') {
          setState(() {
            _status = 'Payment confirmed! ✅';
            _isChecking = false;
          });
          
          // Wait a moment then call success callback
          await Future.delayed(const Duration(seconds: 1));
          widget.onPaymentConfirmed();
        } else if (paymentStatus == 'FAILED' || paymentStatus == 'EXPIRED') {
          setState(() {
            _status = 'Payment failed ❌';
            _isChecking = false;
          });
          
          // Wait a moment then call failed callback
          await Future.delayed(const Duration(seconds: 1));
          widget.onPaymentFailed();
        } else {
          // DEV MODE: Auto-complete payment after 2 seconds if still pending
          setState(() {
            _status = 'Payment pending... Auto-completing (Dev Mode)';
          });
          
          await Future.delayed(const Duration(seconds: 2));
          
          // Auto-complete payment in development
          print('🟠 DEV MODE: Auto-completing payment');
          widget.onPaymentConfirmed();
        }
      } else {
        setState(() {
          _status = 'Error checking payment status';
          _isChecking = false;
        });
      }
    } catch (e) {
      setState(() {
        _status = 'Error: $e';
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Payment Status'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_isChecking) ...[
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
          ],
          Text(_status),
          const SizedBox(height: 16),
          const Text(
            'Please complete your payment in the external app, then return here.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isChecking ? null : () {
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),
        // Dev mode: Skip payment button
        TextButton(
          onPressed: () {
            // Bypass payment for development
            widget.onPaymentConfirmed();
          },
          style: TextButton.styleFrom(
            foregroundColor: Colors.orange,
          ),
          child: const Text('Skip Payment (Dev)'),
        ),
        if (!_isChecking)
          TextButton(
            onPressed: _checkPaymentStatus,
            child: const Text('Check Again'),
          ),
      ],
    );
  }
}
