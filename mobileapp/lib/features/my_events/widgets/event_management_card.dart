import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';

class EventManagementCard extends StatelessWidget {
  final dynamic event;
  final VoidCallback onEdit;
  final VoidCallback onView;
  final VoidCallback onAnalytics;
  final VoidCallback onAttendance;
  final VoidCallback onPublish;

  const EventManagementCard({
    super.key,
    required this.event,
    required this.onEdit,
    required this.onView,
    required this.onAnalytics,
    required this.onAttendance,
    required this.onPublish,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
                _buildEventStatus(),
                const SizedBox(height: 16),
                _buildActionButtons(),
              ],
            ),
          ),
        ],
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
        child: event.thumbnailUrl != null
            ? CachedNetworkImage(
                imageUrl: event.thumbnailUrl!,
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
      event.title,
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
          text: _formatDate(event.eventDate),
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          icon: Icons.location_on,
          text: event.location ?? 'Location TBA',
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          icon: Icons.access_time,
          text: event.eventTime ?? 'Time TBA',
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          icon: Icons.people,
          text: '${event.registrationCount ?? 0} peserta',
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

  Widget _buildEventStatus() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getStatusColor(event.isPublished).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _getStatusColor(event.isPublished).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            event.isPublished ? Icons.check_circle : Icons.schedule,
            size: 16,
            color: _getStatusColor(event.isPublished),
          ),
          const SizedBox(width: 6),
          Text(
            event.isPublished ? 'Published' : 'Draft',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _getStatusColor(event.isPublished),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        // First row of buttons
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                'View Details',
                Icons.visibility,
                AppConstants.primaryColor,
                onView,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildActionButton(
                'Analytics',
                Icons.analytics,
                AppConstants.successColor,
                onAnalytics,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Second row of buttons
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                'Attendance',
                Icons.check_circle,
                AppConstants.infoColor,
                onAttendance,
              ),
            ),
            const SizedBox(width: 8),
            // Show Edit button only if event is not published
            if (!(event.isPublished ?? false)) ...[
              Expanded(
                child: _buildActionButton(
                  'Edit',
                  Icons.edit,
                  AppConstants.warningColor,
                  onEdit,
                ),
              ),
            ] else ...[
              Expanded(
                child: Container(), // Empty space for alignment
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        // Third row for Publish button
        if (!(event.isPublished ?? false)) ...[
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Publish Event',
                  Icons.publish,
                  AppConstants.successColor,
                  onPublish,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildActionButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 16,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(bool isPublished) {
    if (isPublished) {
      return AppConstants.successColor;
    } else {
      return AppConstants.warningColor;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
