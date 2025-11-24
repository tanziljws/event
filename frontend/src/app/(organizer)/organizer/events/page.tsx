'use client'

import React, { useState, useEffect } from 'react'
import { getImageUrl } from '@/lib/image-utils'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import OrganizerLayout from '@/components/layout/organizer-layout'
import { PrivateEventManagementModal } from '@/components/ui/private-event-management-modal'
import { 
  Plus,
  Calendar,
  Users,
  MapPin,
  Clock,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Upload,
  CheckCircle,
  Lock,
  Award
} from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  eventTime: string
  location: string
  maxParticipants: number
  thumbnailUrl?: string
  status: string
  category: string
  price: number
  isFree: boolean
  isPublished: boolean
  isPrivate?: boolean
  privatePassword?: string
  generateCertificate?: boolean
  _count: {
    registrations: number
  }
}

export default function OrganizerEventsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPrivateModal, setShowPrivateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [generatingCertificates, setGeneratingCertificates] = useState<string | null>(null)

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
      if (user.role === 'ORGANIZER' && user.verificationStatus !== 'APPROVED') {
        router.push('/login')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'ORGANIZER' || user.role === 'ADMIN')) {
      fetchEvents()
    }
  }, [isAuthenticated, user])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getOrganizerEvents()
      
      if (response.success) {
        setEvents(response.data.events || [])
      } else {
        setError(response.message || 'Failed to fetch events')
      }
    } catch (err) {
      setError('Failed to fetch events')
      console.error('Fetch events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handlePublishEvent = async (eventId: string) => {
    try {
      setPublishing(eventId)
      const response = await ApiService.publishOrganizerEvent(eventId)
      
      if (response.success) {
        // Reload events to get updated status
        await fetchEvents()
        alert('Event published successfully!')
      } else {
        alert(response.message || 'Failed to publish event')
      }
    } catch (err) {
      console.error('Publish event error:', err)
      alert('Failed to publish event')
    } finally {
      setPublishing(null)
    }
  }


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT']
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const handlePrivateEventManagement = (event: Event) => {
    setSelectedEvent(event)
    setShowPrivateModal(true)
  }

  const handlePrivateEventSuccess = () => {
    // Reload events to reflect changes
    fetchEvents()
  }

  const handleGenerateCertificates = async (eventId: string) => {
    try {
      const confirmed = confirm(
        'Generate certificates untuk semua peserta yang sudah hadir pada event ini?\n\n' +
        'Ini akan membuat certificate untuk semua peserta yang sudah scan QR code.'
      )

      if (!confirmed) return

      setGeneratingCertificates(eventId)
      const response = await ApiService.bulkGenerateCertificates(eventId)

      if (response.success) {
        alert(`Berhasil! ${response.data.generatedCount || 0} certificate telah dibuat.`)
      } else {
        alert(response.message || 'Gagal generate certificates')
      }
    } catch (err: any) {
      console.error('Generate certificates error:', err)
      alert(err.response?.data?.message || 'Gagal generate certificates')
    } finally {
      setGeneratingCertificates(null)
    }
  }

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">Manage your events and track registrations</p>
        </div>
        <Button
          onClick={() => router.push('/organizer/events/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Event
        </Button>
      </div>

      {/* Events Grid */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started</p>
            <Button
              onClick={() => router.push('/organizer/events/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Event Image */}
              <div className="relative h-48 w-full overflow-hidden">
                {event.thumbnailUrl ? (
                  <img
                    src={getImageUrl(event.thumbnailUrl)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-blue-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(event.status)}
                </div>
              </div>

              <CardContent className="p-6">
                {/* Event Title with Private Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                    {event.title}
                  </h3>
                  <div className="ml-2 flex items-center gap-2">
                    {event.isPrivate && (
                      <div className="flex items-center px-2 py-1 rounded-full border border-red-300">
                        <Lock className="w-3 h-3 mr-1 text-red-600" />
                        <span className="text-xs font-medium text-red-600">PRIVATE</span>
                      </div>
                    )}
                    {event.generateCertificate && (
                      <div className="flex items-center px-2 py-1 rounded-full bg-amber-100 border border-amber-300">
                        <Award className="w-3 h-3 mr-1 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600">CERTIFICATE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.eventTime}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event._count.registrations}/{event.maxParticipants} participants</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-lg font-bold text-blue-600">
                    {event.isFree ? 'FREE' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {event.isPublished ? 'View' : 'Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/organizer/events/${event.id}/edit`)}
                      disabled={event.isPublished}
                      className="flex-1"
                      title={event.isPublished ? "Cannot edit published events" : "Edit event"}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrivateEventManagement(event)}
                      className="flex-1"
                      title="Manage private event settings"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      {event.isPrivate ? 'Private' : 'Public'}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    {event.generateCertificate && event.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCertificates(event.id)}
                        disabled={generatingCertificates === event.id}
                        className="flex-1 bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                        title="Generate certificates for all attended participants"
                      >
                        {generatingCertificates === event.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Award className="w-4 h-4 mr-1" />
                            Generate Certificates
                          </>
                        )}
                      </Button>
                    )}
                    {!event.isPublished && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublishEvent(event.id)}
                        disabled={publishing === event.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {publishing === event.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                    )}
                    {event.isPublished && !event.generateCertificate && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex-1 bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Published
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Private Event Management Modal */}
      {selectedEvent && (
        <PrivateEventManagementModal
          isOpen={showPrivateModal}
          onClose={() => {
            setShowPrivateModal(false)
            setSelectedEvent(null)
          }}
          onSuccess={handlePrivateEventSuccess}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          isPrivate={selectedEvent.isPrivate || false}
          currentPassword={selectedEvent.privatePassword}
        />
      )}
    </OrganizerLayout>
  )
}
