import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

class FullscreenQRScanner extends StatefulWidget {
  final Function(String) onScan;
  final Function(String)? onError;

  const FullscreenQRScanner({
    super.key,
    required this.onScan,
    this.onError,
  });

  @override
  State<FullscreenQRScanner> createState() => _FullscreenQRScannerState();
}

class _FullscreenQRScannerState extends State<FullscreenQRScanner>
    with TickerProviderStateMixin {
  MobileScannerController? _controller;
  bool _isInitialized = false;
  late AnimationController _scanLineController;
  late AnimationController _cornerController;
  late AnimationController _pulseController;
  bool _isScanning = false;
  String? _errorMessage;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initializeScanner();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _scanLineController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();

    _cornerController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
  }

  Future<void> _initializeScanner() async {
    if (!_isInitialized) {
      try {
        print('📷 Initializing camera scanner...');
        
        // Check camera permission first
        final permissionStatus = await Permission.camera.status;
        print('📷 Camera permission status: $permissionStatus');
        
        if (permissionStatus.isDenied) {
          print('📷 Requesting camera permission...');
          final result = await Permission.camera.request();
          print('📷 Permission request result: $result');
          if (result.isDenied) {
            _setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan.');
            return;
          }
        }
        
        if (permissionStatus.isPermanentlyDenied) {
          _setError('Akses kamera diblokir secara permanen. Silakan aktifkan di pengaturan aplikasi.');
          return;
        }
        
        print('📷 Creating MobileScannerController...');
        _controller = MobileScannerController(
          detectionSpeed: DetectionSpeed.noDuplicates,
          facing: CameraFacing.back,
          torchEnabled: false,
        );
        _isInitialized = true;
        _clearError();
        print('📷 Camera scanner initialized successfully!');
      } catch (e) {
        print('📷 Camera initialization error: $e');
        _setError('Gagal menginisialisasi kamera: ${e.toString()}');
      }
    }
  }

  void _disposeScanner() {
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
  }

  void resetState() {
    setState(() {
      _isScanning = false;
    });
    _cornerController.reset();
  }

  void _setError(String message) {
    setState(() {
      _errorMessage = message;
      _hasError = true;
    });
  }

  void _clearError() {
    setState(() {
      _errorMessage = null;
      _hasError = false;
    });
  }

  Future<void> _retryScanner() async {
    _clearError();
    _disposeScanner();
    await _initializeScanner();
  }

  bool _isValidQRCode(String qrData) {
    print('🔍 Validating QR code: "$qrData"');
    print('🔍 Length: ${qrData.length}');
    
    // Basic validation - check if it's not empty and has reasonable length
    if (qrData.isEmpty || qrData.length < 5) {
      print('🔍 ❌ Too short or empty');
      return false;
    }
    
    // Check if it's a registration token (8-10 characters, alphanumeric)
    if (qrData.length >= 5 && qrData.length <= 15) {
      // Check if it's alphanumeric (registration token format)
      final alphanumericRegex = RegExp(r'^[A-Za-z0-9]+$');
      if (alphanumericRegex.hasMatch(qrData)) {
        print('🔍 ✅ Valid registration token');
        return true;
      } else {
        print('🔍 ❌ Not alphanumeric');
      }
    }
    
    // Check if it contains common QR code patterns for event management
    // This handles JSON format QR codes from backend
    final hasEvent = qrData.contains('event');
    final hasRegistration = qrData.contains('registration');
    final hasToken = qrData.contains('token');
    final hasTicket = qrData.contains('TICKET');
    final isLong = qrData.length > 20;
    
    print('🔍 Contains event: $hasEvent');
    print('🔍 Contains registration: $hasRegistration');
    print('🔍 Contains token: $hasToken');
    print('🔍 Contains TICKET: $hasTicket');
    print('🔍 Length > 20: $isLong');
    
    final isValid = hasEvent || hasRegistration || hasToken || hasTicket || isLong;
    print('🔍 Final validation result: $isValid');
    
    return isValid;
  }

  @override
  void dispose() {
    _disposeScanner();
    _scanLineController.dispose();
    _cornerController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return _buildErrorScreen();
    }

    if (!_isInitialized) {
      return _buildLoadingScreen();
    }

    return SizedBox(
      width: double.infinity,
      height: double.infinity,
      child: Stack(
        children: [
          // Camera Scanner
          MobileScanner(
            controller: _controller,
            onDetect: (BarcodeCapture capture) {
              try {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    // Prevent multiple detections
                    if (_isScanning) return;
                    
                    setState(() {
                      _isScanning = true;
                    });
                    
                    // Animate corner indicators
                    _cornerController.forward();
                    
                     // Debug: Print scanned data
                     print('🔍 Scanned QR Code Data: "${barcode.rawValue}"');
                     print('🔍 Data Length: ${barcode.rawValue!.length}');
                     print('🔍 Is Valid: ${_isValidQRCode(barcode.rawValue!)}');
                     
                     // Validate QR code format
                     if (_isValidQRCode(barcode.rawValue!)) {
                       // Call onScan immediately
                       widget.onScan(barcode.rawValue!);
                     } else {
                       _setError('QR code tidak valid: "${barcode.rawValue}". Pastikan QR code dari aplikasi event management.');
                       // Reset scanning state after error
                       Future.delayed(const Duration(seconds: 2), () {
                         if (mounted) {
                           setState(() {
                             _isScanning = false;
                           });
                           _cornerController.reset();
                         }
                       });
                     }
                     break;
                  }
                }
              } catch (e) {
                _setError('Gagal memproses QR code: ${e.toString()}');
              }
            },
          ),
          // QR Scanner Overlay
          if (!_hasError) _buildScannerOverlay(context),
        ],
      ),
    );
  }

  Widget _buildScannerOverlay(BuildContext context) {
    try {
      return Container(
      width: double.infinity,
      height: double.infinity,
      child: Stack(
        children: [
          // Center scan box with corner indicators only
          Center(
            child: Container(
              width: 250,
              height: 250,
              child: Stack(
                children: [
                  // Animated Corner indicators with smooth transitions
                  AnimatedBuilder(
                    animation: Listenable.merge([_cornerController, _pulseController]),
                    builder: (context, child) {
                      final cornerColor = _isScanning 
                          ? Colors.green 
                          : Colors.white;
                      final cornerWidth = _isScanning ? 6.0 : 4.0;
                      final pulseScale = _isScanning ? 1.0 + (_pulseController.value * 0.1) : 1.0;
                      
                      return Stack(
                        children: [
                          // Top Left
                          Positioned(
                            top: 0,
                            left: 0,
                            child: Transform.scale(
                              scale: pulseScale,
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  border: Border(
                                    top: BorderSide(color: cornerColor, width: cornerWidth),
                                    left: BorderSide(color: cornerColor, width: cornerWidth),
                                  ),
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // Top Right
                          Positioned(
                            top: 0,
                            right: 0,
                            child: Transform.scale(
                              scale: pulseScale,
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  border: Border(
                                    top: BorderSide(color: cornerColor, width: cornerWidth),
                                    right: BorderSide(color: cornerColor, width: cornerWidth),
                                  ),
                                  borderRadius: BorderRadius.only(
                                    topRight: Radius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // Bottom Left
                          Positioned(
                            bottom: 0,
                            left: 0,
                            child: Transform.scale(
                              scale: pulseScale,
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  border: Border(
                                    bottom: BorderSide(color: cornerColor, width: cornerWidth),
                                    left: BorderSide(color: cornerColor, width: cornerWidth),
                                  ),
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // Bottom Right
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Transform.scale(
                              scale: pulseScale,
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  border: Border(
                                    bottom: BorderSide(color: cornerColor, width: cornerWidth),
                                    right: BorderSide(color: cornerColor, width: cornerWidth),
                                  ),
                                  borderRadius: BorderRadius.only(
                                    bottomRight: Radius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          // Animated Scanning line
          Center(
            child: AnimatedBuilder(
              animation: _scanLineController,
              builder: (context, child) {
                final animationValue = _scanLineController.value;
                final lineColor = _isScanning ? Colors.green : Colors.white;
                
                return Container(
                  width: 250,
                  height: 250,
                  child: Stack(
                    children: [
                      // Scanning line
                      Positioned(
                        top: 250 * animationValue - 1,
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                lineColor,
                                Colors.transparent,
                              ],
                              stops: [0.0, 0.5, 1.0],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          // Instructions
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    'Arahkan kamera ke QR code participant',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pastikan QR code berada dalam kotak putih',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
    } catch (e) {
      _setError('Gagal membuat overlay scanner: ${e.toString()}');
      return Container();
    }
  }

  Widget _buildLoadingScreen() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: Colors.white,
            ),
            SizedBox(height: 20),
            Text(
              'Menginisialisasi kamera...',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Error Icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.red,
                    width: 2,
                  ),
                ),
                child: const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 40,
                ),
              ),
              const SizedBox(height: 24),
              
              // Error Title
              const Text(
                'Kamera Tidak Tersedia',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              
              // Error Message
              Text(
                _errorMessage ?? 'Terjadi kesalahan saat mengakses kamera',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
               // Retry Button
               ElevatedButton.icon(
                 onPressed: _retryScanner,
                 icon: const Icon(Icons.refresh),
                 label: const Text('Coba Lagi'),
                 style: ElevatedButton.styleFrom(
                   backgroundColor: const Color(0xFF2563EB),
                   foregroundColor: Colors.white,
                   padding: const EdgeInsets.symmetric(
                     horizontal: 24,
                     vertical: 12,
                   ),
                   shape: RoundedRectangleBorder(
                     borderRadius: BorderRadius.circular(8),
                   ),
                 ),
               ),
               const SizedBox(height: 12),
               
               // Settings Button (if permission denied)
               if (_errorMessage?.contains('pengaturan') == true)
                 ElevatedButton.icon(
                   onPressed: () async {
                     await openAppSettings();
                   },
                   icon: const Icon(Icons.settings),
                   label: const Text('Buka Pengaturan'),
                   style: ElevatedButton.styleFrom(
                     backgroundColor: Colors.orange,
                     foregroundColor: Colors.white,
                     padding: const EdgeInsets.symmetric(
                       horizontal: 24,
                       vertical: 12,
                     ),
                     shape: RoundedRectangleBorder(
                       borderRadius: BorderRadius.circular(8),
                     ),
                   ),
                 ),
               if (_errorMessage?.contains('pengaturan') == true)
                 const SizedBox(height: 12),
               
               // Close Button
               TextButton.icon(
                 onPressed: () => Navigator.of(context).pop(),
                 icon: const Icon(Icons.close),
                 label: const Text('Tutup'),
                 style: TextButton.styleFrom(
                   foregroundColor: Colors.white70,
                   padding: const EdgeInsets.symmetric(
                     horizontal: 24,
                     vertical: 12,
                   ),
                 ),
               ),
            ],
          ),
        ),
      ),
    );
  }
}



