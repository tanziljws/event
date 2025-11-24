'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Calendar, MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-utils'
import '@/app/homepage.css'

interface Event {
  id: string
  title: string
  eventDate: string
  eventTime: string
  location: string
  thumbnailUrl?: string | null
  category: string
  isHomepageFeatured?: boolean
  homepageOrder?: number | null
  _count?: {
    registrations: number
  }
}

export default function HomepageEventsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [availableEvents, setAvailableEvents] = useState<Event[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['', '', ''])

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || user?.role !== 'SUPER_ADMIN')) {
      router.push('/login')
      return
    }

    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      fetchData()
    }
  }, [isInitialized, isAuthenticated, user, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch featured events
      const featuredResponse = await ApiService.getHomepageFeaturedEvents()
      if (featuredResponse.success && featuredResponse.data?.events) {
        const events = featuredResponse.data.events
        setFeaturedEvents(events)
        // Set selected events based on homepageOrder
        const sortedEvents = [...events].sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0))
        const selected = ['', '', '']
        sortedEvents.forEach((event, index) => {
          if (index < 3) {
            selected[index] = event.id
          }
        })
        setSelectedEvents(selected)
      }

      // Fetch available events
      const availableResponse = await ApiService.getAvailableEventsForHomepage()
      if (availableResponse.success && availableResponse.data?.events) {
        setAvailableEvents(availableResponse.data.events)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch data',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = (index: number, eventId: string) => {
    const newSelected = [...selectedEvents]
    newSelected[index] = eventId
    setSelectedEvents(newSelected)
  }

  const handleSave = async () => {
    // Validate: must select exactly 3 unique events
    // Filter out empty strings and get valid event IDs
    const validEvents = selectedEvents.filter(id => id && typeof id === 'string' && id.trim() !== '')
    
    console.log('Selected events:', selectedEvents)
    console.log('Valid events:', validEvents)
    
    // Check if we have exactly 3 events
    if (validEvents.length !== 3) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Please select exactly 3 events. Currently selected: ${validEvents.length}`,
      })
      return
    }
    
    // Check for duplicates
    const uniqueEvents = [...new Set(validEvents)]
    if (uniqueEvents.length !== 3) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select 3 different events (no duplicates)',
      })
      return
    }

    try {
      setSaving(true)
      // Ensure we send exactly 3 event IDs as an array
      // Use the valid events array directly (already filtered and validated)
      const eventIdsToSend = validEvents.slice(0, 3)
      
      // Final validation before sending
      if (!Array.isArray(eventIdsToSend) || eventIdsToSend.length !== 3) {
        throw new Error(`Invalid event IDs array. Expected 3, got ${eventIdsToSend.length}`)
      }
      
      // Check for any empty or invalid IDs
      const invalidIds = eventIdsToSend.filter(id => !id || typeof id !== 'string' || id.trim() === '')
      if (invalidIds.length > 0) {
        throw new Error(`Invalid event IDs found: ${invalidIds.join(', ')}`)
      }
      
      console.log('Sending event IDs to API:', eventIdsToSend)
      console.log('Array length:', eventIdsToSend.length)
      console.log('Is array:', Array.isArray(eventIdsToSend))
      console.log('All IDs valid:', eventIdsToSend.every(id => id && typeof id === 'string' && id.trim() !== ''))
      
      const response = await ApiService.setHomepageFeaturedEvents(eventIdsToSend)
      
      if (response.success) {
        toast({
          variant: 'default',
          title: 'Success',
          description: 'Homepage featured events updated successfully',
        })
        await fetchData()
      } else {
        throw new Error(response.message || 'Failed to update featured events')
      }
    } catch (error: any) {
      console.error('Error saving featured events:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save featured events',
      })
    } finally {
      setSaving(false)
    }
  }

  const getEventById = (eventId: string) => {
    return availableEvents.find(e => e.id === eventId)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Homepage Featured Events</h1>
          <p className="text-gray-600 mt-2">
            Select 3 events to display on the homepage below the hero section
          </p>
        </div>

        {/* Live Preview Section */}
        <div className="mb-8 bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Preview</h2>
              <p className="text-gray-600">Preview how events will appear on the homepage</p>
            </div>
          </div>

          {/* Preview Section - Mimics Homepage */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-4xl font-bold text-blue-600 mb-8 text-center">EVENTS</h3>
            
            {selectedEvents.filter(id => id).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((index) => {
                  const eventId = selectedEvents[index]
                  const event = eventId ? getEventById(eventId) : null
                  
                  if (!event) {
                    return (
                      <div key={index} className="relative group">
                        <div className="event-card-container bg-gray-200 rounded-2xl overflow-hidden">
                          <div className="w-full h-[500px] bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium">Event {index + 1} - Not Selected</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const eventDate = event.eventDate ? new Date(event.eventDate) : null
                  const formattedDate = eventDate
                    ? eventDate.toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).toUpperCase()
                    : 'TBA'

                  const registrationCount = event._count?.registrations || 0
                  const maxParticipants = (event as any).maxParticipants || 0
                  let statusText = 'TICKETS AVAILABLE'
                  let statusColor = 'text-green-500'
                  
                  if (maxParticipants > 0 && registrationCount >= maxParticipants) {
                    statusText = 'SOLD OUT'
                    statusColor = 'text-red-500'
                  } else if (maxParticipants > 0 && registrationCount >= maxParticipants * 0.8) {
                    statusText = 'LIMITED SEATS'
                    statusColor = 'text-orange-500'
                  }

                  return (
                    <div key={event.id} className="text-left">
                      <div className="text-blue-600 text-lg font-bold mb-2">{formattedDate}</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2">{event.title}</h3>
                      <div className={`${statusColor} text-lg font-semibold`}>{statusText}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No events selected. Select events below to see preview.</p>
              </div>
            )}

            {/* Event Cards Preview */}
            {selectedEvents.filter(id => id).length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((index) => {
                  const eventId = selectedEvents[index]
                  const event = eventId ? getEventById(eventId) : null
                  
                  if (!event) {
                    return (
                      <div key={index} className="relative group">
                        <div className="event-card-container">
                          <div className="w-full h-[500px] bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium">Event {index + 1} - Not Selected</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={event.id}
                      className="relative group cursor-pointer"
                    >
                      <div className="event-card-container">
                        {event.thumbnailUrl ? (
                          <Image
                            src={getImageUrl(event.thumbnailUrl)}
                            alt={event.title}
                            width={600}
                            height={500}
                            className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <div className="text-center text-white">
                              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-lg font-medium">{event.title}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {(event as any).generateCertificate && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Certificate
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-lg font-semibold mb-1 line-clamp-2">{event.title}</h3>
                          <p className="text-sm text-gray-200 line-clamp-1">{event.location}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Event Selection */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select 3 Events for Homepage</h2>
          
          <div className="space-y-6">
            {[0, 1, 2].map((index) => {
              const selectedEvent = getEventById(selectedEvents[index])
              
              // Filter out events that are already selected in other slots
              const availableForThisSlot = availableEvents.filter((event) => {
                // Allow the currently selected event for this slot
                if (selectedEvents[index] === event.id) {
                  return true
                }
                // Filter out events that are selected in other slots
                return !selectedEvents.some((selectedId, otherIndex) => 
                  otherIndex !== index && selectedId === event.id
                )
              })
              
              return (
                <div key={index} className="border-2 border-gray-300 rounded-2xl p-6 bg-gray-50">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Event {index + 1}
                  </label>
                  
                  <select
                    value={selectedEvents[index]}
                    onChange={(e) => handleEventSelect(index, e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                  >
                    <option value="">Select an event...</option>
                    {availableForThisSlot.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {formatDate(event.eventDate)}
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="mt-4 p-4 bg-white border-2 border-gray-300 rounded-xl">
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-gray-400">
                          {selectedEvent.thumbnailUrl ? (
                            <Image
                              src={getImageUrl(selectedEvent.thumbnailUrl)}
                              alt={selectedEvent.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 text-gray-900">{selectedEvent.title}</h3>
                          <div className="text-sm text-gray-700 space-y-1 font-medium">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(selectedEvent.eventDate)} at {selectedEvent.eventTime}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {selectedEvent.location}
                            </div>
                            {selectedEvent._count?.registrations !== undefined && (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {selectedEvent._count.registrations} registrations
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Featured Events
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

