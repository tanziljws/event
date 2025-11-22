import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../widgets/event_detail_content.dart';

class EventDetailPage extends StatelessWidget {
  final String eventId;

  const EventDetailPage({
    super.key,
    required this.eventId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      extendBodyBehindAppBar: true, // This makes image go behind status bar
      body: EventDetailContent(eventId: eventId),
    );
  }
}