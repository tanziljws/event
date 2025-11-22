'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import LocationPicker from '@/components/ui/location-picker'
import { ApiService } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'
import { useAuth } from '@/contexts/auth-context'
import OrganizerLayout from '@/components/layout/organizer-layout'
import { 
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Image,
  Upload,
  ChevronRight,
  ChevronDown,
  Info,
  Settings
} from 'lucide-react'

import CustomTicketForm, { TicketType } from '@/components/events/CustomTicketForm'
import TicketPreview from '@/components/events/TicketPreview'

interface EventFormData {
  title: string
  description: string
  eventDate: string
  eventTime: string
  location: string
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
  maxParticipants: number
  registrationDeadline: string
  isPublished: boolean
  category: string
  price: number
  isFree: boolean
  thumbnailUrl: string
  galleryUrls: string[]
  isPrivate: boolean
  privatePassword: string
  generateCertificate: boolean
  hasMultipleTicketTypes: boolean
  ticketTypes: TicketType[]
}

export default function CreateEventPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [slideDirection, setSlideDirection] = useState('right')
  const [showTicketForm, setShowTicketForm] = useState(false)

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
  
  // Function to change section with animation
  const changeSection = (newSection: string) => {
    const sections = ['basic', 'details', 'media', 'tickets', 'settings']
    const currentIndex = sections.indexOf(activeSection)
    const newIndex = sections.indexOf(newSection)
    
    if (newIndex > currentIndex) {
      setSlideDirection('right')
    } else {
      setSlideDirection('left')
    }
    
    setActiveSection(newSection)
  }
  
  // Handle ticket types changes
  const handleTicketTypesChange = (newTicketTypes: TicketType[]) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: newTicketTypes,
      hasMultipleTicketTypes: newTicketTypes.length > 0
    }))
  }
  
  // Handle ticket preview
  const handleTicketPreview = (ticket: TicketType) => {
    setPreviewTicket(ticket)
    setShowTicketPreview(true)
  }
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    address: undefined,
    city: undefined,
    province: undefined,
    country: undefined,
    postalCode: undefined,
    maxParticipants: 100,
    registrationDeadline: '',
    isPublished: false,
    category: 'OTHER',
    price: 0,
    isFree: true,
    thumbnailUrl: '',
    galleryUrls: [],
    isPrivate: false,
    privatePassword: '',
    generateCertificate: false,
    hasMultipleTicketTypes: false,
    ticketTypes: []
  })
  
  const [previewTicket, setPreviewTicket] = useState<TicketType | null>(null)
  const [showTicketPreview, setShowTicketPreview] = useState(false)

  // Check completion status for each section
  const completion = useMemo(() => {
    const basicCompleted = formData.title.trim() !== '' && 
                          formData.description.trim() !== '' && 
                          formData.location.trim() !== '' &&
                          formData.latitude !== undefined &&
                          formData.longitude !== undefined
    
    const detailsCompleted = formData.eventDate !== '' && 
                            formData.eventTime !== '' && 
                            formData.maxParticipants.toString() !== ''
    
    const mediaCompleted = formData.thumbnailUrl !== '' || 
                          formData.galleryUrls.length > 0
    
    const ticketsCompleted = !formData.hasMultipleTicketTypes || 
                            (formData.hasMultipleTicketTypes && formData.ticketTypes.length > 0)
    
    const settingsCompleted = formData.category !== '' && 
                             formData.price.toString() !== '' &&
                             (formData.isFree || formData.price > 0) &&
                             (!formData.isPrivate || formData.privatePassword.trim() !== '') &&
                             ticketsCompleted
    
    return {
      basic: basicCompleted,
      details: detailsCompleted,
      media: mediaCompleted,
      tickets: ticketsCompleted,
      settings: settingsCompleted
    }
  }, [formData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleLocationChange = (location: any) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        province: location.province,
        country: location.country,
        postalCode: location.postalCode,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        location: '',
        latitude: undefined,
        longitude: undefined,
        address: undefined,
        city: undefined,
        province: undefined,
        country: undefined,
        postalCode: undefined,
      }))
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingThumbnail(true)
      const response = await ApiService.uploadSingleImage(file)
      
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: response.data.url
        }))
      } else {
        setError(response.message || 'Failed to upload thumbnail')
      }
    } catch (err) {
      setError('Failed to upload thumbnail')
      console.error('Thumbnail upload error:', err)
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploadingGallery(true)
      const response = await ApiService.uploadMultipleImages(files)
      
      if (response.success) {
        const newUrls = response.data.images.map((img: any) => img.url)
        setFormData(prev => ({
          ...prev,
          galleryUrls: [...prev.galleryUrls, ...newUrls]
        }))
      } else {
        setError(response.message || 'Failed to upload gallery images')
      }
    } catch (err) {
      setError('Failed to upload gallery images')
      console.error('Gallery upload error:', err)
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (!formData.title || !formData.description || !formData.eventDate || !formData.eventTime || !formData.location || !formData.registrationDeadline) {
        setError('Please fill in all required fields')
        return
      }

      // Validate price if not free
      if (!formData.isFree && (!formData.price || formData.price <= 0)) {
        setError('Please enter a valid price for paid events')
        return
      }

      // Validate dates
      const eventDate = new Date(formData.eventDate)
      const registrationDeadline = new Date(formData.registrationDeadline)
      const now = new Date()

      if (eventDate <= now) {
        setError('Event date must be in the future')
        return
      }

      if (registrationDeadline >= eventDate) {
        setError('Registration deadline must be before event date')
        return
      }

      // Convert date strings to ISO format
      const eventData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        price: formData.isFree ? null : formData.price
      }

      console.log('Form data being sent:', eventData)
      const response = await ApiService.createOrganizerEvent(eventData)
      
      if (response.success) {
        router.push('/organizer/events')
      } else {
        setError(response.message || 'Failed to create event')
      }
    } catch (err) {
      setError('Failed to create event')
      console.error('Create event error:', err)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-600 mt-1">Create a new event for participants to register</p>
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
              <CardDescription className="text-gray-600">Isi informasi dasar tentang event Anda</CardDescription>
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
                      width: completion.basic && completion.details && completion.media && completion.tickets && completion.settings ? '100%' :
                             completion.basic && completion.details && completion.media && completion.tickets ? '80%' :
                             completion.basic && completion.details && completion.media ? '60%' :
                             completion.basic && completion.details ? '40%' :
                             completion.basic ? '20%' : '0%'
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
                          <Image className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'media' ? 'text-white' : 
                            completion.media ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`} />
                        )}
                        {activeSection === 'media' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75"></div>
                        )}
                      </div>
                    </div>

                    {/* Tickets Node */}
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => changeSection('tickets')}>
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                        activeSection === 'tickets' 
                          ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                          : completion.tickets
                          ? 'bg-green-500 border-2 border-green-500 group-hover:scale-105'
                          : 'bg-white border-2 border-gray-300 group-hover:border-blue-400 group-hover:scale-105'
                      }`}>
                        {completion.tickets && activeSection !== 'tickets' ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 transition-all duration-300 ${
                            activeSection === 'tickets' ? 'text-white' : 
                            completion.tickets ? 'text-white' : 'text-gray-600 group-hover:text-blue-500'
                          }`}>
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                            <path d="M13 5v2"/>
                            <path d="M13 17v2"/>
                            <path d="M13 11v2"/>
                          </svg>
                        )}
                        {activeSection === 'tickets' && (
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
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter event title"
                          className="h-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
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

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-blue-600 flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Location *
                      </label>
                      <LocationPicker
                        value={formData.latitude && formData.longitude ? {
                          latitude: formData.latitude,
                          longitude: formData.longitude,
                          address: formData.address || formData.location,
                          city: formData.city,
                          province: formData.province,
                          country: formData.country,
                          postalCode: formData.postalCode,
                        } : undefined}
                        onChange={handleLocationChange}
                        placeholder="Cari lokasi event..."
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => changeSection('details')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Next: Settings
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
                          <Input
                            name="eventDate"
                            type="date"
                            value={formData.eventDate}
                            onChange={handleInputChange}
                            className="h-14 pl-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
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
                          <Input
                            name="eventTime"
                            type="time"
                            value={formData.eventTime}
                            onChange={handleInputChange}
                            className="h-14 pl-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
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
                          Max Participants
                        </label>
                        <div className="relative group">
                          <Users className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                          <Input
                            name="maxParticipants"
                            type="number"
                            value={formData.maxParticipants}
                            onChange={handleInputChange}
                            className="h-14 pl-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
                            min="1"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Registration Deadline
                        </label>
                        <div className="relative group">
                          <Input
                            name="registrationDeadline"
                            type="date"
                            value={formData.registrationDeadline}
                            onChange={handleInputChange}
                            className="h-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => changeSection('basic')}
                        className="px-6 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                        Back
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

                {/* Media Section */}
                {activeSection === 'media' && (
                  <div className="space-y-6">

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <Image className="mr-2 h-4 w-4" />
                          Thumbnail Image
                        </label>
                        <div className="space-y-3">
                          {/* File Upload */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              id="thumbnail-upload"
                              disabled={uploadingThumbnail}
                            />
                            <label
                              htmlFor="thumbnail-upload"
                              className={`flex items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 transform hover:scale-102 ${
                                uploadingThumbnail ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="text-center">
                                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                                <p className="text-base font-medium text-gray-700 mb-1">
                                  {uploadingThumbnail ? 'Uploading...' : 'Click to upload thumbnail'}
                                </p>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                              </div>
                            </label>
                          </div>

                          {/* Current Thumbnail */}
                          {formData.thumbnailUrl && (
                            <div className="relative">
                              <img
                                src={getImageUrl(formData.thumbnailUrl)}
                                alt="Thumbnail preview"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Manual URL Input (fallback) */}
                          <div className="relative group">
                            <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-cyan-500 transition-colors duration-200" />
                            <Input
                              name="thumbnailUrl"
                              value={formData.thumbnailUrl}
                              onChange={handleInputChange}
                              placeholder="Or enter image URL manually"
                              className="h-12 pl-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300"
                            />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Gallery Images
                        </label>
                        <div className="space-y-3">
                          {/* File Upload */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryUpload}
                              className="hidden"
                              id="gallery-upload"
                              disabled={uploadingGallery}
                            />
                            <label
                              htmlFor="gallery-upload"
                              className={`flex items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 transform hover:scale-102 ${
                                uploadingGallery ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="text-center">
                                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                                <p className="text-base font-medium text-gray-700 mb-1">
                                  {uploadingGallery ? 'Uploading...' : 'Click to upload gallery images'}
                                </p>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB each (max 10 images)</p>
                              </div>
                            </label>
                          </div>

                          {/* Gallery Images Preview */}
                          {formData.galleryUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {formData.galleryUrls.map((url, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`Gallery ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Manual URL Input (fallback) */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Or add URLs manually (one per line)
                            </label>
                            <textarea
                              name="galleryUrls"
                              value={formData.galleryUrls.join('\n')}
                              onChange={(e) => {
                                const urls = e.target.value.split('\n').filter(url => url.trim())
                                setFormData(prev => ({ ...prev, galleryUrls: urls }))
                              }}
                              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                              rows={3}
                              className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => changeSection('details')}
                        className="px-6 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => changeSection('tickets')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Next: Tickets
                        <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tickets Section */}
                {activeSection === 'tickets' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-lg font-semibold text-blue-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                            <path d="M13 5v2"/>
                            <path d="M13 17v2"/>
                            <path d="M13 11v2"/>
                          </svg>
                          Custom Tickets
                        </label>
                      </div>
                      
                      <CustomTicketForm 
                        ticketTypes={formData.ticketTypes}
                        onChange={handleTicketTypesChange}
                        onPreview={handleTicketPreview}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => changeSection('media')}
                        className="px-6 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                        Back
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

                {/* Settings Section */}
                {activeSection === 'settings' && (
                  <div className="space-y-6">

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Event Category
                        </label>
                        <div className="relative group">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full h-14 px-6 text-base border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-200 group-hover:border-gray-300"
                          >
                            <option value="ACADEMIC">Academic</option>
                            <option value="SPORTS">Sports</option>
                            <option value="ARTS">Arts</option>
                            <option value="CULTURE">Culture</option>
                            <option value="TECHNOLOGY">Technology</option>
                            <option value="BUSINESS">Business</option>
                            <option value="HEALTH">Health</option>
                            <option value="EDUCATION">Education</option>
                            <option value="ENTERTAINMENT">Entertainment</option>
                            <option value="OTHER">Other</option>
                          </select>
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-600 flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Event Price (IDR)
                        </label>
                        <div className="relative group">
                          <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium group-hover:text-blue-600 transition-colors duration-200">Rp</span>
                          <Input
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="h-14 pl-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
                            min="0"
                            step="1000"
                            disabled={formData.isFree}
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <label className="group flex items-center cursor-pointer">
                          <input 
                            className="hidden peer" 
                            type="checkbox" 
                            name="isFree"
                            checked={formData.isFree}
                            onChange={handleCheckboxChange}
                          />

                          <span className="relative w-8 h-8 flex justify-center items-center bg-gray-100 border-2 border-gray-400 rounded-md shadow-md transition-all duration-500 peer-checked:border-green-500 peer-checked:bg-green-500 peer-hover:scale-105">
                            <span className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 opacity-0 peer-checked:opacity-100 rounded-md transition-all duration-500 peer-checked:animate-pulse"></span>

                            <svg
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              className="hidden w-5 h-5 text-white peer-checked:block transition-transform duration-500 transform scale-50 peer-checked:scale-100"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                clipRule="evenodd"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                fillRule="evenodd"
                              ></path>
                            </svg>
                          </span>

                          <span className="ml-3 text-gray-700 group-hover:text-green-500 font-semibold text-base transition-colors duration-300 flex items-center">
                            <svg className="mr-2 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Free event (no payment required)
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <label className="group flex items-center cursor-pointer">
                          <input 
                            className="hidden peer" 
                            type="checkbox" 
                            name="isPublished"
                            checked={formData.isPublished}
                            onChange={handleCheckboxChange}
                          />

                          <span className="relative w-8 h-8 flex justify-center items-center bg-gray-100 border-2 border-gray-400 rounded-md shadow-md transition-all duration-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-hover:scale-105">
                            <span className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 opacity-0 peer-checked:opacity-100 rounded-md transition-all duration-500 peer-checked:animate-pulse"></span>

                            <svg
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              className="hidden w-5 h-5 text-white peer-checked:block transition-transform duration-500 transform scale-50 peer-checked:scale-100"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                clipRule="evenodd"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                fillRule="evenodd"
                              ></path>
                            </svg>
                          </span>

                          <span className="ml-3 text-gray-700 group-hover:text-blue-500 font-semibold text-base transition-colors duration-300 flex items-center">
                            <svg className="mr-2 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Publish event immediately
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <label className="group flex items-center cursor-pointer">
                          <input 
                            className="hidden peer" 
                            type="checkbox" 
                            name="generateCertificate"
                            checked={formData.generateCertificate}
                            onChange={handleCheckboxChange}
                          />

                          <span className="relative w-8 h-8 flex justify-center items-center bg-gray-100 border-2 border-gray-400 rounded-md shadow-md transition-all duration-500 peer-checked:border-purple-500 peer-checked:bg-purple-500 peer-hover:scale-105">
                            <span className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 opacity-0 peer-checked:opacity-100 rounded-md transition-all duration-500 peer-checked:animate-pulse"></span>

                            <svg
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              className="hidden w-5 h-5 text-white peer-checked:block transition-transform duration-500 transform scale-50 peer-checked:scale-100"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                clipRule="evenodd"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                fillRule="evenodd"
                              ></path>
                            </svg>
                          </span>

                          <span className="ml-3 text-gray-700 group-hover:text-purple-500 font-semibold text-base transition-colors duration-300 flex items-center">
                            <svg className="mr-2 h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate certificates for participants
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Private Event Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Private Event Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <label className="group flex items-center cursor-pointer">
                            <input 
                              className="hidden peer" 
                              type="checkbox" 
                              name="isPrivate"
                              checked={formData.isPrivate}
                              onChange={handleCheckboxChange}
                            />

                            <span className="relative w-8 h-8 flex justify-center items-center bg-gray-100 border-2 border-gray-400 rounded-md shadow-md transition-all duration-500 peer-checked:border-purple-500 peer-checked:bg-purple-500 peer-hover:scale-105">
                              <span className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 opacity-0 peer-checked:opacity-100 rounded-md transition-all duration-500 peer-checked:animate-pulse"></span>

                              <svg
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                className="hidden w-5 h-5 text-white peer-checked:block transition-transform duration-500 transform scale-50 peer-checked:scale-100"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  clipRule="evenodd"
                                  d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                  fillRule="evenodd"
                                ></path>
                              </svg>
                            </span>

                            <span className="ml-3 text-gray-700 group-hover:text-purple-500 font-semibold text-base transition-colors duration-300 flex items-center">
                              <svg className="mr-2 h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Make this event private (password protected)
                            </span>
                          </label>
                        </div>

                        {formData.isPrivate && (
                          <div className="mt-4 space-y-3">
                            <label className="text-sm font-semibold text-purple-600 flex items-center">
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Private Event Password
                            </label>
                            <div className="relative group">
                              <Input
                                name="privatePassword"
                                type="password"
                                value={formData.privatePassword}
                                onChange={handleInputChange}
                                placeholder="Enter password for private access"
                                className="h-14 text-base border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6"
                                minLength={4}
                                required={formData.isPrivate}
                              />
                              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Participants will need this password to view and register for your event.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => changeSection('media')}
                        className="px-6 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" className="mr-3" />
                        ) : (
                          <Save className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
                        )}
                        Create Event
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-2 sticky top-8">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl font-semibold">
                <Eye className="mr-2 h-5 w-5" />
                Event Preview
              </CardTitle>
              <CardDescription className="text-gray-600">How your event will appear to participants</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Event Card Preview */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200">
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden">
                  {formData.thumbnailUrl ? (
                    <img
                      src={formData.thumbnailUrl}
                      alt={formData.title || 'Event Preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center ${formData.thumbnailUrl ? 'hidden' : ''}`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/80 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-blue-700 text-sm font-medium">Event Image</p>
                    </div>
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1.5 text-xs rounded-full font-semibold backdrop-blur-sm bg-blue-100 text-blue-800">
                      Akan Datang
                    </span>
                  </div>
                  
                  {/* Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white text-lg font-bold mb-1 line-clamp-2 drop-shadow-lg">
                      {formData.title || 'Event Title'}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90 text-sm font-medium">
                        {formData.isFree || !formData.price 
                          ? 'GRATIS' 
                          : `Rp ${Number(formData.price).toLocaleString('id-ID')}`
                        }
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/90 text-sm">⭐ 4.8</span>
                        <span className="text-white/90 text-sm">{formData.category || 'OTHER'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4 bg-white">
                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {formData.description || 'Event description will appear here...'}
                  </p>
                  
                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formData.eventDate ? formatDate(formData.eventDate) : 'Select date'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formData.eventTime || 'Select time'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">
                        {formData.address || formData.location || 'Enter location'}
                        {formData.city && formData.province && (
                          <span className="text-gray-400 ml-1">
                            • {formData.city}, {formData.province}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                        0/{formData.maxParticipants} peserta
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                        {formData.maxParticipants} slot tersisa
                      </span>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    Lihat Detail Event
                  </button>
                </div>
              </div>

              {/* Status Info */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    formData.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                {formData.galleryUrls.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Gallery Images:</span>
                    <span className="text-sm text-gray-600 ml-2">{formData.galleryUrls.length} images</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      
      {/* Ticket Preview Modal */}
      {showTicketPreview && previewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ticket Preview</h3>
              <button 
                onClick={() => setShowTicketPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TicketPreview ticket={previewTicket} eventTitle={formData.title} />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowTicketPreview(false)}
                className="px-4 py-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
