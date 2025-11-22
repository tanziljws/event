import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/widgets/simple_text_field.dart';
import '../bloc/attendance_bloc.dart' as attendance_bloc;
import '../models/attendance_models.dart' as attendance_models;
import 'fullscreen_qr_scanner.dart';

class AttendanceContent extends StatelessWidget {
  final String? selectedEventId;
  final String qrCodeData;
  final bool cameraActive;
  final String scanResult;
  final bool detectingEvent;
  final Function(String) onEventSelected;
  final Function(String) onQRDataChanged;
  final VoidCallback onCameraToggled;
  final Function(String) onQRScan;
  final VoidCallback onCheckIn;
  final VoidCallback onDetectEvent;

  const AttendanceContent({
    super.key,
    required this.selectedEventId,
    required this.qrCodeData,
    required this.cameraActive,
    required this.scanResult,
    required this.detectingEvent,
    required this.onEventSelected,
    required this.onQRDataChanged,
    required this.onCameraToggled,
    required this.onQRScan,
    required this.onCheckIn,
    required this.onDetectEvent,
  });

  void _showCameraModal(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: EdgeInsets.zero,
          child: Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black,
            child: Stack(
              children: [
                // Fullscreen Camera
                FullscreenQRScanner(
                  key: ValueKey(DateTime.now().millisecondsSinceEpoch), // Force rebuild
                  onScan: (qrData) {
                    try {
                      // Close modal first
                      Navigator.of(context).pop();
                      
                      // Then process the scan result with delay
                      Future.delayed(const Duration(milliseconds: 200), () {
                        try {
                          onQRDataChanged(qrData);
                          if (selectedEventId != null) {
                            onCheckIn();
                          } else {
                            onDetectEvent();
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Gagal memproses QR code: $e'),
                              backgroundColor: AppConstants.errorColor,
                              duration: const Duration(seconds: 3),
                            ),
                          );
                        }
                      });
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error saat scan: $e'),
                          backgroundColor: AppConstants.errorColor,
                          duration: const Duration(seconds: 3),
                        ),
                      );
                    }
                  },
                  onError: (error) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error kamera: $error'),
                        backgroundColor: AppConstants.errorColor,
                        duration: const Duration(seconds: 3),
                        action: SnackBarAction(
                          label: 'Tutup',
                          textColor: Colors.white,
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    );
                  },
                ),
                // Close Button
                Positioned(
                  top: 50,
                  right: 20,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                ),
                // Instructions
                Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      'Arahkan kamera ke QR code participant',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Attendance Management',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: AppConstants.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Scan QR codes to manage event attendance',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppConstants.textSecondary,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),

            // Main Content - QR Scanner in Center
            Expanded(
              child: BlocBuilder<attendance_bloc.AttendanceBloc, attendance_bloc.AttendanceState>(
                builder: (context, state) {
                  return SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        // QR Scanner Panel - Centered
                        _buildCenteredQRScanner(context),
                        const SizedBox(height: 24),

                        // Event Selection - Hidden since QR scan auto-detects event
                        // _buildEventSelection(context, state),
                        // const SizedBox(height: 24),

                        // Attendance Data
                        if (selectedEventId != null)
                          _buildAttendanceData(context, state),
                        
                        const SizedBox(height: 80), // Space for bottom nav
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(context),
    );
  }

  Widget _buildCenteredQRScanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Title
          Text(
            'QR Code Scanner',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Scan participant QR codes for attendance',
            style: TextStyle(
              fontSize: 16,
              color: AppConstants.textSecondary,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // QR Code Input
          SimpleTextField(
            hintText: 'Scan atau masukkan QR code...',
            prefixIcon: Icon(Icons.qr_code),
            controller: TextEditingController(text: qrCodeData),
            onChanged: onQRDataChanged,
            enabled: !detectingEvent,
          ),
          const SizedBox(height: 24),


          // Scan Result
          if (scanResult.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppConstants.successColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppConstants.successColor.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    color: AppConstants.successColor,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Scanned: ${scanResult.length > 50 ? '${scanResult.substring(0, 50)}...' : scanResult}',
                      style: TextStyle(
                        color: AppConstants.successColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    print('🔘 Check-in button pressed');
                    print('🔘 selectedEventId: $selectedEventId');
                    print('🔘 qrCodeData: $qrCodeData');
                    if (selectedEventId != null) {
                      print('🔘 Calling onCheckIn');
                      onCheckIn();
                    } else {
                      print('🔘 Calling onDetectEvent');
                      onDetectEvent();
                    }
                  },
                  icon: detectingEvent
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Icon(selectedEventId != null ? Icons.check_circle : Icons.search, size: 24),
                  label: Text(
                    detectingEvent
                        ? 'Detecting...'
                        : selectedEventId != null
                            ? 'Check-in Participant'
                            : 'Detect Event',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: selectedEventId != null 
                        ? AppConstants.successColor 
                        : AppConstants.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEventSelection(BuildContext context, attendance_bloc.AttendanceState state) {
    if (state is! attendance_bloc.OrganizerEventsLoaded) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final events = state.events;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppConstants.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.event,
                  color: AppConstants.primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Select Event',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Choose an event to manage attendance',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppConstants.textSecondary,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (events.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppConstants.backgroundColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.event_note,
                    size: 48,
                    color: AppConstants.textMuted,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Belum ada event',
                    style: TextStyle(
                      color: AppConstants.textMuted,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            )
          else
            ...events.map((event) => _buildEventCard(context, event)),
        ],
      ),
    );
  }

  Widget _buildEventCard(BuildContext context, attendance_models.AttendanceEvent event) {
    final isSelected = selectedEventId == event.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          print('🎯 Event selected: ${event.id} - ${event.title}');
          print('🎯 Current selectedEventId: $selectedEventId');
          onEventSelected(event.id);
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? AppConstants.primaryColor.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppConstants.primaryColor : Colors.grey[200]!,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected ? [
              BoxShadow(
                color: AppConstants.primaryColor.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ] : null,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? AppConstants.primaryColor.withOpacity(0.1)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.calendar_today,
                  color: isSelected ? AppConstants.primaryColor : AppConstants.textMuted,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? AppConstants.primaryColor : AppConstants.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 14,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            event.location,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppConstants.textSecondary,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 14,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${_formatDate(event.eventDate)} ${event.eventTime}',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppConstants.textSecondary,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.check,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAttendanceData(BuildContext context, attendance_bloc.AttendanceState state) {
    if (state is attendance_bloc.EventAttendanceLoaded) {
      return _buildAttendanceDetails(context, state.attendanceData);
    } else if (state is attendance_bloc.AttendanceLoading) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildAttendanceDetails(BuildContext context, attendance_models.AttendanceData data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event Info
          Row(
            children: [
              Icon(
                Icons.info_outline,
                color: AppConstants.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Event Information',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppConstants.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppConstants.backgroundColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  data.event.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppConstants.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: AppConstants.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        data.event.location,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppConstants.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: AppConstants.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '${_formatDate(data.event.eventDate)} ${data.event.eventTime}',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Statistics
          Row(
            children: [
              Icon(
                Icons.analytics,
                color: AppConstants.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Attendance Statistics',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppConstants.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total',
                  data.statistics.totalRegistrations.toString(),
                  Icons.people,
                  AppConstants.textSecondary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Attended',
                  data.statistics.attendedRegistrations.toString(),
                  Icons.check_circle,
                  AppConstants.textSecondary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Rate',
                  '${data.statistics.attendanceRate.toStringAsFixed(1)}%',
                  Icons.trending_up,
                  AppConstants.textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Participants List
          Row(
            children: [
              Icon(
                Icons.list,
                color: AppConstants.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Participants List',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppConstants.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          ...data.registrations.map((registration) => _buildParticipantCard(registration)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppConstants.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              color: AppConstants.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParticipantCard(attendance_models.AttendanceRegistration registration) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: registration.hasAttended 
                  ? AppConstants.successColor.withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              registration.hasAttended ? Icons.check_circle : Icons.schedule,
              color: registration.hasAttended ? AppConstants.successColor : AppConstants.textMuted,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  registration.participant.fullName,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppConstants.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Icons.email,
                      size: 14,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        registration.participant.email,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppConstants.textSecondary,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.phone,
                      size: 14,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      registration.participant.phoneNumber,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppConstants.textSecondary,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
                if (registration.attendanceTime != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: AppConstants.successColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Attended: ${_formatDateTime(registration.attendanceTime!)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConstants.successColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: registration.hasAttended 
                  ? AppConstants.successColor.withOpacity(0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              registration.hasAttended ? 'Attended' : 'Pending',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: registration.hasAttended ? AppConstants.successColor : AppConstants.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatDateTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }

  Widget _buildBottomNavigationBar(BuildContext context) {
    return Container(
      height: 80,
      child: Stack(
        children: [
          // Flat background without curves
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 15,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
            ),
          ),
          
          // Navigation items (without camera button)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                height: 60,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    // Create Event Button
                    _buildNavItem(
                      icon: Icons.add_circle_outline,
                      label: 'Create Event',
                      isActive: false,
                      onTap: () => context.go('/my-events/create'),
                    ),
                    
                    // Empty space for camera button
                    const SizedBox(width: 50),
                    
                    // My Events Button
                    _buildNavItem(
                      icon: Icons.event,
                      label: 'My Events',
                      isActive: false,
                      onTap: () => context.go('/my-events'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Floating Camera Button - Center (dot only)
          Positioned(
            bottom: 10, // Lowered to prevent text cutoff
            left: 0,
            right: 0,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildCameraNavItem(
                    icon: Icons.camera_alt,
                    onTap: () => _showCameraModal(context),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Camera',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.w500,
                      color: AppConstants.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? AppConstants.primaryColor.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? AppConstants.primaryColor : AppConstants.textMuted,
              size: 20,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w500,
                color: isActive ? AppConstants.primaryColor : AppConstants.textMuted,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraNavItem({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: AppConstants.primaryColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppConstants.primaryColor.withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 26,
        ),
      ),
    );
  }

  Widget _buildCameraNavItemWithText({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: AppConstants.textMuted,
              size: 20,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w500,
                color: AppConstants.textMuted,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

}