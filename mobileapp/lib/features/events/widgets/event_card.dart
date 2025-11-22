import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/utils/currency_formatter.dart';

/// Reusable event card widget
class EventCard extends StatelessWidget {
  final dynamic event;
  final double? width;
  final double? height;
  final bool showPrice;
  final bool showDistance;

  const EventCard({
    super.key,
    required this.event,
    this.width,
    this.height,
    this.showPrice = true,
    this.showDistance = false,
  });

  @override
  Widget build(BuildContext context) {
    final isRegistrationClosed = _isRegistrationClosed();
    
    return Card(
      elevation: 4,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => context.go('/events/detail/${event.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
            // Image Section - Fixed height
            Container(
              height: 120,
              width: double.infinity,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: event.thumbnailUrl != null
                    ? CachedNetworkImage(
                        imageUrl: event.thumbnailUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        color: isRegistrationClosed ? Colors.grey : null,
                        colorBlendMode: isRegistrationClosed ? BlendMode.saturation : null,
                        placeholder: (context, url) => Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                        errorWidget: (context, url, error) => _buildPlaceholderImage(context),
                      )
                    : _buildPlaceholderImage(context),
              ),
            ),
            
            // Content Section - Flexible height
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Title with Status Indicators
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isRegistrationClosed ? Colors.grey[600] : Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Status badges
                      ..._buildStatusBadges(context),
                    ],
                  ),
                  const SizedBox(height: 6),
                  
                  // Date
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 14, color: isRegistrationClosed ? Colors.grey[500] : Colors.black54),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _formatDate(event.eventDate ?? event.eventTime ?? ''),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isRegistrationClosed ? Colors.grey[500] : Colors.black54,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  
                  // Location
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 14, color: isRegistrationClosed ? Colors.grey[500] : Colors.black54),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.location,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isRegistrationClosed ? Colors.grey[500] : Colors.black54,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  
                  // Distance (if available and showDistance is true)
                  if (showDistance && event.distance != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.navigation, size: 14, color: Colors.blue),
                        const SizedBox(width: 6),
                        Text(
                          _formatDistance(event.distance),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.blue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),
                  
                  // Price
                  if (showPrice)
                    Text(
                      event.isFree ? 'GRATIS' : 'Rp ${_formatPrice(event.price)}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: event.isFree ? Colors.green[700] : const Color(0xFF2563EB),
                      ),
                    ),
                ],
              ),
            ),
              ],
            ),
            // Overlay for registration closed events
            if (isRegistrationClosed)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade600,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.event_busy,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Registration Closed',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[300], // Changed from blue to grey
      ),
      child: Center(
        child: Icon(
          Icons.event,
          color: Colors.grey[600], // Changed icon color to darker grey
          size: 32,
        ),
      ),
    );
  }

  String _formatDate(dynamic dateValue) {
    try {
      DateTime date;
      if (dateValue is DateTime) {
        date = dateValue;
      } else if (dateValue is String) {
        date = DateTime.parse(dateValue);
      } else {
        return dateValue.toString();
      }
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateValue.toString();
    }
  }

  String _formatPrice(dynamic price) {
    try {
      if (price == null) return '0';
      final priceValue = double.parse(price.toString());
      return CurrencyFormatter.formatAmount(priceValue);
    } catch (e) {
      return price.toString();
    }
  }

  /// Build status badges for the event
  List<Widget> _buildStatusBadges(BuildContext context) {
    List<Widget> badges = [];
    
    // Check if registration is closed
    if (_isRegistrationClosed()) {
      badges.add(
        Container(
          margin: const EdgeInsets.only(left: 4),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.orange.shade300),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.event_busy,
                size: 12,
                color: Colors.orange.shade600,
              ),
              const SizedBox(width: 2),
              Text(
                'REGISTRATION CLOSED',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade600,
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    // Check if event is private
    if (event.isPrivate == true) {
      badges.add(
        Container(
          margin: const EdgeInsets.only(left: 4),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.shade300),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.lock_outline,
                size: 12,
                color: Colors.red.shade600,
              ),
              const SizedBox(width: 2),
              Text(
                'PRIVATE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return badges;
  }

  /// Check if registration is closed
  bool _isRegistrationClosed() {
    try {
      if (event.registrationDeadline == null) return false;
      
      DateTime deadline;
      if (event.registrationDeadline is DateTime) {
        deadline = event.registrationDeadline;
      } else {
        deadline = DateTime.parse(event.registrationDeadline.toString());
      }
      
      return DateTime.now().isAfter(deadline);
    } catch (e) {
      return false;
    }
  }

  String _formatDistance(double distanceKm) {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).round()}m';
    } else if (distanceKm < 10) {
      return '${distanceKm.toStringAsFixed(1)}km';
    } else {
      return '${distanceKm.round()}km';
    }
  }
}
