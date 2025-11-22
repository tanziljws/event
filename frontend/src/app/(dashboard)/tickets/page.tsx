'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiService } from '@/lib/api'
import { useError } from '@/contexts/error-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/ui/loading'
import { Calendar, Clock, MapPin, QrCode, Download, Eye, CheckCircle, XCircle, AlertTriangle, Ticket as TicketIcon, Shield } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const searchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'USED', 'CANCELLED', '']).optional(),
})

type SearchForm = z.infer<typeof searchSchema>

interface Ticket {
  id: string
  registrationToken: string
  qrCodeUrl?: string
  hasAttended: boolean
  registeredAt: string
  ticketTypeId?: string
  ticketType?: {
    id: string
    name: string
    description?: string
    price: number | null
    isFree: boolean
    color: string
    icon?: string
    badgeText?: string | null
  }
  event: {
    id: string
    title: string
    eventDate: string
    eventTime: string
    location: string
    isPublished: boolean
    price?: number | null
    isFree?: boolean
  }
  payment?: {
    id: string
    amount: number
    currency: string
    paymentStatus: string
    paidAt?: string
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const { handleError } = useError()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  // Move useForm before any conditional returns to follow Rules of Hooks
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
  })

  // Get watch values before any conditional returns
  const searchQuery = watch('search')
  const statusFilter = watch('status')

  // Define fetchTickets function before any conditional returns
  const fetchTickets = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true)
      const response = await ApiService.getMyTickets({
        page: pageNum,
        limit: 12,
        status: statusFilter || undefined,
      })

      if (response.success && response.data) {
        // Backend returns 'registrations' not 'tickets'
        const newTickets = response.data.registrations || []
        if (reset) {
          setTickets(newTickets)
        } else {
          setTickets(prev => [...prev, ...newTickets])
        }
        setTotalPages(response.data.pagination?.pages || 1)
        setHasMore(pageNum < (response.data.pagination?.pages || 1))
      }
    } catch (error) {
      handleError(error, 'Gagal memuat daftar tiket')
    } finally {
      setLoading(false)
    }
  }

  // All useEffect hooks before conditional returns
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        // Admin trying to access user tickets, redirect to 404 for security
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    fetchTickets(1, true)
  }, [searchQuery, statusFilter])

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

  const handleSearch = (data: SearchForm) => {
    setPage(1)
    fetchTickets(1, true)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTickets(nextPage, false)
  }

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    if (ticket.qrCodeUrl) {
      setQrCodeData(ticket.qrCodeUrl)
      setShowQRModal(true)
    } else {
      handleError(new Error('QR code tidak tersedia'), 'QR code belum tersedia untuk tiket ini')
    }
  }

  const handleDownloadTicket = (ticket: Ticket) => {
    // TODO: Implement ticket download functionality
    console.log('Download ticket:', ticket.registrationToken)
  }

  const getStatusInfo = (hasAttended: boolean) => {
    if (hasAttended) {
      return {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
        text: 'Sudah Hadir'
      }
    } else {
      return {
        color: 'bg-green-100 text-green-800',
        icon: Shield,
        text: 'Belum Hadir'
      }
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <TicketIcon className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Tiket Saya</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cari Tiket</CardTitle>
            <CardDescription>
              Temukan tiket event yang sudah Anda daftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    {...register('search')}
                    placeholder="Cari berdasarkan nomor tiket atau nama event..."
                    className="w-full"
                  />
                </div>
                <div>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="USED">Digunakan</option>
                    <option value="CANCELLED">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto">
                Cari Tiket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <TicketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada tiket</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Tidak ada tiket yang sesuai dengan pencarian Anda' : 'Anda belum memiliki tiket event'}
              </p>
              <Button onClick={() => router.push('/events')}>
                Lihat Event Tersedia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => {
              const statusInfo = getStatusInfo(ticket.hasAttended)
              const StatusIcon = statusInfo.icon
              const ticketColor = ticket.ticketType?.color || '#2563EB'
              const ticketTypeName = ticket.ticketType?.name || 'General Admission'
              const ticketPrice = ticket.ticketType?.price ?? ticket.event.price ?? null
              const isTicketFree = ticket.ticketType?.isFree ?? ticket.event.isFree ?? false
              
              // Format price
              const formatPrice = (price: number | null, isFree: boolean) => {
                if (isFree || price === null || price === 0) return 'Gratis'
                return `Rp ${price.toLocaleString('id-ID')}`
              }
              
              return (
                <Card 
                  key={ticket.id} 
                  className="hover:shadow-lg transition-shadow relative overflow-hidden"
                  style={{
                    borderLeft: `4px solid ${ticketColor}`
                  }}
                >
                  {/* Ticket Type Badge */}
                  {ticket.ticketType && (
                    <div 
                      className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold text-white shadow-md z-10"
                      style={{ backgroundColor: ticketColor }}
                    >
                      {ticketTypeName}
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2 pr-20">{ticket.event.title}</CardTitle>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <CardDescription>
                      Token: {ticket.registrationToken}
                    </CardDescription>
                    {ticket.ticketType && (
                      <div className="mt-2 flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ticketColor }}
                        ></div>
                        <span className="text-xs text-gray-600 font-medium">{ticketTypeName}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDateTime(ticket.event.eventDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {ticket.event.eventTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {ticket.event.location}
                    </div>
                    
                    {/* Price Display */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Harga:</span>
                      <span 
                        className="text-lg font-bold"
                        style={{ color: ticketColor }}
                      >
                        {formatPrice(ticketPrice, isTicketFree)}
                      </span>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <Button
                        onClick={() => handleViewQR(ticket)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                        disabled={!ticket.qrCodeUrl}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {ticket.qrCodeUrl ? 'Lihat QR Code' : 'QR Code Belum Tersedia'}
                      </Button>
                      <Button
                        onClick={() => handleDownloadTicket(ticket)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Tiket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
              size="lg"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Memuat...
                </>
              ) : (
                'Muat Lebih Banyak'
              )}
            </Button>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={`QR Code - ${selectedTicket?.event.title}`}
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            Token: {selectedTicket?.registrationToken}
          </div>
          {qrCodeData ? (
            <div className="flex justify-center">
              <img
                src={qrCodeData}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}
          <div className="text-xs text-gray-500">
            <p>Tunjukkan QR code ini saat check-in di event</p>
            <p>QR code ini hanya berlaku untuk event: {selectedTicket?.event.title}</p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button
              onClick={() => setShowQRModal(false)}
              variant="outline"
            >
              Tutup
            </Button>
            <Button
              onClick={() => handleDownloadTicket(selectedTicket!)}
              disabled={!selectedTicket}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
