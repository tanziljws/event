import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../features/events/bloc/event_bloc.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../models/event_model.dart';
import 'optimized_image.dart';
import 'performance_optimizer.dart';

/// Optimized event card with performance improvements
class OptimizedEventCard extends StatelessWidget {
  final EventModel event;
  final VoidCallback? onTap;
  final bool showOrganizerInfo;
  final bool enableHeroAnimation;

  const OptimizedEventCard({
    super.key,
    required this.event,
    this.onTap,
    this.showOrganizerInfo = true,
    this.enableHeroAnimation = true,
  });

  @override
  Widget build(BuildContext context) {
    return PerformanceOptimizer(
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: InkWell(
          onTap: onTap ?? () => _onEventTap(context),
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildEventImage(context),
              _buildEventContent(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEventImage(BuildContext context) {
    final imageWidget = OptimizedAspectImage(
      imageUrl: event.imageUrl ?? '',
      aspectRatio: 16 / 9,
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(12),
        topRight: Radius.circular(12),
      ),
    );

    if (enableHeroAnimation) {
      return OptimizedHeroImage(
        imageUrl: event.imageUrl ?? '',
        heroTag: 'event_image_${event.id}',
        aspectRatio: 16 / 9,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
        ),
      );
    }

    return imageWidget;
  }

  Widget _buildEventContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildEventTitle(),
          const SizedBox(height: 8),
          _buildEventDetails(),
          const SizedBox(height: 8),
          _buildEventMeta(context),
        ],
      ),
    );
  }

  Widget _buildEventTitle() {
    return OptimizedText(
      event.title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
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
          Icons.calendar_today,
          _formatEventDate(),
          Colors.blue,
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          Icons.access_time,
          _formatEventTime(),
          Colors.green,
        ),
        const SizedBox(height: 4),
        _buildDetailRow(
          Icons.location_on,
          event.location ?? 'Location TBA',
          Colors.red,
        ),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: color,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OptimizedText(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildEventMeta(BuildContext context) {
    return Row(
      children: [
        _buildPriceTag(),
        const Spacer(),
        _buildRegistrationStatus(context),
      ],
    );
  }

  Widget _buildPriceTag() {
    final isFree = event.isFree ?? true;
    final price = event.price ?? 0;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isFree ? Colors.green[100] : Colors.blue[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: OptimizedText(
        isFree ? 'FREE' : 'Rp ${NumberFormat('#,###').format(price)}',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: isFree ? Colors.green[800] : Colors.blue[800],
        ),
      ),
    );
  }

  Widget _buildRegistrationStatus(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is AuthAuthenticated) {
          return BlocBuilder<EventBloc, EventState>(
            builder: (context, eventState) {
              final isRegistered = eventState.registeredEvents.contains(event.id);
              
              if (isRegistered) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const OptimizedText(
                    'REGISTERED',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                );
              }
            },
          );
        }
        
        return const SizedBox.shrink();
      },
    );
  }

  String _formatEventDate() {
    final date = DateTime.parse(event.eventDate);
    return DateFormat('MMM dd, yyyy').format(date);
  }

  String _formatEventTime() {
    final time = DateTime.parse(event.eventTime);
    return DateFormat('HH:mm').format(time);
  }

  void _onEventTap(BuildContext context) {
    context.push('/event-detail/${event.id}');
  }
}

/// Optimized event list with performance improvements
class OptimizedEventList extends StatelessWidget {
  final List<EventModel> events;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final bool showOrganizerInfo;
  final bool enableHeroAnimation;

  const OptimizedEventList({
    super.key,
    required this.events,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.showOrganizerInfo = true,
    this.enableHeroAnimation = true,
  });

  @override
  Widget build(BuildContext context) {
    return OptimizedListView(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: OptimizedEventCard(
            event: event,
            showOrganizerInfo: showOrganizerInfo,
            enableHeroAnimation: enableHeroAnimation,
          ),
        );
      },
    );
  }
}

/// Optimized event grid with performance improvements
class OptimizedEventGrid extends StatelessWidget {
  final List<EventModel> events;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final int crossAxisCount;
  final double childAspectRatio;
  final bool showOrganizerInfo;
  final bool enableHeroAnimation;

  const OptimizedEventGrid({
    super.key,
    required this.events,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.crossAxisCount = 2,
    this.childAspectRatio = 0.8,
    this.showOrganizerInfo = true,
    this.enableHeroAnimation = true,
  });

  @override
  Widget build(BuildContext context) {
    return OptimizedGridView(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      crossAxisCount: crossAxisCount,
      childAspectRatio: childAspectRatio,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return OptimizedEventCard(
          event: event,
          showOrganizerInfo: showOrganizerInfo,
          enableHeroAnimation: enableHeroAnimation,
        );
      },
    );
  }
}
