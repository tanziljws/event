import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../features/auth/bloc/auth_bloc.dart';

class NotificationSummaryCard extends StatelessWidget {
  final String userRole;

  const NotificationSummaryCard({
    super.key,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    // Check if user is actually an approved organizer
    bool isApprovedOrganizer = userRole == 'ORGANIZER' && 
        context.read<AuthBloc>().state is AuthAuthenticated &&
        (context.read<AuthBloc>().state as AuthAuthenticated).user.verificationStatus == 'APPROVED';
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            isApprovedOrganizer ? Icons.business : Icons.event,
            color: const Color(0xFF2563EB),
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            isApprovedOrganizer ? 'Notifikasi Organizer' : 'Notifikasi Peserta',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

}