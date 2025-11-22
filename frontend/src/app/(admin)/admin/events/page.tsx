'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonEventCard } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'
import { useAuth } from '@/contexts/auth-context'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  MapPin
} from 'lucide-react'

interface AdminEvent {
  id: string
  title: string
  description: string
  eventDate: string
  eventTime: string
  location: string
  maxParticipants: number
  registeredCount: number
  isPublished: boolean
  createdAt: string
  thumbnailUrl?: string
  creator: {
    id: string
    fullName: string
    email: string
  }
}

export default function AdminEventsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
      fetchEvents()
    }
  }, [page, search, sortBy, sortOrder, isAuthenticated, user])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getAdminEvents({
        page,
        limit: 12,
        search: search || undefined,
        sortBy,
        sortOrder
      })
      
      if (response.success) {
        // Map the events to include registeredCount from _count.registrations
        const mappedEvents = (response.data.events || []).map((event: any) => ({
          ...event,
          registeredCount: event._count?.registrations || 0
        }))
        setEvents(mappedEvents)
        setTotalPages(response.data.pagination?.pages || 1)
      } else {
        setError('Failed to fetch events')
      }
    } catch (err) {
      setError('Failed to fetch events')
      console.error('Events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchEvents()
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      const response = await ApiService.deleteAdminEvent(eventId)
      if (response.success) {
        fetchEvents() // Refresh the list
      } else {
        alert('Failed to delete event')
      }
    } catch (err) {
      alert('Failed to delete event')
      console.error('Delete error:', err)
    }
  }

  const handleTogglePublish = async (eventId: string) => {
    try {
      const response = await ApiService.toggleEventPublish(eventId)
      if (response.success) {
        fetchEvents() // Refresh the list
      } else {
        alert('Failed to toggle publish status')
      }
    } catch (err) {
      alert('Failed to toggle publish status')
      console.error('Toggle error:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5) // Format HH:MM
  }

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded-lg w-80 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonEventCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{
        __html: `
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
          
          /* From Uiverse.io by Sergestra - Modified for status-based colors */
          .publish-button {
            outline: 0;
            border: 0;
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 140px;
            height: 50px;
            border-radius: 0.5em;
            overflow: hidden;
          }
          
          .publish-button div {
            transform: translateY(0px);
            width: 100%;
          }
          
          .publish-button,
          .publish-button div {
            transition: 0.6s cubic-bezier(.16,1,.3,1);
          }
          
          .publish-button div span {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 50px;
            padding: 0.75em 1.125em;
          }
          
          .publish-button p {
            font-size: 17px;
            font-weight: bold;
            color: #ffffff;
          }
          
          .publish-button:active {
            transform: scale(0.95);
          }
          
          /* Published state - Green */
          .publish-button.published {
            box-shadow: 0 0.625em 1em 0 rgba(33, 220, 98, 0.35);
          }
          
          .publish-button.published div:nth-child(1) {
            background-color: #21dc62;
          }
          
          .publish-button.published div:nth-child(2) {
            background-color: #1e90ff;
          }
          
          .publish-button.published:hover div {
            transform: translateY(-50px);
          }
          
          /* Unpublished state - Blue */
          .publish-button.unpublished {
            box-shadow: 0 0.625em 1em 0 rgba(30, 143, 255, 0.35);
          }
          
          .publish-button.unpublished div:nth-child(1) {
            background-color: #1e90ff;
          }
          
          .publish-button.unpublished div:nth-child(2) {
            background-color: #21dc62;
          }
          
          .publish-button.unpublished:hover div {
            transform: translateY(-50px);
          }
        `
      }} />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage all events in your system</p>
        </div>
        <Link href="/admin/events/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="createdAt">Created Date</option>
              <option value="eventDate">Event Date</option>
              <option value="title">Title</option>
              <option value="maxParticipants">Participants</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchEvents}>Try Again</Button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
          <div className="mt-6">
            <Link href="/admin/events/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card bg-white rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Section */}
              <div className="relative h-64 w-full overflow-hidden">
                {event.thumbnailUrl ? (
                  <img
                    src={getImageUrl(event.thumbnailUrl)}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white/80 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <Calendar className="w-10 h-10 text-blue-600" />
                      </div>
                      <p className="text-blue-700 text-sm font-medium">Event Image</p>
                    </div>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 text-xs rounded-full font-semibold backdrop-blur-sm ${
                    event.isPublished 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-bold mb-1 line-clamp-2 drop-shadow-lg">
                    {event.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm font-medium">
                      {event.registeredCount}/{event.maxParticipants} participants
                    </span>
                    <span className="text-white/90 text-sm">Admin View</span>
                  </div>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-6 bg-white flex flex-col flex-grow">
                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-shrink-0">
                  {event.description}
                </p>
                
                {/* Event Details */}
                <div className="space-y-3 mb-6 flex-shrink-0">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{formatDate(event.eventDate)} at {formatTime(event.eventTime)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 text-gray-400 mr-3" />
                    <span>{event.registeredCount}/{event.maxParticipants} participants</span>
                  </div>
                </div>
                
                {/* Creator Info */}
                <div className="mb-4 flex-shrink-0">
                  <div className="text-xs text-gray-500">
                    Created by <span className="font-medium text-gray-700">{event.creator.fullName}</span>
                  </div>
                </div>
                
                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(event.id)}
                    className={`publish-button flex-1 ${event.isPublished ? 'published' : 'unpublished'}`}
                  >
                    <div>
                      <span>
                        <p>{event.isPublished ? 'Unpublish' : 'Publish'}</p>
                      </span>
                    </div>
                    <div>
                      <span>
                        <p>{event.isPublished ? 'Unpublish' : 'Publish'}</p>
                      </span>
                    </div>
                  </button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/events/${event.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
