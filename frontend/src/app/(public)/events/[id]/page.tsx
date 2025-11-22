'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { useError } from '@/contexts/error-context'
import { Button } from '@/components/ui/button'
import { TicketType, Event } from '@/types'
import TicketTypeSelector from '@/components/events/TicketTypeSelector'
import { PaymentModal } from '@/components/payment/payment-modal'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { handleError } = useError()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [registering, setRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userRegistration, setUserRegistration] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [currentPaymentUrl, setCurrentPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Always use public API for event details (no authentication required)
        const eventResponse = await ApiService.getPublicEventById(params.id as string)

        if (eventResponse.success) {
          const eventData = eventResponse.data.event
          setEvent(eventData)

          // If event has multiple ticket types, fetch ticket types
          if (eventData.hasMultipleTicketTypes) {
            try {
              const ticketTypesResponse = await ApiService.getEventTicketTypes(params.id as string, false)
              if (ticketTypesResponse.success) {
                setTicketTypes(ticketTypesResponse.data.ticketTypes || [])
              }
            } catch (error) {
              console.error('Error fetching ticket types:', error)
            }
          }
        } else {
          handleError(new Error('Event not found'), 'Gagal memuat detail event')
          return
        }

        // Check if user is already registered for this event (only for authenticated users)
        // We'll check authentication status without triggering redirects
        const hasToken = localStorage.getItem('accessToken')
        if (hasToken) {
          try {
            // User might be authenticated, try to check registration status
            const profileResponse = await ApiService.getProfile()
            if (profileResponse.success) {
              setIsAuthenticated(true)
              // User is authenticated, check registration status
              const registrationsResponse = await ApiService.getUserEventRegistrations()
              if (registrationsResponse.success) {
                const registrations = registrationsResponse.data.registrations || []
                const userRegistration = registrations.find((reg: any) => reg.eventId === params.id)

                if (userRegistration) {
                  setIsRegistered(true)
                  setUserRegistration(userRegistration)
                  console.log('User is already registered:', userRegistration)
                } else {
                  setIsRegistered(false)
                  setUserRegistration(null)
                  console.log('User is not registered for this event')
                }
              }
            } else {
              setIsAuthenticated(false)
              setIsRegistered(false)
              setUserRegistration(null)
            }
          } catch (error) {
            console.log('Could not check registration status:', error)
            setIsAuthenticated(false)
            setIsRegistered(false)
            setUserRegistration(null)
          }
        } else {
          // No token, user is definitely not authenticated
          setIsAuthenticated(false)
          setIsRegistered(false)
          setUserRegistration(null)
        }
      } catch (error) {
        handleError(error, 'Terjadi kesalahan saat memuat event')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, handleError])


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const eventDate = new Date(event.eventDate)
    const registrationDeadline = new Date(event.registrationDeadline)

    if (now > eventDate) {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800', text: 'Selesai' }
    } else if (now >= registrationDeadline) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800', text: 'Sedang Berlangsung' }
    } else {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', text: 'Akan Datang' }
    }
  }

  const getAvailabilityStatus = (event: Event) => {
    const maxParticipants = event.maxParticipants || 0
    const registeredCount = event.registeredCount || 0
    const percentage = maxParticipants > 0 ? (registeredCount / maxParticipants) * 100 : 0

    if (percentage >= 100) {
      return { text: 'Penuh', color: 'bg-red-100 text-red-800' }
    } else if (percentage >= 80) {
      return { text: 'Hampir Penuh', color: 'bg-orange-100 text-orange-800' }
    } else {
      return { text: 'Tersedia', color: 'bg-green-100 text-green-800' }
    }
  }

  const handleTicketTypeSelect = (ticketType: TicketType, quantity: number) => {
    setSelectedTicketType(ticketType)
    setSelectedQuantity(quantity)
  }

  const handleRegister = async () => {
    if (!event) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // For events with multiple ticket types, user MUST select a ticket type first (if paid)
    if (event.hasMultipleTicketTypes && !event.isFree) {
      if (!selectedTicketType) {
        alert('Silakan pilih tipe tiket terlebih dahulu.')
        return
      }
    }

    try {
      setRegistering(true)

      // Ambil data profil user
      const profileResponse = await ApiService.getProfile()
      if (!profileResponse.success) {
        alert('Gagal mengambil data profil. Silakan login ulang.')
        return
      }

      const userData = profileResponse.data.user

      console.log('User data from profile:', userData)

      // Validasi data wajib
      if (!userData.fullName || !userData.email) {
        alert('Data profil tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu.')
        return
      }

      // Check if event is free
      if (event.isFree) {
        // For free events, register directly
        let privatePassword = ''
        if (event.isPrivate) {
          privatePassword = prompt('This is a private event. Please enter the password to register:') || ''
          if (!privatePassword) {
            alert('Password is required to register for this private event.')
            return
          }
        }

        const response = await ApiService.registerForEvent(event.id, { privatePassword })

        if (response.success) {
          alert('Pendaftaran berhasil! Anda akan menerima konfirmasi via email.')
          setIsRegistered(true)
          setUserRegistration(response.data.registration)
          window.location.reload()
        } else {
          alert(`Gagal mendaftar: ${response.message || 'Terjadi kesalahan'}`)
        }
        return
      }

      // For paid events, create payment order first
      const ticketPrice = selectedTicketType?.price || event.price || 0
      const totalAmount = typeof ticketPrice === 'number' ? ticketPrice * selectedQuantity : parseFloat(ticketPrice.toString()) * selectedQuantity

      // Create payment order
      const paymentResponse = await ApiService.createEventPaymentOrder(event.id, {
        eventTitle: event.title,
        amount: totalAmount,
        customerName: userData.fullName,
        customerEmail: userData.email,
        customerPhone: userData.phoneNumber || '',
        paymentMethod: 'midtrans',
        ticketTypeId: selectedTicketType?.id || undefined,
        quantity: selectedQuantity,
      })

      if (paymentResponse.success) {
        const payment = paymentResponse.data.payment
        setPaymentAmount(totalAmount)
        setCurrentPaymentId(payment.id)
        setCurrentPaymentUrl(payment.paymentUrl || null)

        // If payment has paymentUrl (Midtrans), open payment page in new tab
        if (payment.paymentUrl) {
          window.open(payment.paymentUrl, '_blank')
        }
        // Show payment modal for status checking (will check payment status automatically)
        setShowPaymentModal(true)
      } else {
        alert(`Gagal membuat payment order: ${paymentResponse.message || 'Terjadi kesalahan'}`)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mendaftar'
      alert(`Gagal mendaftar: ${errorMessage}`)
    } finally {
      setRegistering(false)
    }
  }

  const handlePaymentSuccess = async () => {
    if (!event || !currentPaymentId) return

    try {
      // Register for event after payment
      const response = await ApiService.registerForEventAfterPayment(event.id, currentPaymentId)

      if (response.success) {
        alert('Pendaftaran berhasil! Anda akan menerima konfirmasi via email.')
        setIsRegistered(true)
        setUserRegistration(response.data.registration)
        setShowPaymentModal(false)
        window.location.reload()
      } else {
        alert(`Gagal mendaftar: ${response.message || 'Terjadi kesalahan'}`)
      }
    } catch (error: any) {
      console.error('Registration after payment error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mendaftar'
      alert(`Gagal mendaftar: ${errorMessage}`)
    }
  }

  const handleCancelRegistration = async () => {
    if (!event || !userRegistration) return

    try {
      setRegistering(true)

      // Konfirmasi pembatalan
      const confirmed = confirm(
        `Konfirmasi pembatalan pendaftaran untuk event "${event.title}"?\n\n` +
        `Anda akan kehilangan slot yang sudah terdaftar.`
      )

      if (!confirmed) return

      // Cancel registration
      const response = await ApiService.cancelEventRegistration(event.id)

      if (response.success) {
        alert('Pendaftaran berhasil dibatalkan.')
        // Update state
        setIsRegistered(false)
        setUserRegistration(null)
        // Refresh halaman untuk update status
        window.location.reload()
      } else {
        alert(`Gagal membatalkan pendaftaran: ${response.message || 'Terjadi kesalahan'}`)
      }
    } catch (error: any) {
      console.error('Cancel registration error:', error)
      console.error('Error response:', error.response?.data)

      // Show detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat membatalkan pendaftaran'
      alert(`Gagal membatalkan pendaftaran: ${errorMessage}`)
    } finally {
      setRegistering(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Event yang Anda cari tidak tersedia atau telah dihapus.</p>
          <Button onClick={handleBack} variant="primary">
            Kembali
          </Button>
        </div>
      </div>
    )
  }

  const eventStatus = getEventStatus(event)
  const availability = getAvailabilityStatus(event)
  const allImages = event.thumbnailUrl
    ? [event.thumbnailUrl, ...(event.galleryUrls || [])]
    : (event.galleryUrls || [])

  return (
    <>
      <style jsx global>{`
        .image-gallery {
          position: relative;
          overflow: hidden;
        }
        
        .gallery-image {
          transition: all 0.5s ease-in-out;
        }
        
        .gallery-image.active {
          opacity: 1;
          transform: scale(1);
        }
        
        .gallery-image.prev {
          opacity: 0;
          transform: translateX(-100%);
        }
        
        .gallery-image.next {
          opacity: 0;
          transform: translateX(100%);
        }
        
        .gallery-thumbnail {
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .gallery-thumbnail.active {
          border-color: #3b82f6;
          transform: scale(1.05);
        }
        
        .gallery-thumbnail:hover {
          transform: scale(1.1);
        }
        
        .fade-in {
          animation: fadeIn 0.6s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-[400px] bg-gray-900 overflow-hidden">
          {/* Background Image with Blur */}
          <div className="absolute inset-0">
            {allImages.length > 0 ? (
              <img
                src={allImages[0]}
                alt="Event Background"
                className="w-full h-full object-cover opacity-50 blur-sm scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-900 opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${eventStatus.color} backdrop-blur-md bg-opacity-90`}>
                {eventStatus.text}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${availability.color} backdrop-blur-md bg-opacity-90`}>
                {availability.text}
              </span>
              {!event.isPublished && (
                <span className="px-3 py-1 text-sm rounded-full font-medium bg-yellow-100 text-yellow-800">
                  Preview Mode
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight shadow-sm">
              {event.title}
            </h1>

            <div className="flex items-center text-gray-300 space-x-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDateTime(event.eventDate)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-6 left-4 sm:left-6 lg:left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Image Gallery */}
              {allImages.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                  <div className="image-gallery aspect-video relative">
                    {allImages.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${event.title} - Image ${index + 1}`}
                        className={`gallery-image absolute inset-0 w-full h-full object-cover ${index === currentImageIndex ? 'active' :
                          index < currentImageIndex ? 'prev' : 'next'
                          }`}
                      />
                    ))}

                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev =>
                            prev === 0 ? allImages.length - 1 : prev - 1
                          )}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev =>
                            prev === allImages.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Navigation */}
                  {allImages.length > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {allImages.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`gallery-thumbnail flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Event Description */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 fade-in">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Tentang Event</h2>
                </div>

                {event.description ? (
                  <div className="prose prose-lg prose-blue max-w-none text-gray-600">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <p className="italic">Deskripsi event belum tersedia.</p>
                  </div>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 fade-in">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Informasi Lengkap</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Tanggal</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDateTime(event.eventDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Waktu</p>
                      <p className="text-lg font-semibold text-gray-900">{formatTime(event.eventTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Lokasi</p>
                      <p className="text-lg font-semibold text-gray-900">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Peserta</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {event.registeredCount || 0} <span className="text-gray-400 text-base font-normal">/ {event.maxParticipants || 0}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Deadline</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDateTime(event.registrationDeadline)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Kategori</p>
                      <p className="text-lg font-semibold text-gray-900">{event.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Types Selector (if event has multiple ticket types) */}
              {event.hasMultipleTicketTypes && ticketTypes.length > 0 && !isRegistered && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 fade-in">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">Pilih Tipe Tiket</h3>
                  </div>
                  <TicketTypeSelector
                    ticketTypes={ticketTypes}
                    selectedTicketTypeId={selectedTicketType?.id}
                    quantity={selectedQuantity}
                    onTicketTypeSelect={handleTicketTypeSelect}
                    disabled={registering || !event.isPublished}
                  />
                  {selectedTicketType && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Total:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {selectedTicketType.isFree ? 'Gratis' : `Rp ${((selectedTicketType.price || 0) * selectedQuantity).toLocaleString('id-ID')}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedQuantity} x {selectedTicketType.name}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Booking Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 fade-in sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>

                {event.hasMultipleTicketTypes && !selectedTicketType ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Belum ada tiket yang dipilih</p>
                    <p className="text-sm text-gray-500">Silakan pilih tipe tiket di samping untuk melanjutkan pendaftaran.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {/* Selected Item Detail */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {event.hasMultipleTicketTypes && selectedTicketType
                                ? selectedTicketType.name
                                : 'Tiket Event'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.hasMultipleTicketTypes && selectedTicketType
                                ? `${selectedQuantity} x ${selectedTicketType.isFree ? 'Gratis' : `Rp ${(selectedTicketType.price || 0).toLocaleString('id-ID')}`}`
                                : (event.isFree ? 'Gratis' : `Rp ${(typeof event.price === 'number' ? event.price : parseFloat(event.price?.toString() || '0')).toLocaleString('id-ID')}`)}
                            </p>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {event.hasMultipleTicketTypes && selectedTicketType
                              ? (selectedTicketType.isFree ? 'Gratis' : `Rp ${((selectedTicketType.price || 0) * selectedQuantity).toLocaleString('id-ID')}`)
                              : (event.isFree ? 'Gratis' : `Rp ${(typeof event.price === 'number' ? event.price : parseFloat(event.price?.toString() || '0')).toLocaleString('id-ID')}`)
                            }
                          </div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className="text-lg font-semibold text-gray-900">Total Bayar</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {event.hasMultipleTicketTypes && selectedTicketType
                            ? (selectedTicketType.isFree ? 'Gratis' : `Rp ${((selectedTicketType.price || 0) * selectedQuantity).toLocaleString('id-ID')}`)
                            : (event.isFree ? 'Gratis' : `Rp ${(typeof event.price === 'number' ? event.price : parseFloat(event.price?.toString() || '0')).toLocaleString('id-ID')}`)
                          }
                        </span>
                      </div>

                      {/* Capacity Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-2 rounded text-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          {event.hasMultipleTicketTypes && selectedTicketType
                            ? `Sisa ${(selectedTicketType.remainingCapacity ?? (selectedTicketType.capacity - (selectedTicketType.soldCount || 0))) - selectedQuantity} tiket`
                            : `Sisa ${(event.maxParticipants || 0) - (event.registeredCount || 0) - selectedQuantity} slot`
                          }
                        </p>
                      </div>
                    </div>

                    {isRegistered && (
                      <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-800 font-medium">Sudah Terdaftar</span>
                        </div>
                        {userRegistration && (
                          <div className="text-xs text-green-600 mt-1 text-center">
                            {new Date(userRegistration.registeredAt).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={isRegistered ? handleCancelRegistration : handleRegister}
                      variant={isRegistered ? "secondary" : "primary"}
                      className="w-full h-12 text-lg shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
                      disabled={
                        registering ||
                        !event.isPublished ||
                        (event.hasMultipleTicketTypes && !event.isFree && !selectedTicketType) ||
                        (!isRegistered && event.hasMultipleTicketTypes && selectedTicketType && (selectedTicketType.remainingCapacity ?? (selectedTicketType.capacity - (selectedTicketType.soldCount || 0))) < selectedQuantity) ||
                        (!isRegistered && !event.hasMultipleTicketTypes && (event.registeredCount || 0) >= (event.maxParticipants || 0)) ||
                        (!isRegistered && new Date() > new Date(event.registrationDeadline)) ||
                        (!isRegistered && new Date() > new Date(`${event.eventDate}T${event.eventTime}`))
                      }
                    >
                      {registering ? (isRegistered ? 'Membatalkan...' : 'Memproses...') :
                        isRegistered ? 'Batalkan Pendaftaran' :
                          !isAuthenticated ? 'Login untuk Daftar' :
                            !event.isPublished ? 'Event Belum Rilis' :
                              event.hasMultipleTicketTypes && !event.isFree && !selectedTicketType ? 'Pilih Tiket Dulu' :
                                event.hasMultipleTicketTypes && selectedTicketType && (selectedTicketType.remainingCapacity ?? (selectedTicketType.capacity - (selectedTicketType.soldCount || 0))) < selectedQuantity ? 'Stok Kurang' :
                                  !event.hasMultipleTicketTypes && (event.registeredCount || 0) >= (event.maxParticipants || 0) ? 'Kuota Penuh' :
                                    new Date() > new Date(event.registrationDeadline) ? 'Pendaftaran Tutup' :
                                      new Date() > new Date(`${event.eventDate}T${event.eventTime}`) ? 'Event Dimulai' :
                                        'Daftar Sekarang'}
                    </Button>
                  </>
                )}
              </div>

              {/* Organizer Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 fade-in">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Penyelenggara</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.creator?.fullName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{event.creator?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 fade-in">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Event</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat</span>
                    <span className="text-gray-900">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${eventStatus.color}`}>
                      {eventStatus.text}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publikasi</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${event.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {event.isPublished ? 'Dipublish' : 'Belum Dipublish'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ketersediaan</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${availability.color}`}>
                      {availability.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <span className="text-xl font-semibold text-gray-900">Event Management</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Platform manajemen event paling canggih untuk tim modern. Buat, kelola, dan skalakan event dengan tools yang dirancang untuk dunia modern.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">📧</a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">🐦</a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">💼</a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">📱</a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h6 className="text-sm font-semibold text-gray-900 mb-4">Produk</h6>
              <div className="space-y-3">
                <a href="/events" className="block text-gray-600 hover:text-gray-900 transition-colors">Lihat Event</a>
                <a href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</a>
                <a href="/login" className="block text-gray-600 hover:text-gray-900 transition-colors">Masuk</a>
                <a href="/register" className="block text-gray-600 hover:text-gray-900 transition-colors">Daftar</a>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h6 className="text-sm font-semibold text-gray-900 mb-4">Perusahaan</h6>
              <div className="space-y-3">
                <a href="/about" className="block text-gray-600 hover:text-gray-900 transition-colors">Tentang</a>
                <a href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</a>
                <a href="/careers" className="block text-gray-600 hover:text-gray-900 transition-colors">Karir</a>
                <a href="/blog" className="block text-gray-600 hover:text-gray-900 transition-colors">Blog</a>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 text-sm mb-4 md:mb-0">
                © 2025 Event Management System. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privasi</a>
                <a href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Syarat</a>
                <a href="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">Cookies</a>
                <a href="/security" className="text-gray-600 hover:text-gray-900 transition-colors">Keamanan</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && currentPaymentId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setCurrentPaymentId(null)
            setCurrentPaymentUrl(null)
          }}
          eventTitle={event?.title || ''}
          eventPrice={paymentAmount}
          paymentId={currentPaymentId}
          paymentUrl={currentPaymentUrl || undefined}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}