import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/services/payment_service.dart';
import '../../../shared/services/event_service.dart';

class PaymentModal extends StatefulWidget {
  final String eventId;
  final String eventTitle;
  final double amount;
  final VoidCallback onPaymentSuccess;

  const PaymentModal({
    super.key,
    required this.eventId,
    required this.eventTitle,
    required this.amount,
    required this.onPaymentSuccess,
  });

  @override
  State<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<PaymentModal> {
  final PaymentService _paymentService = PaymentService();
  final EventService _eventService = EventService();
  bool _isLoading = false;
  String _selectedPaymentMethod = 'QR_CODE';
  String? _paymentUrl;
  String? _qrCodeUrl;
  String? _currentPaymentId;

  final List<Map<String, dynamic>> _paymentMethods = [
    {
      'id': 'QR_CODE',
      'name': 'QR Code',
      'description': 'Scan QR code to pay',
      'icon': Icons.qr_code,
    },
    {
      'id': 'BANK_TRANSFER',
      'name': 'Bank Transfer',
      'description': 'Transfer to bank account',
      'icon': Icons.account_balance,
    },
    {
      'id': 'E_WALLET',
      'name': 'E-Wallet',
      'description': 'Pay with digital wallet',
      'icon': Icons.account_balance_wallet,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  'Payment Required',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.eventTitle,
                  style: TextStyle(
                    fontSize: 16,
                    color: AppConstants.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppConstants.primaryColor.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.attach_money,
                        color: AppConstants.primaryColor,
                        size: 24,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Rp ${_formatCurrency(widget.amount)}',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Payment methods
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Choose Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Payment method list
                  Expanded(
                    child: ListView.builder(
                      itemCount: _paymentMethods.length,
                      itemBuilder: (context, index) {
                        final method = _paymentMethods[index];
                        final isSelected = _selectedPaymentMethod == method['id'];
                        
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedPaymentMethod = method['id'];
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected 
                                  ? AppConstants.primaryColor.withOpacity(0.1)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected 
                                    ? AppConstants.primaryColor
                                    : Colors.grey[300]!,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  method['icon'],
                                  color: isSelected 
                                      ? AppConstants.primaryColor
                                      : Colors.grey[600],
                                  size: 24,
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        method['name'],
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected 
                                              ? AppConstants.primaryColor
                                              : AppConstants.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        method['description'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: AppConstants.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  Icon(
                                    Icons.check_circle,
                                    color: AppConstants.primaryColor,
                                    size: 24,
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  
                  // Pay button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handlePayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Pay Now',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handlePayment() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Create payment
      final response = await _paymentService.createEventPayment(
        eventId: widget.eventId,
        amount: widget.amount,
        customerName: widget.customerName,
        customerEmail: widget.customerEmail,
        customerPhone: widget.customerPhone,
        paymentMethod: _selectedPaymentMethod,
      );

      if (response['success'] == true) {
        final payment = response['payment'];
        _currentPaymentId = payment['id'];
        
        if (_selectedPaymentMethod == 'QR_CODE') {
          // Show QR code for payment
          await _showQRCodePayment(payment);
        } else {
          // Show payment URL for other methods
          await _showPaymentUrl(payment);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response['message'] ?? 'Payment creation failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _showQRCodePayment(Map<String, dynamic> payment) async {
    await showDialog(
      context: context,
      builder: (context) => QRCodePaymentDialog(
        payment: payment,
        onPaymentSuccess: () {
          Navigator.of(context).pop(); // Close QR dialog
          Navigator.of(context).pop(); // Close payment modal
          widget.onPaymentSuccess();
        },
      ),
    );
  }

  Future<void> _showPaymentUrl(Map<String, dynamic> payment) async {
    await showDialog(
      context: context,
      builder: (context) => PaymentUrlDialog(
        payment: payment,
        onPaymentSuccess: () {
          Navigator.of(context).pop(); // Close URL dialog
          Navigator.of(context).pop(); // Close payment modal
          widget.onPaymentSuccess();
        },
      ),
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}

class QRCodePaymentDialog extends StatefulWidget {
  final Map<String, dynamic> payment;
  final VoidCallback onPaymentSuccess;

  const QRCodePaymentDialog({
    super.key,
    required this.payment,
    required this.onPaymentSuccess,
  });

  @override
  State<QRCodePaymentDialog> createState() => _QRCodePaymentDialogState();
}

class _QRCodePaymentDialogState extends State<QRCodePaymentDialog> {
  bool _isCheckingPayment = false;
  final PaymentService _paymentService = PaymentService();
  final EventService _eventService = EventService();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Scan QR Code to Pay',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            
            // QR Code placeholder
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: widget.payment['qrCodeUrl'] != null
                  ? Image.network(
                      widget.payment['qrCodeUrl'],
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(
                          child: Icon(
                            Icons.qr_code,
                            size: 100,
                            color: Colors.grey,
                          ),
                        );
                      },
                    )
                  : const Center(
                      child: Icon(
                        Icons.qr_code,
                        size: 100,
                        color: Colors.grey,
                      ),
                    ),
            ),
            
            const SizedBox(height: 20),
            
            Text(
              'Amount: Rp ${_formatCurrency(widget.payment['amount'])}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            
            const SizedBox(height: 20),
            
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isCheckingPayment ? null : _checkPaymentStatus,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                    child: _isCheckingPayment
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Check Payment'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _checkPaymentStatus() async {
    setState(() {
      _isCheckingPayment = true;
    });

    try {
      // TODO: Implement payment status check
      // For now, simulate success after 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: Colors.green,
          ),
        );
        widget.onPaymentSuccess();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment check failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCheckingPayment = false;
        });
      }
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}

class PaymentUrlDialog extends StatefulWidget {
  final Map<String, dynamic> payment;
  final VoidCallback onPaymentSuccess;

  const PaymentUrlDialog({
    super.key,
    required this.payment,
    required this.onPaymentSuccess,
  });

  @override
  State<PaymentUrlDialog> createState() => _PaymentUrlDialogState();
}

class _PaymentUrlDialogState extends State<PaymentUrlDialog> {
  bool _isCheckingPayment = false;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Complete Payment',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            
            Text(
              'Amount: Rp ${_formatCurrency(widget.payment['amount'])}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            
            const SizedBox(height: 20),
            
            Text(
              'Please complete your payment using the selected method.',
              style: TextStyle(
                fontSize: 14,
                color: AppConstants.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 20),
            
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isCheckingPayment ? null : _checkPaymentStatus,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                    child: _isCheckingPayment
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Check Payment'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _checkPaymentStatus() async {
    setState(() {
      _isCheckingPayment = true;
    });

    try {
      // TODO: Implement payment status check
      // For now, simulate success after 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: Colors.green,
          ),
        );
        widget.onPaymentSuccess();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment check failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCheckingPayment = false;
        });
      }
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}
