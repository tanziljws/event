'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'
import { EventRegistration } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Download, Award, Shield, User, ArrowRight, Filter, Search, Eye, FileText, TrendingUp, Users, QrCode, X, Copy, Share2, Ticket as TicketIcon } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import Footer from '@/components/layout/footer'

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasAttendedFilter, setHasAttendedFilter] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<{ qrCodeUrl: string, eventTitle: string, registrationToken: string, ticketColor?: string, eventDate?: string, eventTime?: string } | null>(null)
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  // Base URL for file access
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://web-production-38c7.up.railway.app'

  // Strict user role protection - admin should not access user registrations
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        // Admin trying to access user registrations, redirect to 404 for security
        router.push('/404')
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getUserEventRegistrations({
        page,
        limit: 10,
        hasAttended: hasAttendedFilter
      })

      if (response.success) {
        setRegistrations(response.data.registrations)
        setTotalPages(response.data.totalPages)
      } else {
        setError(response.message || 'Failed to load registrations')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading registrations')
    } finally {
      setLoading(false)
    }
  }

  // Load registrations when component mounts or dependencies change
  useEffect(() => {
    loadRegistrations()
  }, [page, hasAttendedFilter])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTicketModal) {
        handleCloseModal()
      }
    }

    if (showTicketModal) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [showTicketModal])


  // Show loading while checking authentication and role
  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If admin, show loading while redirecting to 404
  if (user.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const handleGenerateCertificate = async (registrationId: string) => {
    try {
      const response = await ApiService.generateCertificate(registrationId)
      if (response.success) {
        alert('Certificate generated successfully!')
        loadRegistrations() // Reload to get updated data
      } else {
        alert(response.message || 'Failed to generate certificate')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDownloadCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank')
  }

  const handleViewTicket = (qrCodeUrl: string, eventTitle: string, registrationToken: string, ticketColor?: string, eventDate?: string, eventTime?: string) => {
    // Show modal with ticket details
    setSelectedTicket({ qrCodeUrl, eventTitle, registrationToken, ticketColor, eventDate, eventTime })
    setShowTicketModal(true)
  }

  const handleCloseModal = () => {
    setShowTicketModal(false)
    setSelectedTicket(null)
  }

  const handleCopyToken = async () => {
    if (selectedTicket) {
      try {
        await navigator.clipboard.writeText(selectedTicket.registrationToken)
        // You could add a toast notification here
        alert('Token berhasil disalin!')
      } catch (err) {
        console.error('Failed to copy token:', err)
        alert('Gagal menyalin token')
      }
    }
  }

  const handleDownloadTicket = () => {
    if (!selectedTicket) return
    
    // Create a download-friendly version of the ticket (same as print but for download)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://web-production-38c7.up.railway.app";
    const qrCodeUrl = `${baseUrl}${selectedTicket.qrCodeUrl}`
    
    // Format expired date
    const expiredDateText = selectedTicket.eventDate && selectedTicket.eventTime
      ? (() => {
          try {
            const eventDate = new Date(selectedTicket.eventDate)
            const [hours, minutes] = selectedTicket.eventTime.split(':')
            eventDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
            return eventDate.toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch (e) {
            return 'Tidak tersedia'
          }
        })()
      : 'Tidak tersedia'

    const ticketColor = selectedTicket.ticketColor || '#2563EB'

    // Create a new window for download
    const downloadWindow = window.open('', '_blank')
    if (!downloadWindow) return

    downloadWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>E-Ticket - ${selectedTicket.eventTitle}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 20px;
              background: white;
              color: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .ticket-container {
              width: 400px;
              max-width: 100%;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .ticket-header {
              background: ${ticketColor};
              color: white;
              padding: 30px 20px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .ticket-header::before {
              content: '';
              position: absolute;
              top: -40px;
              right: -40px;
              width: 150px;
              height: 150px;
              background: rgba(255,255,255,0.1);
              border-radius: 50%;
            }
            .ticket-header::after {
              content: '';
              position: absolute;
              bottom: -40px;
              left: -40px;
              width: 120px;
              height: 120px;
              background: rgba(255,255,255,0.1);
              border-radius: 50%;
            }
            .ticket-header h3 {
              font-size: 14px;
              font-weight: 500;
              opacity: 0.9;
              margin-bottom: 6px;
              position: relative;
              z-index: 1;
            }
            .ticket-header h2 {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 10px;
              position: relative;
              z-index: 1;
              line-height: 1.2;
            }
            .ticket-header .token {
              display: inline-block;
              padding: 6px 12px;
              background: rgba(255,255,255,0.2);
              backdrop-filter: blur(10px);
              border-radius: 9999px;
              font-size: 12px;
              font-family: monospace;
              letter-spacing: 1px;
              position: relative;
              z-index: 1;
            }
            .ticket-body {
              padding: 30px 20px;
            }
            .qr-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .qr-code {
              width: 200px;
              height: 200px;
              margin: 0 auto 15px;
              padding: 15px;
              border: 2px dashed #e5e7eb;
              border-radius: 12px;
              background: white;
            }
            .qr-section p {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .divider {
              border-top: 2px dashed #f3f4f6;
              margin: 25px 0;
              position: relative;
            }
            .divider::before,
            .divider::after {
              content: '';
              position: absolute;
              width: 20px;
              height: 20px;
              background: #f3f4f6;
              border-radius: 50%;
              top: -10px;
            }
            .divider::before {
              left: -50px;
            }
            .divider::after {
              right: -50px;
            }
            .details {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .detail-label {
              font-size: 12px;
              color: #9ca3af;
            }
            .detail-value {
              font-size: 12px;
              font-weight: 500;
              color: #000;
              font-family: monospace;
            }
            .expired-date {
              font-size: 12px;
              font-weight: 500;
              color: #000;
            }
            @media print {
              body {
                padding: 0;
              }
              .ticket-container {
                box-shadow: none;
                width: 100%;
                max-width: 400px;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-header">
              <h3>E-Ticket Event</h3>
              <h2>${selectedTicket.eventTitle}</h2>
              <div class="token">${selectedTicket.registrationToken}</div>
            </div>
            <div class="ticket-body">
              <div class="qr-section">
                <div class="qr-code">
                  <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
                <p>Scan to Check-in</p>
              </div>
              <div class="divider"></div>
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Token</span>
                  <span class="detail-value">${selectedTicket.registrationToken}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Berlaku Hingga</span>
                  <span class="expired-date">${expiredDateText}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    downloadWindow.document.close()
    
    // Wait for image to load, then trigger print/download
    setTimeout(() => {
      downloadWindow.print()
    }, 500)
  }


  const filteredRegistrations = registrations.filter(registration => {
    // Filter by search query
    const matchesSearch = registration.event?.title.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by attendance status
    const matchesAttendance = hasAttendedFilter === undefined
      ? true
      : registration.hasAttended === hasAttendedFilter

    return matchesSearch && matchesAttendance
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .event-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(229, 231, 235, 0.5);
          }
          
          .event-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            border-color: rgba(59, 130, 246, 0.2);
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search and Filters */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-light text-gray-900 mb-4">Pendaftaran Event</h2>
            <p className="text-gray-600 font-light">Cari dan filter pendaftaran event Anda</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="Cari event berdasarkan nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={hasAttendedFilter === undefined ? 'primary' : 'outline'}
                  onClick={() => setHasAttendedFilter(undefined)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${hasAttendedFilter === undefined
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                    }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Semua ({registrations.length})
                </Button>
                <Button
                  variant={hasAttendedFilter === true ? 'primary' : 'outline'}
                  onClick={() => setHasAttendedFilter(true)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${hasAttendedFilter === true
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600 hover:shadow-md'
                    }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sudah Hadir ({registrations.filter(r => r.hasAttended).length})
                </Button>
                <Button
                  variant={hasAttendedFilter === false ? 'primary' : 'outline'}
                  onClick={() => setHasAttendedFilter(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${hasAttendedFilter === false
                    ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-md'
                    }`}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Belum Hadir ({registrations.filter(r => !r.hasAttended).length})
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            {registrations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Rata-rata kehadiran: {Math.round((registrations.filter(r => r.hasAttended).length / registrations.length) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Sertifikat tersedia: {registrations.filter(r => r.certificateUrl).length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Registrations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRegistrations.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Belum Ada Pendaftaran</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada pendaftaran yang sesuai dengan pencarian Anda.'
                  : 'Anda belum mendaftar untuk event apapun. Mulai jelajahi event menarik sekarang!'
                }
              </p>
              {!searchQuery && (
                <Link href="/events">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                    <span>Jelajahi Event</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="col-span-full space-y-6">
              {filteredRegistrations.map((registration) => {
                const getEventStatus = (registration: any) => {
                  const now = new Date()
                  const eventDate = new Date(`${registration.event?.eventDate}T${registration.event?.eventTime}`)

                  if (now < eventDate) {
                    return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' }
                  } else if (now >= eventDate) {
                    return { status: 'completed', color: 'bg-gray-100 text-gray-800' }
                  } else {
                    return { status: 'ongoing', color: 'bg-green-100 text-green-800' }
                  }
                }

                const getAvailabilityStatus = (registration: any) => {
                  const maxParticipants = registration.event?.maxParticipants || 0
                  const registeredCount = registration.event?._count?.registrations || 0

                  // Jika data tidak tersedia, tampilkan status berdasarkan event
                  if (maxParticipants === 0) {
                    return { status: 'unknown', color: 'bg-gray-100 text-gray-800', text: 'Data tidak tersedia' }
                  }

                  const available = maxParticipants - registeredCount

                  if (available <= 0) {
                    return { status: 'full', color: 'bg-red-100 text-red-800', text: 'Penuh' }
                  } else if (available <= 5) {
                    return { status: 'limited', color: 'bg-yellow-100 text-yellow-800', text: `${available} slot tersisa` }
                  } else {
                    return { status: 'available', color: 'bg-green-100 text-green-800', text: `${available} slot tersisa` }
                  }
                }

                const eventStatus = getEventStatus(registration)
                const availability = getAvailabilityStatus(registration)
                const ticketColor = registration.ticketType?.color || '#2563EB'

                return (
                  <div
                    key={registration.id}
                    className="group relative w-full bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Side - Main Content (70%) */}
                      <div className="flex-1 p-6 md:p-8 relative">
                        {/* Event Details */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="mb-2 border-gray-300 text-black bg-gray-50">
                                {registration.event?.category || 'Event'}
                              </Badge>
                              {registration.ticketType && (
                                <span
                                  className="px-3 py-1 text-xs font-bold rounded-full text-white shadow-sm"
                                  style={{ backgroundColor: ticketColor }}
                                >
                                  {registration.ticketType.name}
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-bold text-black mb-2 line-clamp-1 transition-colors">
                              {registration.event?.title}
                            </h3>

                            <div className="space-y-2 text-black mb-4">
                              <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                {formatDateTime(registration.event?.eventDate || '')}
                              </div>
                              <div className="flex items-center text-sm">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                {registration.event?.eventTime || 'Waktu belum ditentukan'}
                              </div>
                              <div className="flex items-center text-sm">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="line-clamp-1">{registration.event?.location || 'Lokasi belum ditentukan'}</span>
                              </div>
                              {registration.event?.eventDate && (
                                <div className="flex items-center text-sm">
                                  <Shield className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-gray-600">
                                    Berlaku hingga:{' '}
                                    <span className="font-medium text-black">
                                      {(() => {
                                        try {
                                          const eventDate = new Date(registration.event.eventDate)
                                          const eventTime = registration.event.eventTime || '00:00'
                                          const [hours, minutes] = eventTime.split(':')
                                          eventDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
                                          
                                          return eventDate.toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        } catch (e) {
                                          return 'Tidak tersedia'
                                        }
                                      })()}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${eventStatus.color}`}>
                                {eventStatus.status === 'upcoming' ? 'Akan Datang' :
                                  eventStatus.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}>
                                {availability.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Separator Line & Notches */}
                      <div className="relative flex md:flex-col items-center justify-center">
                        {/* Desktop Line (Vertical) */}
                        <div className="hidden md:block h-[80%] w-px border-l-2 border-dashed border-gray-300"></div>
                        {/* Mobile Line (Horizontal) */}
                        <div className="md:hidden w-[80%] h-px border-t-2 border-dashed border-gray-300 my-4"></div>

                        {/* Notches - Bigger for more prominent curve */}
                        <div className="absolute -top-4 md:-top-4 left-1/2 md:left-auto md:-top-4 w-8 h-8 bg-gray-50 rounded-full transform -translate-x-1/2 md:translate-x-0 z-10 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.15)]"></div>
                        <div className="absolute -bottom-4 md:-bottom-4 left-1/2 md:left-auto md:-bottom-4 w-8 h-8 bg-gray-50 rounded-full transform -translate-x-1/2 md:translate-x-0 z-10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)]"></div>
                      </div>

                      {/* Right Side - Stub / Actions (30%) */}
                      <div
                        className="w-full md:w-80 p-6 md:p-8 flex flex-col items-center justify-center border-l-0 md:border-l border-dashed border-white/20 relative"
                        style={{ backgroundColor: ticketColor }}
                      >
                        {/* Lanyard Hole Visual */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/30 rounded-full shadow-inner"></div>

                        <div className="text-center w-full space-y-4 mt-4">
                          {/* Status Badge */}
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${registration.hasAttended ? 'bg-white/90 text-green-700' : 'bg-white/90 text-orange-700'
                            }`}>
                            {registration.hasAttended ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Sudah Hadir</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" /> Belum Hadir</>
                            )}
                          </div>

                          {/* Nusa Event Logo */}
                          <div className="mx-auto w-28 h-28 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <img
                              src="/nusaevent-logo.png"
                              alt="Nusa Event"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <p className="text-xs text-white/80 font-mono tracking-wider">
                            {registration.registrationToken}
                          </p>

                          <div className="grid grid-cols-1 gap-2 w-full">
                            {registration.qrCodeUrl && (
                              <Button
                                onClick={() => handleViewTicket(
                                  registration.qrCodeUrl!, 
                                  registration.event?.title || 'Event', 
                                  registration.registrationToken,
                                  registration.ticketType?.color,
                                  registration.event?.eventDate,
                                  registration.event?.eventTime
                                )}
                                className="w-full bg-white/90 text-gray-900 hover:bg-white rounded-xl h-9 text-xs shadow-md backdrop-blur-sm"
                              >
                                <QrCode className="w-3 h-3 mr-2" />
                                Lihat Tiket
                              </Button>
                            )}

                            {registration.certificateUrl && (
                              <Button
                                onClick={() => handleDownloadCertificate(registration.certificateUrl!)}
                                variant="outline"
                                className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-xl h-9 text-xs backdrop-blur-sm"
                              >
                                <Award className="w-3 h-3 mr-2" />
                                Sertifikat
                              </Button>
                            )}

                            <Button
                              onClick={() => router.push(`/events/${registration.event?.id}`)}
                              variant="ghost"
                              className="w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl h-9 text-xs"
                            >
                              Detail Event
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-blue-600">
                    Halaman {page} dari {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-sm mx-auto transform transition-all duration-500 ease-in-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideInFromTop 0.5s ease-in-out'
            }}
          >
            {/* Ticket Container */}
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
              {/* Ticket Header */}
              <div 
                className="p-6 text-white relative overflow-hidden"
                style={{ backgroundColor: selectedTicket.ticketColor || '#2563EB' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                <div className="relative z-10 text-center">
                  <h3 className="text-lg font-medium opacity-90 mb-1">E-Ticket Event</h3>
                  <h2 className="text-2xl font-bold leading-tight mb-2">{selectedTicket.eventTitle}</h2>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm">
                    <span className="font-mono tracking-wider">{selectedTicket.registrationToken}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-8 bg-white relative">
                {/* Cutouts */}
                <div className="absolute -left-4 top-0 w-8 h-8 bg-black/60 rounded-full"></div>
                <div className="absolute -right-4 top-0 w-8 h-8 bg-black/60 rounded-full"></div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 shadow-sm mb-4">
                    <img
                      src={`${baseUrl}${selectedTicket.qrCodeUrl}`}
                      alt="Event Ticket QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Scan to Check-in</p>
                </div>

                {/* Divider */}
                <div className="border-t-2 border-dashed border-gray-100 my-6 relative">
                  <div className="absolute -left-12 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>
                  <div className="absolute -right-12 -top-3 w-6 h-6 bg-gray-100 rounded-full"></div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Token</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-gray-900">{selectedTicket.registrationToken}</span>
                      <button
                        onClick={handleCopyToken}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: selectedTicket.ticketColor || '#2563EB' }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {selectedTicket.eventDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Berlaku Hingga</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {(() => {
                            try {
                              const eventDate = new Date(selectedTicket.eventDate)
                              const eventTime = selectedTicket.eventTime || '00:00'
                              const [hours, minutes] = eventTime.split(':')
                              eventDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
                              
                              return eventDate.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            } catch (e) {
                              return 'Tidak tersedia'
                            }
                          })()}
                        </span>
                  </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <Button
                    onClick={handleDownloadTicket}
                    className="text-white rounded-xl py-6 shadow-lg shadow-gray-200 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: selectedTicket.ticketColor || '#1F2937' }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleCloseModal}
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl py-6"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

