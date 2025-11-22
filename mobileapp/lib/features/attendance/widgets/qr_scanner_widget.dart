import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/constants/app_constants.dart';

class QRScannerWidget extends StatefulWidget {
  final bool isActive;
  final Function(String) onScan;
  final Function(String)? onError;

  const QRScannerWidget({
    super.key,
    required this.isActive,
    required this.onScan,
    this.onError,
  });

  @override
  State<QRScannerWidget> createState() => _QRScannerWidgetState();
}

class _QRScannerWidgetState extends State<QRScannerWidget> {
  MobileScannerController? _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.isActive) {
      _initializeScanner();
    }
  }

  @override
  void didUpdateWidget(QRScannerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _initializeScanner();
    } else if (!widget.isActive && oldWidget.isActive) {
      _disposeScanner();
    }
  }

  void _initializeScanner() {
    if (!_isInitialized) {
      _controller = MobileScannerController();
      _isInitialized = true;
    }
  }

  void _disposeScanner() {
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
  }

  @override
  void dispose() {
    _disposeScanner();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isActive || !_isInitialized) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppConstants.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppConstants.borderLight),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.qr_code_scanner,
                size: 48,
                color: AppConstants.textMuted,
              ),
              const SizedBox(height: 8),
              Text(
                'Camera tidak aktif',
                style: TextStyle(
                  color: AppConstants.textMuted,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppConstants.primaryColor, width: 2),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            MobileScanner(
              controller: _controller!,
              onDetect: (BarcodeCapture capture) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    widget.onScan(barcode.rawValue!);
                    break;
                  }
                }
              },
            ),
            // Scanner overlay
            Container(
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppConstants.primaryColor,
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            // Corner indicators
            Positioned(
              top: 20,
              left: 20,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: AppConstants.primaryColor, width: 3),
                    left: BorderSide(color: AppConstants.primaryColor, width: 3),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 20,
              right: 20,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: AppConstants.primaryColor, width: 3),
                    right: BorderSide(color: AppConstants.primaryColor, width: 3),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 20,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppConstants.primaryColor, width: 3),
                    left: BorderSide(color: AppConstants.primaryColor, width: 3),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              right: 20,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppConstants.primaryColor, width: 3),
                    right: BorderSide(color: AppConstants.primaryColor, width: 3),
                  ),
                ),
              ),
            ),
            // Center text
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Arahkan kamera ke QR code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
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
}