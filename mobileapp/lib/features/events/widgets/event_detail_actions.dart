import 'package:flutter/material.dart';
import '../../../shared/models/event_model.dart';

class EventDetailActions extends StatefulWidget {
  final EventModel event;

  const EventDetailActions({
    super.key,
    required this.event,
  });

  @override
  State<EventDetailActions> createState() => _EventDetailActionsState();
}

class _EventDetailActionsState extends State<EventDetailActions> {

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        padding: const EdgeInsets.all(12),
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
        child: const SizedBox.shrink(),
      ),
    );
  }

}
