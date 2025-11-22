'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
import OrganizerLayout from '@/components/layout/organizer-layout'
import { 
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Settings,
  Upload,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react'

interface EventFormData {
  title: string
  description: string
  eventDate: string
  eventTime: string
  location: string
  maxParticipants: number
  registrationDeadline: string
  category: string
  price: number
  isFree: boolean
  generateCertificate: boolean
  thumbnailUrl: string
  galleryUrls: string[]
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'basic' | 'details' | 'media' | 'settings'>('basic')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    maxParticipants: 100,
    registrationDeadline: '',
    category: 'OTHER',
    price: 0,
    isFree: true,
    generateCertificate: false,
    thumbnailUrl: '',
    galleryUrls: []
  })

  const eventId = params.id as string

  // Section navigation functions
  const changeSection = (section: 'basic' | 'details' | 'media' | 'settings') => {
    const currentIndex = ['basic', 'details', 'media', 'settings'].indexOf(activeSection)
    const newIndex = ['basic', 'details', 'media', 'settings'].indexOf(section)
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left')
    setActiveSection(section)
  }

  // Completion tracking
  const completion = useMemo(() => {
    return {
      basic: !!(formData.title && formData.description && formData.location),
      details: !!(formData.eventDate && formData.eventTime && formData.registrationDeadline && formData.maxParticipants),
      media: true, // Media is optional
      settings: !!(formData.category && (formData.isFree || formData.price > 0))
    }
  }, [formData])

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (user.role !== 'ORGANIZER' || user.verificationStatus !== 'APPROVED') {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && eventId) {
      fetchEventDetails()
    }
  }, [isAuthenticated, user, eventId])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getOrganizerEventById(eventId)
      
      if (data.success) {
        const event = data.data.event
        
        // Security check: Block editing published events
        if (event.isPublished) {
          setError('Cannot edit published events. Please unpublish the event first.')
          return
        }
        
        setFormData({
          title: event.title,
          description: event.description,
          eventDate: event.eventDate.split('T')[0], // Convert to YYYY-MM-DD format
          eventTime: event.eventTime,
          location: event.location,
          maxParticipants: event.maxParticipants,
          registrationDeadline: event.registrationDeadline.split('T')[0],
          category: event.category,
          price: event.price || 0,
          isFree: event.isFree,
          generateCertificate: event.generateCertificate,
          thumbnailUrl: event.thumbnailUrl || '',
          galleryUrls: event.galleryUrls || []
        })
      } else {
        setError('Event not found')
      }
    } catch (err) {
      setError('Failed to fetch event details')
      console.error('Event details error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const data = await ApiService.updateOrganizerEvent(eventId, {
        title: formData.title,
        description: formData.description,
        eventDate: new Date(formData.eventDate).toISOString(),
        eventTime: formData.eventTime,
        location: formData.location,
        maxParticipants: formData.maxParticipants,
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        category: formData.category,
        price: formData.isFree ? 0 : formData.price,
        isFree: formData.isFree,
        generateCertificate: formData.generateCertificate
      })
      
      if (data.success) {
        router.push('/organizer/events')
      } else {
        setError('Failed to update event')
      }
    } catch (err) {
      setError('Failed to update event')
      console.error('Update event error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (user.role !== 'ORGANIZER' || user.verificationStatus !== 'APPROVED') {
    return null
  }

  if (error) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/organizer/events')}>
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          @keyframes slideInFromRight {
            0% {
              transform: translateX(100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideInFromLeft {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .animate-slideInFromRight {
            animation: slideInFromRight 0.5s ease-in-out;
          }
          
          .animate-slideInFromLeft {
            animation: slideInFromLeft 0.5s ease-in-out;
          }
        `
      }} />
      {/* Header */}
      <div className="flex items-center space-x-4 pb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center hover:bg-gray-100"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-1">Update your event information</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative">
        {/* Background gradient for glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -z-10"></div>
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-200 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">Informasi Form</CardTitle>
              <CardDescription className="text-gray-600">Update informasi dasar tentang event Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className={`${slideDirection === 'right' ? 'animate-slideInFromRight' : 'animate-slideInFromLeft'}`}>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Section Navigation */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
                  <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-10 transition-all duration-500 ease-out"
                    style={{
                      width: completion.basic && completion.details && completion.media && completion.settings ? '100%' :
                             completion.basic && completion.details && completion.media ? '75%' :
                             completion.basic && completion.details ? '50%' :
                             completion.basic ? '25%' : '0%'
                    }}
                  ></div>
                  
                  {/* Navigation Nodes */}
                  <div className="relative flex justify-between items-center py-8">
                    {/* Basic Info Node */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => changeSection('basic')}>
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                        activeSection === 'basic' 
                          ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                          : completion.basic
                          ? 'bg-green-500 border-2 border-green-500 group-hover:scale-105'
                          : 'bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:scale-105'
                      }`}>
                        {completion.basic && activeSection !== 'basic' ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Info className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'basic' ? 'text-white' : 
                            completion.basic ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`} />
                        )}
                        {activeSection === 'basic' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75"></div>
                        )}
                      </div>
                    </div>

                    {/* Details Node */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => changeSection('details')}>
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                        activeSection === 'details' 
                          ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                          : completion.details
                          ? 'bg-green-500 border-2 border-green-500 group-hover:scale-105'
                          : 'bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:scale-105'
                      }`}>
                        {completion.details && activeSection !== 'details' ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Calendar className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'details' ? 'text-white' : 
                            completion.details ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`} />
                        )}
                        {activeSection === 'details' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75"></div>
                        )}
                      </div>
                    </div>

                    {/* Media Node */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => changeSection('media')}>
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                        activeSection === 'media' 
                          ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                          : completion.media
                          ? 'bg-green-500 border-2 border-green-500 group-hover:scale-105'
                          : 'bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:scale-105'
                      }`}>
                        {completion.media && activeSection !== 'media' ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ImageIcon className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'media' ? 'text-white' : 
                            completion.media ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`} />
                        )}
                        {activeSection === 'media' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75"></div>
                        )}
                      </div>
                    </div>

                    {/* Settings Node */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => changeSection('settings')}>
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                        activeSection === 'settings' 
                          ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                          : completion.settings
                          ? 'bg-green-500 border-2 border-green-500 group-hover:scale-105'
                          : 'bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:scale-105'
                      }`}>
                        {completion.settings && activeSection !== 'settings' ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Settings className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'settings' ? 'text-white' : 
                            completion.settings ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`} />
                        )}
                        {activeSection === 'settings' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Basic Info Section */}
                {activeSection === 'basic' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Event Title *
                      </label>
                      <div className="relative group">
                        <input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter event title"
                          className="w-full h-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Description *
                      </label>
                      <div className="relative group">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your event..."
                          rows={4}
                          className="w-full px-6 py-4 text-base border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200 group-hover:border-gray-300"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Location *
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                        <input
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Enter event location"
                          className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => changeSection('details')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Next: Details
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Details Section */}
                {activeSection === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Event Date *
                        </label>
                        <div className="relative group">
                          <Calendar className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <input
                            name="eventDate"
                            type="date"
                            value={formData.eventDate}
                            onChange={handleInputChange}
                            className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                            required
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Event Time *
                        </label>
                        <div className="relative group">
                          <Clock className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <input
                            name="eventTime"
                            type="time"
                            value={formData.eventTime}
                            onChange={handleInputChange}
                            className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                            required
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Max Participants *
                        </label>
                        <div className="relative group">
                          <Users className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <input
                            name="maxParticipants"
                            type="number"
                            value={formData.maxParticipants}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                            required
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Registration Deadline *
                        </label>
                        <div className="relative group">
                          <Calendar className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <input
                            name="registrationDeadline"
                            type="datetime-local"
                            value={formData.registrationDeadline}
                            onChange={handleInputChange}
                            className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                            required
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        onClick={() => changeSection('basic')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-semibold transition-all duration-300"
                      >
                        <ChevronDown className="mr-2 h-5 w-5 rotate-90" />
                        Back: Basic Info
                      </Button>
                      <Button
                        type="button"
                        onClick={() => changeSection('media')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Next: Media
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Settings Section */}
                {activeSection === 'settings' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Category *
                      </label>
                      <div className="relative group">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full h-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                          required
                        >
                          <option value="TECHNOLOGY">Technology</option>
                          <option value="BUSINESS">Business</option>
                          <option value="EDUCATION">Education</option>
                          <option value="HEALTH">Health</option>
                          <option value="ENTERTAINMENT">Entertainment</option>
                          <option value="SPORTS">Sports</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pricing
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="isFree"
                            checked={formData.isFree}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Free Event
                          </label>
                        </div>
                        
                        {!formData.isFree && (
                          <div className="relative group">
                            <DollarSign className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                            <input
                              name="price"
                              type="number"
                              value={formData.price}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              className="w-full h-14 pl-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                              placeholder="0.00"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Additional Options
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="generateCertificate"
                            checked={formData.generateCertificate}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Generate Certificate
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        onClick={() => changeSection('media')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-semibold transition-all duration-300"
                      >
                        <ChevronDown className="mr-2 h-5 w-5 rotate-90" />
                        Back: Media
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <LoadingSpinner className="mr-2 h-5 w-5" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Media Section */}
                {activeSection === 'media' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Event Media (Optional)
                      </label>
                      <div className="space-y-4">
                        <div className="relative group">
                          <input
                            name="thumbnailUrl"
                            value={formData.thumbnailUrl}
                            onChange={handleInputChange}
                            placeholder="Thumbnail URL"
                            className="w-full h-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                        
                        <div className="relative group">
                          <input
                            name="galleryUrls"
                            value={formData.galleryUrls.join(', ')}
                            onChange={(e) => {
                              const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url)
                              setFormData(prev => ({ ...prev, galleryUrls: urls }))
                            }}
                            placeholder="Gallery URLs (comma separated)"
                            className="w-full h-14 text-base border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        onClick={() => changeSection('details')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-semibold transition-all duration-300"
                      >
                        <ChevronDown className="mr-2 h-5 w-5 rotate-90" />
                        Back: Details
                      </Button>
                      <Button
                        type="button"
                        onClick={() => changeSection('settings')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Next: Settings
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200 rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Eye className="mr-2 h-5 w-5 text-blue-600" />
                Event Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {formData.title || 'Untitled Event'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {formData.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    {formData.eventDate || 'Date not set'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="mr-2 h-4 w-4 text-green-500" />
                    {formData.eventTime || 'Time not set'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="mr-2 h-4 w-4 text-red-500" />
                    {formData.location || 'Location not set'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="mr-2 h-4 w-4 text-purple-500" />
                    {formData.maxParticipants || 'Not set'} participants
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                    {formData.isFree ? 'Free Event' : `IDR ${formData.price}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </OrganizerLayout>
  )
}
