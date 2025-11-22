'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useError } from '@/contexts/error-context';
import { useToast } from '@/components/ui/toast';
import { SkeletonAttendance } from '@/components/ui/skeleton';
import { ApiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OrganizerLayout from '@/components/layout/organizer-layout';
import { 
  QrCode, 
  Users, 
  CheckCircle, 
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  CameraOff,
  Scan,
  Search,
  ChevronDown
} from 'lucide-react';
import QRScanner from '@/components/qr-scanner';

interface Event {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
}

interface Participant {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface Registration {
  id: string;
  eventId: string;
  participantId: string;
  registrationToken: string;
  hasAttended: boolean;
  attendanceTime: string | null;
  certificateUrl: string | null;
  qrCodeUrl: string;
  status: string;
  cancelledAt: string | null;
  registeredAt: string;
  attendedAt: string | null;
  participant: Participant;
}

interface AttendanceData {
  event: Event;
  statistics: {
    totalRegistrations: number;
    attendedRegistrations: number;
    attendanceRate: number;
  };
  registrations: Registration[];
}

// Error handling helper
const getErrorMessage = (error: any, context: string) => {
  const errorMappings = {
    // Backend error messages
    'already checked in': {
      title: '⚠️ Participant Sudah Check-in',
      message: 'Participant ini sudah pernah melakukan check-in sebelumnya. Tidak perlu check-in ulang.'
    },
    'sudah checked in': {
      title: '⚠️ Participant Sudah Check-in', 
      message: 'Participant ini sudah pernah melakukan check-in sebelumnya. Tidak perlu check-in ulang.'
    },
    'Invalid ticket': {
      title: '❌ Token Tidak Valid',
      message: 'Token QR code tidak valid atau tidak ditemukan untuk event ini. Pastikan QR code benar dan sesuai dengan event yang dipilih.'
    },
    'ticket not found': {
      title: '❌ Token Tidak Valid',
      message: 'Token QR code tidak valid atau tidak ditemukan untuk event ini. Pastikan QR code benar dan sesuai dengan event yang dipilih.'
    },
    'Event not found': {
      title: '❌ Event Tidak Ditemukan',
      message: 'Event tidak ditemukan. Pastikan event masih aktif dan tersedia.'
    },
    'Participant not found': {
      title: '❌ Participant Tidak Ditemukan',
      message: 'Data participant tidak ditemukan. Pastikan participant sudah terdaftar untuk event ini.'
    },
    'Registration not found': {
      title: '❌ Registrasi Tidak Ditemukan',
      message: 'Registrasi tidak ditemukan. Pastikan participant sudah mendaftar untuk event ini.'
    },
    'Invalid token': {
      title: '❌ Token Tidak Valid',
      message: 'Token QR code tidak valid atau tidak ditemukan. Pastikan QR code benar dan belum expired.'
    },
    'token not found': {
      title: '❌ Token Tidak Valid',
      message: 'Token QR code tidak valid atau tidak ditemukan. Pastikan QR code benar dan belum expired.'
    },
    'No registration found': {
      title: '❌ Registrasi Tidak Ditemukan',
      message: 'Tidak ada registrasi yang ditemukan untuk token ini. Pastikan participant sudah mendaftar untuk event.'
    }
  };

  // HTTP status code mappings
  const statusMappings: Record<number, { title: string; message: string }> = {
    401: { title: '❌ Session Expired', message: 'Session Anda sudah expired. Silakan login ulang untuk melanjutkan.' },
    403: { title: '❌ Akses Ditolak', message: 'Anda tidak memiliki akses untuk melakukan operasi ini. Pastikan Anda adalah organizer event ini.' },
    404: { title: '❌ Endpoint Tidak Ditemukan', message: 'API endpoint tidak ditemukan. Pastikan backend berjalan dengan benar di port 5000.' },
    500: { title: '❌ Server Error', message: 'Terjadi kesalahan di server. Silakan coba lagi atau hubungi administrator.' }
  };

  // Network error mappings
  const networkMappings: Record<string, { title: string; message: string }> = {
    'NETWORK_ERROR': { title: '❌ Koneksi Gagal', message: 'Tidak dapat terhubung ke server. Periksa koneksi internet dan pastikan backend berjalan.' },
    'Network Error': { title: '❌ Koneksi Gagal', message: 'Tidak dapat terhubung ke server. Periksa koneksi internet dan pastikan backend berjalan.' },
    'timeout': { title: '❌ Timeout', message: 'Request timeout. Server tidak merespons dalam waktu yang ditentukan.' }
  };

  // Context-specific default messages
  const contextMessages: Record<string, string> = {
    'check-in': 'Terjadi kesalahan saat melakukan check-in',
    'detect-event': 'Gagal mendeteksi event dari token',
    'load-events': 'Terjadi kesalahan saat memuat daftar event',
    'load-attendance': 'Terjadi kesalahan saat memuat data attendance'
  };

  // Check backend error message first
  if (error.response?.data?.message) {
    const backendMessage = error.response.data.message;
    for (const [key, value] of Object.entries(errorMappings)) {
      if (backendMessage.includes(key)) {
        return value;
      }
    }
    return {
      title: '❌ Error dari Server',
      message: `Server mengembalikan error: ${backendMessage}`
    };
  }

  // Check HTTP status codes
  if (error.response?.status && statusMappings[error.response.status]) {
    return statusMappings[error.response.status];
  }

  // Check network errors
  if (error.code && networkMappings[error.code]) {
    return networkMappings[error.code];
  }

  if (error.message) {
    for (const [key, value] of Object.entries(networkMappings)) {
      if (error.message.includes(key)) {
        return value;
      }
    }
  }

  // Default error
  return {
    title: '❌ Error Tidak Diketahui',
    message: `${contextMessages[context] || 'Terjadi kesalahan'}: ${error.message || 'Unknown error'}`
  };
};

export default function OrganizerAttendancePage() {
  const { user } = useAuth();
  const { handleError } = useError();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [detectedEvent, setDetectedEvent] = useState<any>(null);
  const [detectingEvent, setDetectingEvent] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
  const [showEventDropdown, setShowEventDropdown] = useState<boolean>(false);

  // Redirect jika bukan organizer, admin, atau super admin
  useEffect(() => {
    if (user && user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Load events saat component mount
  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found. Redirecting to login.');
      addToast({
        title: 'Authentication Required',
        message: 'Please login to access this page.',
        type: 'error',
      });
      window.location.href = '/login';
      return;
    }
    
    console.log('Authentication token found:', token.substring(0, 20) + '...');
    loadEvents();
  }, []);

  // Load attendance data saat event dipilih
  useEffect(() => {
    if (selectedEventId) {
      loadAttendanceData();
    }
  }, [selectedEventId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.event-dropdown-container')) {
        setShowEventDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getOrganizerEvents({ page: 1, limit: 100 });
      if (response.success) {
        // Sort events by date (recent first) and then by creation date
        const sortedEvents = (response.data.events || []).sort((a: Event, b: Event) => {
          const dateA = new Date(a.eventDate);
          const dateB = new Date(b.eventDate);
          const now = new Date();
          
          // Prioritize upcoming events
          if (dateA >= now && dateB < now) return -1;
          if (dateA < now && dateB >= now) return 1;
          
          // Then sort by event date
          return dateA.getTime() - dateB.getTime();
        });
        
        setEvents(sortedEvents);
      } else {
        addToast({
          title: 'Error',
          message: response.message || 'Gagal memuat daftar event',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Load events error:', error);
      const { title, message } = getErrorMessage(error, 'load-events');
      addToast({ title, message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const selectedEvent = events.find(event => event.id === selectedEventId);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getOrganizerEventAttendance(selectedEventId);
      if (response.success) {
        setAttendanceData(response.data);
      } else {
        addToast({
          title: 'Error',
          message: response.message || 'Gagal memuat data attendance',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Load attendance error:', error);
      const { title, message } = getErrorMessage(error, 'load-attendance');
      addToast({ title, message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Detect event from token
  const detectEventFromToken = async (token: string) => {
    try {
      setDetectingEvent(true);
      
      // Debug logging
      console.log('Detecting event from token:', token);
      console.log('Current auth token:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');
      
      const response = await ApiService.detectOrganizerEventFromToken(token);
      
      if (response.success) {
        setDetectedEvent(response.data);
        setSelectedEventId(response.data.event.id);
        
        addToast({
          title: '✅ Event Terdeteksi',
          message: `Event "${response.data.event.title}" berhasil terdeteksi dari token`,
          type: 'success',
        });
        
        // Auto-load attendance data
        await loadAttendanceData();
      } else {
        let errorMessage = 'Token tidak ditemukan';
        
        if (response.message) {
          if (response.message.includes('Invalid token') || response.message.includes('token not found')) {
            errorMessage = '❌ Token tidak valid atau tidak ditemukan';
          } else if (response.message.includes('No registration found')) {
            errorMessage = '❌ Tidak ada registrasi yang ditemukan untuk token ini';
          } else if (response.message.includes('Event not found')) {
            errorMessage = '❌ Event tidak ditemukan untuk token ini';
          } else if (response.message.includes('Not authorized')) {
            errorMessage = '❌ Anda tidak memiliki akses untuk event ini';
          } else {
            errorMessage = `❌ ${response.message}`;
          }
        }
        
        addToast({
          title: 'Deteksi Event Gagal',
          message: errorMessage,
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Detect event error:', error);
      
      // Enhanced error logging
      if (error.response?.status === 404) {
        console.error('Authentication issue detected. User might not be logged in or token expired.');
        console.error('Response data:', error.response?.data);
        
        addToast({
          title: 'Authentication Error',
          message: 'Please login again. Your session may have expired.',
          type: 'error',
        });
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const { title, message } = getErrorMessage(error, 'detect-event');
      addToast({ title, message, type: 'error' });
    } finally {
      setDetectingEvent(false);
    }
  };

  const handleQRScan = async () => {
    const qrData = qrCodeData.trim() || scanResult.trim();
    if (!qrData) {
      addToast({
        title: 'Error',
        message: 'Masukkan QR code data atau scan dengan camera',
        type: 'error',
      });
      return;
    }

    try {
      setScanning(true);
      
      // If no event selected, try to detect event from token first
      if (!selectedEventId) {
        await detectEventFromToken(qrData);
        return;
      }
      
      // Try to parse QR data as JSON, if it fails, treat as plain token
      let qrDataToSend = qrData;
      try {
        JSON.parse(qrData);
        // If it's already JSON, use as is
        qrDataToSend = qrData;
      } catch {
        // If it's plain token, we need to find the registration data
        // For now, let's try to construct a basic JSON structure
        // This is a temporary solution - ideally QR codes should contain full JSON
        qrDataToSend = JSON.stringify({
          type: 'TICKET',
          token: qrData.trim(),
          // We'll let the backend handle finding the registration
        });
      }
      
      const response = await ApiService.organizerCheckInParticipant(selectedEventId, qrDataToSend);
      
      if (response.success) {
        addToast({
          title: '✅ Check-in Berhasil',
          message: 'Participant telah berhasil di-check-in!',
          type: 'success',
        });
        setQrCodeData('');
        setScanResult('');
        setCameraActive(false);
        // Reload attendance data untuk update statistics
        await loadAttendanceData();
      } else {
        // Handle specific error messages with user-friendly text
        let errorMessage = 'Check-in gagal';
        
        if (response.message) {
          if (response.message.includes('already checked in') || response.message.includes('sudah checked in')) {
            errorMessage = '⚠️ Participant sudah ter-check-in sebelumnya';
          } else if (response.message.includes('Invalid ticket') || response.message.includes('ticket not found')) {
            errorMessage = '❌ Token tidak valid atau tidak ditemukan untuk event ini';
          } else if (response.message.includes('Event not found')) {
            errorMessage = '❌ Event tidak ditemukan';
          } else if (response.message.includes('Participant not found')) {
            errorMessage = '❌ Participant tidak ditemukan';
          } else if (response.message.includes('Registration not found')) {
            errorMessage = '❌ Registrasi tidak ditemukan';
          } else if (response.message.includes('Not authorized')) {
            errorMessage = '❌ Anda tidak memiliki akses untuk event ini';
          } else {
            errorMessage = `❌ ${response.message}`;
          }
        }
        
        addToast({
          title: 'Check-in Gagal',
          message: errorMessage,
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('QR scan error:', error);
      const { title, message } = getErrorMessage(error, 'check-in');
      addToast({ title, message, type: 'error' });
    } finally {
      setScanning(false);
    }
  };

  const handleCameraScan = (result: string) => {
    setScanResult(result);
    setQrCodeData(result);
    setCameraActive(false);
    
    // Auto-trigger check-in if event is selected
    if (selectedEventId) {
      setTimeout(() => {
        handleQRScan();
      }, 500);
    }
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    if (cameraActive) {
      setScanResult('');
      setQrCodeData('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Event Attendance
          </h1>
          <p className="text-gray-600">Kelola kehadiran peserta event Anda dengan QR code scanner</p>
        </div>

        {/* Loading State */}
        {loading && events.length === 0 ? (
          <SkeletonAttendance />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Scanner Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 font-light">
                  <QrCode className="h-5 w-5" />
                  Attendance Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Selection */}
                <div>
                  <label className="block text-sm font-light mb-2">Pilih Event Anda</label>
                  <div className="relative event-dropdown-container">
                    <input
                      type="text"
                      placeholder="Cari event atau scan QR code..."
                      value={selectedEvent ? selectedEvent.title : eventSearchQuery}
                      onChange={(e) => {
                        setEventSearchQuery(e.target.value);
                        setShowEventDropdown(true);
                        if (!e.target.value) {
                          setSelectedEventId('');
                        }
                      }}
                      onFocus={() => setShowEventDropdown(true)}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-2xl bg-white/70 backdrop-blur-sm text-gray-700 transition-all duration-200 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={loading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <Search className="h-4 w-4 text-gray-400" />
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                    
                  {/* Dropdown */}
                  {showEventDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setEventSearchQuery('');
                              setShowEventDropdown(false);
                            }}
                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-light text-gray-900 truncate">
                                  {event.title}
                                </div>
                                <div className="text-sm text-gray-500 font-light flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(event.eventDate)} {event.eventTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center font-light">
                          Tidak ada event ditemukan
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Detected Event Info */}
                  {detectedEvent && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-light text-blue-800">Event Terdeteksi</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <div className="font-light">{detectedEvent.event.title}</div>
                        <div className="text-xs text-blue-600 mt-1 font-light">
                          Participant: {detectedEvent.participant.fullName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code Input */}
                <div>
                  <label className="block text-sm font-light mb-2">QR Code Data</label>
                  <div className="relative max-w-xs">
                    <input
                      type="text"
                      placeholder="Scan atau masukkan QR code..."
                      value={qrCodeData}
                      onChange={(e) => setQrCodeData(e.target.value)}
                      disabled={scanning || detectingEvent}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-2xl bg-white/70 backdrop-blur-sm text-gray-700 transition-all duration-200 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={toggleCamera}
                      disabled={scanning || (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.mediaDevices)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    >
                      {cameraActive ? (
                        <CameraOff className="h-4 w-4" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {cameraActive && (
                    <div className="mt-4">
                      <QRScanner
                        active={cameraActive}
                        onScan={handleCameraScan}
                        onError={(error) => {
                          handleError(error);
                          setCameraActive(false);
                        }}
                      />
                    </div>
                  )}
                  
                  {scanResult && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
                      <p className="text-sm text-blue-800 font-light">
                        <strong>Scanned:</strong> {scanResult.substring(0, 50)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Scan Button */}
                <Button
                  onClick={handleQRScan}
                  disabled={scanning || detectingEvent || (!qrCodeData.trim() && !scanResult.trim())}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-light shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  size="lg"
                >
                  {scanning || detectingEvent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {detectingEvent ? 'Detecting Event...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Check-in
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* Attendance Data */}
          <div className="lg:col-span-2">
            {selectedEventId && attendanceData ? (
              <div className="space-y-6">
                {/* Event Info */}
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-blue-50 rounded-t-2xl">
                    <CardTitle className="flex items-center gap-2 text-blue-600 font-light">
                      <Calendar className="h-5 w-5" />
                      {attendanceData.event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-light">{formatDate(attendanceData.event.eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-light">{formatTime(attendanceData.event.eventTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-light">{attendanceData.event.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-blue-50 rounded-t-2xl">
                    <CardTitle className="flex items-center gap-2 text-blue-600 font-light">
                      <Users className="h-5 w-5" />
                      Attendance Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-3xl font-light text-blue-600 mb-2">
                          {attendanceData.statistics.totalRegistrations}
                        </div>
                        <div className="text-sm text-gray-600 font-light">Total Registrations</div>
                      </div>
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-3xl font-light text-blue-600 mb-2">
                          {attendanceData.statistics.attendedRegistrations}
                        </div>
                        <div className="text-sm text-gray-600 font-light">Attended</div>
                      </div>
                      <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-3xl font-light text-blue-600 mb-2">
                          {attendanceData.statistics.attendanceRate}%
                        </div>
                        <div className="text-sm text-gray-600 font-light">Attendance Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Participants List */}
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-blue-50 rounded-t-2xl">
                    <CardTitle className="text-blue-600 font-light">Participants List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {attendanceData.registrations.map((registration) => (
                        <div
                          key={registration.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {registration.hasAttended ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <Clock className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-light">{registration.participant.fullName}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-4">
                                <span className="flex items-center gap-1 font-light">
                                  <Mail className="h-3 w-3" />
                                  {registration.participant.email}
                                </span>
                                <span className="flex items-center gap-1 font-light">
                                  <Phone className="h-3 w-3" />
                                  {registration.participant.phoneNumber}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 font-light">
                                Registered: {formatDateTime(registration.registeredAt)}
                                {registration.attendanceTime && (
                                  <span className="ml-2">
                                    • Attended: {formatDateTime(registration.attendanceTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={registration.hasAttended ? 'default' : 'secondary'}
                              className={registration.hasAttended ? 'bg-green-100 text-green-800 rounded-xl' : 'bg-gray-100 text-gray-800 rounded-xl'}
                            >
                              {registration.hasAttended ? 'Attended' : 'Not Attended'}
                            </Badge>
                            <Badge variant="outline" className="rounded-xl">
                              {registration.registrationToken}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : selectedEventId ? (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-light">Loading attendance data...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">Pilih Event</h3>
                  <p className="text-gray-600 font-light">Pilih event untuk melihat data attendance</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>
    </OrganizerLayout>
  );
}
