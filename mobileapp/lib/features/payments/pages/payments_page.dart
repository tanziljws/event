import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/bottom_navigation.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../bloc/payment_bloc.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  @override
  void initState() {
    super.initState();
    // Load payment history when page loads
    context.read<PaymentBloc>().add(PaymentGetHistory());
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is! AuthAuthenticated) {
          return const Scaffold(
            body: Center(child: Text('Please login first')),
          );
        }

        return Scaffold(
          backgroundColor: AppConstants.backgroundColor,
          appBar: AppBar(
            title: const Text('Pembayaran Saya'),
            backgroundColor: AppConstants.cardColor,
            foregroundColor: AppConstants.textPrimary,
            elevation: 0,
          ),
          body: BlocBuilder<PaymentBloc, PaymentState>(
            builder: (context, state) {
              if (state is PaymentLoading) {
                return const Center(child: CircularProgressIndicator());
              } else if (state is PaymentHistoryLoaded) {
                return _buildPaymentsList(state.payments);
              } else if (state is PaymentFailed) {
                return _buildErrorState(state.error);
              } else {
                return _buildEmptyState();
              }
            },
          ),
          bottomNavigationBar: const BottomNavigation(currentIndex: 4),
        );
      },
    );
  }

  Widget _buildPaymentsList(List<Map<String, dynamic>> payments) {

    if (payments.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      itemBuilder: (context, index) {
        final payment = payments[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 2,
          color: AppConstants.cardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: AppConstants.borderLight),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getStatusColor(payment['paymentStatus'] as String? ?? 'UNKNOWN').withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getStatusIcon(payment['paymentStatus'] as String? ?? 'UNKNOWN'),
                        color: _getStatusColor(payment['paymentStatus'] as String? ?? 'UNKNOWN'),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            payment['eventTitle'] as String? ?? 'Event',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppConstants.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Rp ${_formatPrice((payment['amount'] as num?)?.toInt() ?? 0)}',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: AppConstants.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(payment['paymentStatus'] as String? ?? 'UNKNOWN').withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getStatusText(payment['paymentStatus'] as String? ?? 'UNKNOWN'),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: _getStatusColor(payment['paymentStatus'] as String? ?? 'UNKNOWN'),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.payment,
                      size: 16,
                      color: AppConstants.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      payment['paymentMethod'] as String? ?? 'Midtrans',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.textMuted,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.confirmation_number,
                      size: 16,
                      color: AppConstants.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      payment['paymentReference'] as String? ?? payment['id'] as String? ?? 'N/A',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.textMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: AppConstants.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(_parseDate(payment['createdAt'] ?? payment['paymentDate'])),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.textMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _viewPaymentDetails(payment),
                        child: const Text('Detail'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (payment['paymentStatus'] == 'PAID')
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _downloadReceipt(payment),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.successColor,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Download'),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.payment,
            size: 80,
            color: AppConstants.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'Belum ada pembayaran',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Daftar ke event untuk melihat riwayat pembayaran',
            style: TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.go('/events'),
            icon: const Icon(Icons.event),
            label: const Text('Lihat Events'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return AppConstants.successColor;
      case 'PENDING':
        return AppConstants.warningColor;
      case 'FAILED':
      case 'EXPIRED':
        return AppConstants.errorColor;
      default:
        return AppConstants.textMuted;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return Icons.check_circle;
      case 'PENDING':
        return Icons.pending;
      case 'FAILED':
      case 'EXPIRED':
        return Icons.error;
      default:
        return Icons.payment;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'Berhasil';
      case 'PENDING':
        return 'Diproses';
      case 'FAILED':
        return 'Gagal';
      case 'EXPIRED':
        return 'Kedaluwarsa';
      default:
        return status;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
  
  DateTime _parseDate(dynamic date) {
    if (date is DateTime) return date;
    if (date is String) {
      try {
        return DateTime.parse(date);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }
  
  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: AppConstants.errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Gagal memuat data',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              context.read<PaymentBloc>().add(PaymentGetHistory());
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Coba Lagi'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _viewPaymentDetails(Map<String, dynamic> payment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text(payment['eventTitle'] as String? ?? 'Event'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Status: ${_getStatusText(payment['paymentStatus'] as String? ?? 'UNKNOWN')}'),
            Text('Jumlah: Rp ${_formatPrice((payment['amount'] as num?)?.toInt() ?? 0)}'),
            Text('Metode: ${payment['paymentMethod'] as String? ?? 'Midtrans'}'),
            Text('ID Transaksi: ${payment['paymentReference'] as String? ?? payment['id'] as String? ?? 'N/A'}'),
            Text('Tanggal: ${_formatDate(_parseDate(payment['createdAt'] ?? payment['paymentDate']))}'),
            if (payment['paidAt'] != null)
              Text('Dibayar: ${_formatDate(_parseDate(payment['paidAt']))}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tutup'),
          ),
        ],
      ),
    );
  }

  void _downloadReceipt(Map<String, dynamic> payment) {
    // Implement receipt download
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Mengunduh bukti pembayaran ${payment['eventTitle'] ?? 'event'}'),
        backgroundColor: AppConstants.successColor,
      ),
    );
  }
}