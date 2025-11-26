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

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Use the global AttendanceBloc from main.dart instead of creating a new one
    final attendanceBloc = context.read<AttendanceBloc>();
    
    // Load organizer events if not already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (attendanceBloc.state is AttendanceInitial) {
        attendanceBloc.add(const LoadOrganizerEvents());
      }
    });
    
    return BlocListener<AttendanceBloc, AttendanceState>(
        listenWhen: (previous, current) {
          // Always listen to all state changes
          print('🔍 LISTEN WHEN: Previous=${previous.runtimeType}, Current=${current.runtimeType}');
          print('🔍 LISTEN WHEN: Previous==Current? ${previous == current}');
          print('🔍 LISTEN WHEN: Previous props: ${previous.props}');
          print('🔍 LISTEN WHEN: Current props: ${current.props}');
          print('🔍 LISTEN WHEN: Is EventDetected? ${current is EventDetected}');
          print('🔍 LISTEN WHEN: Will listen? true');
          return true;
        },
        listener: (context, state) {
          print('📢📢📢 BLOC LISTENER CALLED: State received: ${state.runtimeType}');
          print('📢 BLOC LISTENER: State details: $state');
          print('📢 BLOC LISTENER: Is EventDetected? ${state is EventDetected}');
          
          // Reset detectingEvent flag when state changes (except when loading and we're detecting)
          if (state is AttendanceLoading) {
            // Keep detectingEvent true while loading if we're detecting
            // Don't reset here
            print('⏳ BLOC LISTENER: Loading state, keeping detectingEvent: $detectingEvent');
          } else {
            // Any other state means detection/action is done
            print('✅ BLOC LISTENER: Non-loading state, resetting detectingEvent');
            setState(() {
              detectingEvent = false;
            });
          }

          if (state is ParticipantCheckedIn) {
            // Show success message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.message,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 4),
                behavior: SnackBarBehavior.floating,
              ),
            );
            
            // Clear QR data after successful check-in
            setState(() {
              qrCodeData = '';
              scanResult = '';
            });
            
            // Reload attendance data to show updated status
            if (selectedEventId != null) {
              context.read<AttendanceBloc>().add(LoadEventAttendance(eventId: selectedEventId!));
            }
          } else if (state is AttendanceFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 4),
              ),
            );
            // Reset detecting flag on error
            setState(() {
              detectingEvent = false;
            });
          } else if (state is EventDetected) {
            print('🎯🎯🎯 EventDetected state received in listener!');
            print('🎯 Event ID: ${state.detectedData.event.id}');
            print('🎯 Event Title: ${state.detectedData.event.title}');
            print('🎯 Registration: ${state.detectedData.registration?.hasAttended}');
            print('🎯 Registration Token: ${state.detectedData.registration?.token}');
            print('🎯 QR Code Data: $qrCodeData');
            
            // Auto-select the detected event
            setState(() {
              selectedEventId = state.detectedData.event.id;
              detectingEvent = false; // Reset detecting state immediately
            });
            print('✅ Selected event ID set: $selectedEventId');
            print('✅ detectingEvent reset to: false');
            
            // Show confirmation dialog for check-in
            final participant = state.detectedData.participant;
            final registration = state.detectedData.registration;
            
            print('👤 Participant: ${participant.fullName}');
            print('📝 Registration hasAttended: ${registration?.hasAttended}');
            print('📝 Registration token: ${registration?.token}');
            
            // Check if already attended
            if (registration != null && registration.hasAttended) {
              print('✅ Participant already attended - skipping check-in');
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${participant.fullName} sudah check-in sebelumnya'),
                  backgroundColor: Colors.orange,
                  duration: const Duration(seconds: 3),
                ),
              );
              // Clear QR data
              setState(() {
                qrCodeData = '';
                scanResult = '';
              });
              
              // Load attendance data after a delay to avoid state conflict
              Future.delayed(const Duration(milliseconds: 100), () {
                print('📥 Loading attendance data for event: ${state.detectedData.event.id}');
                context.read<AttendanceBloc>().add(LoadEventAttendance(eventId: state.detectedData.event.id));
              });
            } else {
              print('🔄🔄🔄 Starting auto check-in process...');
              // Get token to use
              String tokenToUse = '';
              if (registration != null && registration.token.isNotEmpty) {
                tokenToUse = registration.token;
                print('✅ Using token from registration: $tokenToUse');
              } else if (qrCodeData.isNotEmpty) {
                tokenToUse = qrCodeData;
                print('✅ Using token from qrCodeData: $tokenToUse');
              } else {
                print('⚠️ Both registration.token and qrCodeData are empty!');
              }
              
              print('🔑 Final token to use: $tokenToUse');
              print('📅 Event ID for check-in: ${state.detectedData.event.id}');
              
              if (tokenToUse.isNotEmpty) {
                print('🚀🚀🚀 Auto triggering check-in NOW!');
                print('🚀 Event ID: ${state.detectedData.event.id}');
                print('🚀 Token: $tokenToUse');
                // Auto check-in immediately
                context.read<AttendanceBloc>().add(
                  CheckInParticipant(
                    eventId: state.detectedData.event.id,
                    qrCodeData: tokenToUse,
                  ),
                );
                print('✅ CheckInParticipant event dispatched!');
              } else {
                print('❌❌❌ No token available for check-in!');
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Error: Token tidak ditemukan'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            }
          }
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
    );
  }
}