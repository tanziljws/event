import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PaymentTestPage extends StatelessWidget {
  const PaymentTestPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Test'),
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Midtrans Payment Testing',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Test payment integration with Midtrans sandbox',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            
            // Test Payment Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _navigateToPayment(context),
                icon: const Icon(Icons.payment),
                label: const Text('Test Payment'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Test Information
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info, color: Colors.blue[600], size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Test Information',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue[800],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildTestInfo('Merchant ID', 'G043146849'),
                  _buildTestInfo('Environment', 'Sandbox'),
                  _buildTestInfo('Test Amount', 'Rp 100,000'),
                  const SizedBox(height: 12),
                  Text(
                    'Use test cards for sandbox testing:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.blue[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildTestCard('Visa', '4811 1111 1111 1114'),
                  _buildTestCard('Mastercard', '5211 1111 1111 1117'),
                  _buildTestCard('JCB', '3528 0000 0000 0007'),
                  const SizedBox(height: 8),
                  Text(
                    'CVV: 123 | Expiry: Any future date | OTP: 123456',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTestInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.blue[700],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.blue[800],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTestCard(String type, String number) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(
              type,
              style: TextStyle(
                fontSize: 12,
                color: Colors.blue[600],
              ),
            ),
          ),
          Text(
            number,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.blue[800],
            ),
          ),
        ],
      ),
    );
  }
  
  void _navigateToPayment(BuildContext context) {
    context.go('/payment?' + Uri(queryParameters: {
      'eventId': 'test-event-123',
      'eventTitle': 'Test Event Registration',
      'amount': '100000',
      'customerName': 'Test Customer',
      'customerEmail': 'test@example.com',
      'customerPhone': '08123456789',
    }).query);
  }
}
