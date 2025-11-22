'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  active: boolean;
}

export default function QRScanner({ onScan, onError, active }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [active]);

  const startCamera = async () => {
    try {
      setError('');
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices) {
        // Try fallback to legacy getUserMedia
        if ((navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia || (navigator as any).msGetUserMedia) {
          return startCameraLegacy();
        }
        
        throw new Error('MediaDevices API not supported');
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        
        // Start scanning loop
        scanLoop();
      }
    } catch (err) {
      let errorMessage = 'Camera access denied or not available';
      
      if ((err as Error).message.includes('MediaDevices API not supported')) {
        errorMessage = 'Camera not supported in this browser. Please use Chrome, Safari, or Firefox.';
      } else if ((err as Error).message.includes('getUserMedia not supported')) {
        errorMessage = 'Camera API not supported. Please update your browser.';
      } else if ((err as Error).name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if ((err as Error).name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if ((err as Error).name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      } else if ((err as Error).name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const startCameraLegacy = () => {
    const getUserMedia = (navigator as any).getUserMedia || 
                        (navigator as any).webkitGetUserMedia || 
                        (navigator as any).mozGetUserMedia || 
                        (navigator as any).msGetUserMedia;
    
    if (!getUserMedia) {
      throw new Error('Legacy getUserMedia not supported');
    }
    
    getUserMedia.call(navigator, {
      video: {
        facingMode: 'environment'
      }
    }, (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        
        scanLoop();
      }
    }, (err: any) => {
      const errorMessage = 'Camera access denied or not available';
      setError(errorMessage);
      onError?.(errorMessage);
    });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanLoop = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Detect QR code using jsQR
    const qrData = detectQRCode(imageData);
    
    if (qrData) {
      onScan(qrData);
      setScanning(false);
      return;
    }

    // Continue scanning
    requestAnimationFrame(scanLoop);
  };

  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code ? code.data : null;
    } catch (error) {
      console.error('QR detection error:', error);
      return null;
    }
  };

  if (!active) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
        <div className="text-center text-gray-500">
          <CameraOff className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Camera scanner inactive</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm font-medium">Camera Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border-2 border-blue-300">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning frame */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-400 rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
        </div>
        
        {/* Scanning line */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-blue-400 opacity-75 animate-pulse"></div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white">
          <p className="text-sm font-medium">Point camera at QR code</p>
          <p className="text-xs opacity-75">Make sure QR code is within the frame</p>
        </div>
      </div>
    </div>
  );
}
