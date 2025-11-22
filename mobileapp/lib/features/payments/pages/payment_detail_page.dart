import 'package:flutter/material.dart';

class PaymentDetailPage extends StatelessWidget {
  final String paymentId;

  const PaymentDetailPage({
    super.key,
    required this.paymentId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Details'),
      ),
      body: const Center(
        child: Text('Payment Detail Page - Coming Soon'),
      ),
    );
  }
}

