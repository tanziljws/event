import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../shared/models/event_model.dart';
import '../../../shared/widgets/event_location_map.dart';

class EventDetailInfo extends StatelessWidget {
  final EventModel event;
  final bool useSliver;

  const EventDetailInfo({
    super.key,
    required this.event,
    this.useSliver = true,
  });

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8), // Better spacing from carousel
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event Title (moved from header)
          Text(
            event.title,
            style: const TextStyle(
              color: Color(0xFF1E293B),
              fontSize: 24,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          
          _buildEventTitleAndDescription(event),
          const SizedBox(height: 12),
          _buildKeyInfoRow(event),
          const SizedBox(height: 12),
          _buildLocationSection(event),
          const SizedBox(height: 6),
          EventLocationMap(event: event, height: 140),
        ],
      ),
    );

    // Return Sliver or regular widget based on useSliver flag
    return useSliver 
        ? SliverToBoxAdapter(child: content)
        : content;
  }

  Widget _buildEventTitleAndDescription(EventModel event) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // About This Event section
        const Text(
          'About This Event',
          style: TextStyle(
            fontSize: 18, // Reduced font size
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8), // Reduced spacing
        Text(
          event.description ?? 'No description available',
          style: TextStyle(
            fontSize: 14, // Reduced font size
            color: Colors.grey[700],
            height: 1.4, // Reduced line height
          ),
          maxLines: 3, // Limit description lines
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildKeyInfoRow(EventModel event) {
    return SizedBox(
      height: 60, // Further reduced height to prevent overflow
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildKeyInfoRowItem(
            icon: Icons.calendar_today,
            label: 'Date',
            value: _formatDate(event.eventDate),
            color: Colors.grey,
          ),
          const SizedBox(width: 12), // Reduced spacing
          _buildKeyInfoRowItem(
            icon: Icons.access_time,
            label: 'Time',
            value: event.eventTime ?? 'TBA',
            color: Colors.grey,
          ),
          const SizedBox(width: 12),
          _buildKeyInfoRowItem(
            icon: Icons.people,
            label: 'Capacity',
            value: '${event.maxParticipants}',
            color: Colors.grey,
          ),
          const SizedBox(width: 12),
          _buildKeyInfoRowItem(
            icon: Icons.category,
            label: 'Category',
            value: event.categoryText,
            color: Colors.grey,
          ),
        ],
      ),
    );
  }

  Widget _buildKeyInfoRowItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      width: 75, // Slightly reduced width
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4), // Reduced padding
      child: Column(
        mainAxisSize: MainAxisSize.min, // Important: minimize column size
        children: [
          Icon(
            icon,
            color: Colors.grey[600],
            size: 14, // Reduced icon size
          ),
          const SizedBox(height: 2), // Reduced spacing
          Text(
            label,
            style: TextStyle(
              fontSize: 9, // Reduced font size
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 1), // Reduced spacing
          Text(
            value,
            style: TextStyle(
              fontSize: 10, // Reduced font size
              color: Colors.grey[700],
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }



  Widget _buildLocationSection(EventModel event) {
    return Container(
      padding: const EdgeInsets.all(10), // Further reduced padding
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.location_on,
                color: Colors.grey[600],
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  event.location,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          
          // Navigation Button
          if (event.latitude != null && event.longitude != null) ...[
            const SizedBox(height: 6), // Further reduced spacing
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openNavigation(event),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8), // Further reduced button padding
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.directions, size: 18),
                label: const Text(
                  'Get Directions',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'TBA';
    
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _openNavigation(EventModel event) async {
    if (event.latitude == null || event.longitude == null) {
      return;
    }

    final lat = event.latitude!;
    final lng = event.longitude!;
    final location = Uri.encodeComponent(event.location);

    // Try to open in Google Maps first
    final googleMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&destination_place_id=$location';
    
    // Fallback URLs for different platforms
    final appleMapsUrl = 'https://maps.apple.com/?daddr=$lat,$lng';
    final wazeUrl = 'https://waze.com/ul?ll=$lat,$lng&navigate=yes';
    
    try {
      // Try Google Maps first
      if (await canLaunchUrl(Uri.parse(googleMapsUrl))) {
        await launchUrl(
          Uri.parse(googleMapsUrl),
          mode: LaunchMode.externalApplication,
        );
      } 
      // Fallback to Apple Maps on iOS
      else if (await canLaunchUrl(Uri.parse(appleMapsUrl))) {
        await launchUrl(
          Uri.parse(appleMapsUrl),
          mode: LaunchMode.externalApplication,
        );
      }
      // Last resort - open in browser
      else {
        await launchUrl(
          Uri.parse(googleMapsUrl),
          mode: LaunchMode.inAppWebView,
        );
      }
    } catch (e) {
      // If all fails, show error message
      debugPrint('Could not launch navigation: $e');
    }
  }
}
