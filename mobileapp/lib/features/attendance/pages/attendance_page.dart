import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../shared/widgets/smart_back_button.dart';
import '../widgets/attendance_content.dart';
import '../bloc/attendance_bloc.dart';

class AttendancePage extends StatefulWidget {
  final String? eventId;

  const AttendancePage({
    super.key,
    this.eventId,
  });

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  String? selectedEventId;
  String qrCodeData = '';
  bool cameraActive = false;
  String scanResult = '';
  bool detectingEvent = false;

  @override
  void initState() {
    super.initState();
    selectedEventId = widget.eventId;
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AttendanceBloc()..add(const LoadOrganizerEvents()),
      child: BlocListener<AttendanceBloc, AttendanceState>(
        listener: (context, state) {
          if (state is ParticipantCheckedIn) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green,
              ),
            );
            // Clear QR data after successful check-in
            setState(() {
              qrCodeData = '';
              scanResult = '';
            });
          } else if (state is AttendanceFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          } else if (state is EventDetected) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Event detected: ${state.detectedData.event.title}'),
                backgroundColor: Colors.blue,
              ),
            );
            // Auto-select the detected event
            setState(() {
              selectedEventId = state.detectedData.event.id;
            });
          }
          setState(() {
            detectingEvent = false;
          });
        },
        child: Scaffold(
          appBar: AppBar(
            title: Text(widget.eventId != null ? 'Event Attendance' : 'Attendance Management'),
            leading: const SmartBackButton(),
          ),
          body: AttendanceContent(
            selectedEventId: selectedEventId,
            qrCodeData: qrCodeData,
            cameraActive: cameraActive,
            scanResult: scanResult,
            detectingEvent: detectingEvent,
            onEventSelected: (eventId) {
              setState(() {
                selectedEventId = eventId;
              });
              // Load attendance data for selected event
              context.read<AttendanceBloc>().add(LoadEventAttendance(eventId: eventId));
            },
            onQRDataChanged: (data) {
              setState(() {
                qrCodeData = data;
              });
            },
            onCameraToggled: () {
              setState(() {
                cameraActive = !cameraActive;
              });
            },
            onQRScan: (result) {
              setState(() {
                scanResult = result;
              });
            },
            onCheckIn: () {
              if (selectedEventId != null && qrCodeData.isNotEmpty) {
                context.read<AttendanceBloc>().add(
                  CheckInParticipant(
                    eventId: selectedEventId!,
                    qrCodeData: qrCodeData,
                  ),
                );
              }
            },
            onDetectEvent: () {
              if (qrCodeData.isNotEmpty) {
                setState(() {
                  detectingEvent = true;
                });
                context.read<AttendanceBloc>().add(
                  DetectEventFromToken(token: qrCodeData),
                );
              }
            },
          ),
        ),
      ),
    );
  }
}