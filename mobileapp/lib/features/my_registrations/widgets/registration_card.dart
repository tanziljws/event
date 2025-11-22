import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/models/registration_model.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/services/certificate_service.dart';

class RegistrationCard extends StatefulWidget {
  final RegistrationModel registration;
  final VoidCallback onTap;

  const RegistrationCard({
    super.key,
    required this.registration,
    required this.onTap,
  });

  @override
  State<RegistrationCard> createState() => _RegistrationCardState();
}

class _RegistrationCardState extends State<RegistrationCard> {
  final CertificateService _certificateService = CertificateService();
  bool _isGeneratingCertificate = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildEventImage(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildEventTitle(),
                  const SizedBox(height: 8),
                  _buildEventDetails(),
                  const SizedBox(height: 12),
                  _buildRegistrationStatus(),
                  const SizedBox(height: 16),
                  _buildActionButton(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventImage() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(16),
        topRight: Radius.circular(16),
      ),
      child: Container(
        height: 180,
        width: double.infinity,
        child: widget.registration.event.thumbnailUrl != null
            ? CachedNetworkImage(
                imageUrl: widget.registration.event.thumbnailUrl!,
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
                placeholder: (context, url) => Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                errorWidget: (context, url, error) => _buildPlaceholderImage(),
              )
            : _buildPlaceholderImage(),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppConstants.primaryColor.withOpacity(0.8),
      ),
      child: const Center(
        child: Icon(
          Icons.event,
          color: Colors.white,
          size: 60,
        ),
      ),
    );
  }

  Widget _buildEventTitle() {
    return Text(
      widget.registration.event.title ?? 'Unknown Event',
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF1E293B),
      ),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildEventDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow(
          icon: Icons.calendar_today,
          text: _formatDate(widget.registration.event.eventDate),
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          icon: Icons.location_on,
          text: widget.registration.event.location ?? 'Location TBA',
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          icon: Icons.access_time,
          text: widget.registration.event.eventTime ?? 'Time TBA',
        ),
      ],
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String text,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey[600],
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRegistrationStatus() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _getStatusColor().withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getStatusIcon(),
            size: 16,
            color: _getStatusColor(),
          ),
          const SizedBox(width: 6),
          Text(
            _getStatusText(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _getStatusColor(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton() {
    // Check if user has attended and certificate is available
    final hasAttended = widget.registration.hasAttended;
    final hasCertificate = widget.registration.certificateUrl != null;
    final canGenerateCertificate = hasAttended && !hasCertificate;

    return Row(
      children: [
        // Certificate Button
        if (canGenerateCertificate || hasCertificate) ...[
          Expanded(
            child: GestureDetector(
              onTap: canGenerateCertificate ? _handleGenerateCertificate : _handleViewCertificate,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: canGenerateCertificate ? Colors.purple : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: _isGeneratingCertificate
                    ? const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            canGenerateCertificate ? Icons.add_circle_outline : Icons.download,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            canGenerateCertificate ? 'Generate Cert' : 'View Cert',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
        
        // View Event Details Button
        Expanded(
          child: GestureDetector(
            onTap: widget.onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppConstants.primaryColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'View Event Details',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor() {
    if (widget.registration.hasAttended == true) {
      return const Color(0xFF10B981); // Green for attended
    } else if (widget.registration.hasAttended == false) {
      return const Color(0xFFEF4444); // Red for not attended
    } else {
      return const Color(0xFFF59E0B); // Orange for pending
    }
  }

  IconData _getStatusIcon() {
    if (widget.registration.hasAttended == true) {
      return Icons.check_circle;
    } else if (widget.registration.hasAttended == false) {
      return Icons.cancel;
    } else {
      return Icons.schedule;
    }
  }

  String _getStatusText() {
    if (widget.registration.hasAttended == true) {
      return 'Attended';
    } else if (widget.registration.hasAttended == false) {
      return 'Not Attended';
    } else {
      return 'Pending';
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Date TBA';
    
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _handleGenerateCertificate() async {
    if (_isGeneratingCertificate) return;

    setState(() {
      _isGeneratingCertificate = true;
    });

    try {
      final result = await _certificateService.generateCertificate(widget.registration.id);
      
      if (mounted) {
        if (result['success'] == true) {
          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Certificate generated successfully!'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          
          // Navigate to certificates page
          context.go('/certificates');
        } else {
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to generate certificate'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingCertificate = false;
        });
      }
    }
  }

  void _handleViewCertificate() {
    // Navigate to certificates page to view the certificate
    context.go('/certificates');
  }
}