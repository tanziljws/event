import 'package:flutter/material.dart';

class AttendancePage extends StatelessWidget {
  final String eventId;

  const AttendancePage({
    super.key,
    required this.eventId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Attendance'),
      ),
      body: const Center(
        child: Text('Attendance Page - Coming Soon'),
      ),
    );
  }
}

