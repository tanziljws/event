import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_file/open_file.dart';
import '../../../shared/widgets/smart_back_button.dart';
import '../bloc/event_analytics_bloc.dart';
import '../widgets/event_analytics_content.dart';
import '../services/event_analytics_service.dart';

class EventAnalyticsPage extends StatefulWidget {
  final String eventId;
  final String eventTitle;

  const EventAnalyticsPage({
    super.key,
    required this.eventId,
    required this.eventTitle,
  });

  @override
  State<EventAnalyticsPage> createState() => _EventAnalyticsPageState();
}

class _EventAnalyticsPageState extends State<EventAnalyticsPage> {
  String _selectedTab = 'overview';
  final EventAnalyticsService _analyticsService = EventAnalyticsService();
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    // Load analytics data when page opens
    context.read<EventAnalyticsBloc>().add(LoadEventAnalytics(eventId: widget.eventId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.eventTitle),
        leading: const SmartBackButton(),
        actions: [
          // Export Button
          Container(
            margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: PopupMenuButton<String>(
              icon: const Icon(Icons.download, color: Colors.black87, size: 20),
              onSelected: (value) {
                if (value == 'export_attendance') {
                  _exportEventAttendance();
                } else if (value == 'export_registrations') {
                  _exportEventRegistrations();
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'export_attendance',
                  child: Row(
                    children: [
                      Icon(Icons.download, size: 16, color: Theme.of(context).primaryColor),
                      const SizedBox(width: 8),
                      const Text('Export Attendance'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'export_registrations',
                  child: Row(
                    children: [
                      Icon(Icons.download, size: 16, color: Theme.of(context).primaryColor),
                      const SizedBox(width: 8),
                      const Text('Export Registrations'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Refresh Button
          Container(
            margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: IconButton(
              icon: const Icon(Icons.refresh, color: Colors.black87, size: 20),
              onPressed: () {
                context.read<EventAnalyticsBloc>().add(RefreshEventAnalytics(eventId: widget.eventId));
              },
            ),
          ),
        ],
      ),
      body: BlocBuilder<EventAnalyticsBloc, EventAnalyticsState>(
        builder: (context, state) {
          // Handle initial state - trigger loading
          if (state is EventAnalyticsInitial) {
            // Auto-load analytics when in initial state
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.read<EventAnalyticsBloc>().add(LoadEventAnalytics(eventId: widget.eventId));
            });
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state is EventAnalyticsLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state is EventAnalyticsFailure) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      state.message,
                      style: TextStyle(color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<EventAnalyticsBloc>().add(LoadEventAnalytics(eventId: widget.eventId));
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is EventAnalyticsDataLoaded) {
            return EventAnalyticsContent(
              analyticsData: state.analyticsData,
              selectedTab: _selectedTab,
              onTabChanged: (tab) {
                setState(() {
                  _selectedTab = tab;
                });
              },
            );
          }

          // Fallback - should not reach here, but show loading just in case
          return const Center(
            child: CircularProgressIndicator(),
          );
        },
      ),
    );
  }

  Future<void> _exportEventAttendance() async {
    if (_isExporting) return;
    
    setState(() {
      _isExporting = true;
    });

    try {
      // Request storage permission (Android 13+ uses different permission)
      PermissionStatus status;
      if (Platform.isAndroid) {
        // For Android 13+, use manageExternalStorage or storage permission
        if (await Permission.manageExternalStorage.isGranted) {
          status = PermissionStatus.granted;
        } else {
          status = await Permission.storage.request();
          if (!status.isGranted) {
            status = await Permission.manageExternalStorage.request();
          }
        }
      } else {
        status = await Permission.storage.request();
      }
      
      if (!status.isGranted) {
        if (await Permission.storage.isPermanentlyDenied || 
            (Platform.isAndroid && await Permission.manageExternalStorage.isPermanentlyDenied)) {
          await openAppSettings();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Storage permission is required to save the file'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      // Show loading
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
              ),
              SizedBox(width: 12),
              Text('Exporting attendance data...'),
            ],
          ),
          duration: Duration(seconds: 30),
        ),
      );

      // Download file
      final result = await _analyticsService.exportEventAttendance(widget.eventId);
      
      if (result['success'] == true) {
        // Get download directory
        final directory = await _getDownloadDirectory();
        final filePath = '${directory.path}/${result['filename']}';
        
        // Save file
        final file = File(filePath);
        await file.writeAsBytes(result['data'] as List<int>);
        
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Attendance data exported successfully!'),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'Open',
              textColor: Colors.white,
              onPressed: () async {
                try {
                  final result = await OpenFile.open(filePath);
                  if (result.type != ResultType.done) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Cannot open file: ${result.message}'),
                        backgroundColor: Colors.orange,
      ),
    );
  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error opening file: $e'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to export attendance data'),
            backgroundColor: Colors.red,
      ),
    );
  }
    } catch (e) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error exporting attendance: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isExporting = false;
      });
    }
  }

  Future<void> _exportEventRegistrations() async {
    if (_isExporting) return;
    
    setState(() {
      _isExporting = true;
    });

    try {
      // Request storage permission (Android 13+ uses different permission)
      PermissionStatus status;
      if (Platform.isAndroid) {
        // For Android 13+, use manageExternalStorage or storage permission
        if (await Permission.manageExternalStorage.isGranted) {
          status = PermissionStatus.granted;
        } else {
          status = await Permission.storage.request();
          if (!status.isGranted) {
            status = await Permission.manageExternalStorage.request();
          }
        }
      } else {
        status = await Permission.storage.request();
      }
      
      if (!status.isGranted) {
        if (await Permission.storage.isPermanentlyDenied || 
            (Platform.isAndroid && await Permission.manageExternalStorage.isPermanentlyDenied)) {
          await openAppSettings();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Storage permission is required to save the file'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      // Show loading
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
              ),
              SizedBox(width: 12),
              Text('Exporting registrations data...'),
            ],
          ),
          duration: Duration(seconds: 30),
        ),
      );

      // Download file
      final result = await _analyticsService.exportEventRegistrations(widget.eventId);
      
      if (result['success'] == true) {
        // Get download directory
        final directory = await _getDownloadDirectory();
        final filePath = '${directory.path}/${result['filename']}';
        
        // Save file
        final file = File(filePath);
        await file.writeAsBytes(result['data'] as List<int>);
        
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Registrations data exported successfully!'),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'Open',
              textColor: Colors.white,
              onPressed: () async {
                try {
                  final result = await OpenFile.open(filePath);
                  if (result.type != ResultType.done) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Cannot open file: ${result.message}'),
                        backgroundColor: Colors.orange,
      ),
    );
                  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error opening file: $e'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to export registrations data'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error exporting registrations: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isExporting = false;
      });
    }
  }

  Future<Directory> _getDownloadDirectory() async {
    if (Platform.isAndroid) {
      // For Android, try to use external storage downloads directory
      try {
        final directory = Directory('/storage/emulated/0/Download');
        if (await directory.exists()) {
          return directory;
        }
      } catch (e) {
        print('Cannot access /storage/emulated/0/Download: $e');
      }
      
      // Try alternative path
      try {
        final directory = Directory('/sdcard/Download');
        if (await directory.exists()) {
          return directory;
        }
      } catch (e) {
        print('Cannot access /sdcard/Download: $e');
      }
      
      // Fallback to app documents directory
      return await getApplicationDocumentsDirectory();
    } else {
      // For iOS, use documents directory
      return await getApplicationDocumentsDirectory();
    }
  }
}