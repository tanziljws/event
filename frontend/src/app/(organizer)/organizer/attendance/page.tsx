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
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />

          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Event Attendance</h1>
            <p className="text-slate-300 max-w-xl">
              Manage real-time check-ins, track attendance rates, and monitor participant status with our advanced QR scanning system.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && events.length === 0 ? (
          <SkeletonAttendance />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* QR Scanner Panel - Left Column */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-0 shadow-xl bg-white overflow-hidden ring-1 ring-slate-900/5">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <QrCode className="h-5 w-5" />
                    </div>
                    Scanner Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Event</label>
                    <div className="relative event-dropdown-container">
                      <input
                        type="text"
                        placeholder="Search event..."
                        value={selectedEvent ? selectedEvent.title : eventSearchQuery}
                        onChange={(e) => {
                          setEventSearchQuery(e.target.value);
                          setShowEventDropdown(true);
                          if (!e.target.value) setSelectedEventId('');
                        }}
                        onFocus={() => setShowEventDropdown(true)}
                        className="w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        disabled={loading}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                      {/* Dropdown */}
                      {showEventDropdown && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {filteredEvents.length > 0 ? (
                            filteredEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={() => {
                                  setSelectedEventId(event.id);
                                  setEventSearchQuery('');
                                  setShowEventDropdown(false);
                                }}
                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                              >
                                <div className="font-medium text-slate-900 truncate">{event.title}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(event.eventDate)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">No events found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Mode Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button
                      onClick={() => setCameraActive(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${cameraActive
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <Camera className="h-4 w-4" /> Camera
                    </button>
                    <button
                      onClick={() => setCameraActive(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${!cameraActive
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <Scan className="h-4 w-4" /> Manual
                    </button>
                  </div>

                  {/* Scanner/Input Area */}
                  <div className="min-h-[200px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {cameraActive ? (
                      <div className="w-full h-full">
                        <QRScanner
                          active={cameraActive}
                          onScan={handleCameraScan}
                          onError={(error) => {
                            handleError(error);
                            setCameraActive(false);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full p-4 space-y-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                            <QrCode className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">Enter token manually</p>
                        </div>
                        <input
                          type="text"
                          value={qrCodeData}
                          onChange={(e) => setQrCodeData(e.target.value)}
                          placeholder="Token code..."
                          className="w-full p-3 text-center font-mono text-lg border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleQRScan}
                    disabled={scanning || detectingEvent || (!qrCodeData.trim() && !scanResult.trim())}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
                  >
                    {scanning || detectingEvent ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Participant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Right Column */}
            <div className="lg:col-span-8 space-y-6">
              {selectedEventId && attendanceData ? (
                <>
                  {/* Event Info Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{attendanceData.event.title}</h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          {formatDate(attendanceData.event.eventDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-purple-500" />
                          {formatTime(attendanceData.event.eventTime)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-red-500" />
                          {attendanceData.event.location}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 h-fit w-fit">
                      Active Event
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Registrations */}
                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors" />
                      <p className="text-sm font-medium text-slate-500 relative z-10">Total Registrations</p>
                      <div className="mt-2 flex items-baseline gap-2 relative z-10">
                        <span className="text-3xl font-bold text-slate-900">
                          {attendanceData.statistics.totalRegistrations}
                        </span>
                        <span className="text-sm text-slate-400">people</span>
                      </div>
                      <div className="mt-4 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-500 w-full" />
                      </div>
                    </div>

                    {/* Attended */}
                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors" />
                      <p className="text-sm font-medium text-slate-500 relative z-10">Checked In</p>
                      <div className="mt-2 flex items-baseline gap-2 relative z-10">
                        <span className="text-3xl font-bold text-slate-900">
                          {attendanceData.statistics.attendedRegistrations}
                        </span>
                        <span className="text-sm text-slate-400">people</span>
                      </div>
                      <div className="mt-4 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-1000"
                          style={{ width: `${attendanceData.statistics.attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors" />
                      <p className="text-sm font-medium text-slate-500 relative z-10">Attendance Rate</p>
                      <div className="mt-2 flex items-baseline gap-2 relative z-10">
                        <span className="text-3xl font-bold text-slate-900">
                          {attendanceData.statistics.attendanceRate}%
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <Users className="h-3 w-3" />
                        Engagement Score
                      </div>
                    </div>
                  </div>

                  {/* Participants List */}
                  <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-slate-800">Participants</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-white">
                            {attendanceData.registrations.length} Total
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {attendanceData.registrations.map((registration) => (
                          <div
                            key={registration.id}
                            className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${registration.hasAttended ? 'bg-green-500' : 'bg-slate-300'
                                }`}>
                                {registration.participant.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{registration.participant.fullName}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {registration.participant.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {registration.participant.phoneNumber}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {registration.hasAttended ? (
                                <div className="text-right">
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                                    Checked In
                                  </Badge>
                                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                    {formatTime(new Date(registration.attendedAt!).toLocaleTimeString())}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Calendar className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No Event Selected</h3>
                  <p className="text-slate-500 max-w-sm mt-2">
                    Select an event from the scanner panel to view attendance statistics and participant details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
}
