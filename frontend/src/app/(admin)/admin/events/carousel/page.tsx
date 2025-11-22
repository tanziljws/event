'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

const carouselItemSchema = z.object({
  videoUrl: z.string().url('Please enter a valid video URL'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  description: z.string().min(1, 'Description is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  ctaLink: z.string().url('Please enter a valid CTA link'),
  logoUrl: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater')
})

type CarouselItemForm = z.infer<typeof carouselItemSchema>

interface CarouselItem {
  id: string
  videoUrl: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
  logoUrl?: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export default function EventsCarouselAdmin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CarouselItemForm>({
    resolver: zodResolver(carouselItemSchema),
    defaultValues: {
      videoUrl: '',
      title: '',
      subtitle: '',
      description: '',
      ctaText: '',
      ctaLink: '',
      logoUrl: '',
      sortOrder: 0
    }
  })

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, authLoading, router])

  // Load carousel items
  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        const response = await fetch('/api/admin/events/header/carousel')
        if (response.ok) {
          const data = await response.json()
          setCarouselItems(data)
        }
      } catch (error) {
        console.error('Error loading carousel items:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'ADMIN') {
      loadCarouselItems()
    }
  }, [isAuthenticated, user])

  const onSubmit = async (data: CarouselItemForm) => {
    setIsSaving(true)
    setMessage(null)

    try {
      if (isEditing && editingItem) {
        // Update existing item
        const response = await fetch(`/api/admin/events/header/${editingItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          const result = await response.json()
          setCarouselItems(prev => 
            prev.map(item => item.id === editingItem.id ? result : item)
          )
          setMessage({ type: 'success', text: 'Carousel item updated successfully!' })
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Failed to update carousel item' })
        }
      } else {
        // Create new item
        const response = await fetch('/api/admin/events/header/carousel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          const result = await response.json()
          setCarouselItems(prev => [...prev, result])
          setMessage({ type: 'success', text: 'Carousel item added successfully!' })
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.message || 'Failed to add carousel item' })
        }
      }
      
      reset()
      setIsEditing(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving carousel item:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving carousel item' })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleItemStatus = async (item: CarouselItem) => {
    try {
      const response = await fetch(`/api/admin/events/header/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !item.isActive
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setCarouselItems(prev => 
          prev.map(item => item.id === updatedItem.id ? updatedItem : item)
        )
      }
    } catch (error) {
      console.error('Error toggling item status:', error)
    }
  }

  const editItem = (item: CarouselItem) => {
    setEditingItem(item)
    setIsEditing(true)
    setValue('videoUrl', item.videoUrl)
    setValue('title', item.title)
    setValue('subtitle', item.subtitle)
    setValue('description', item.description)
    setValue('ctaText', item.ctaText)
    setValue('ctaLink', item.ctaLink)
    setValue('logoUrl', item.logoUrl || '')
    setValue('sortOrder', item.sortOrder)
    setMessage(null)
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditingItem(null)
    reset()
    setMessage(null)
  }

  const deleteItem = async (item: CarouselItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/events/header/${item.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCarouselItems(prev => prev.filter(i => i.id !== item.id))
        setMessage({ type: 'success', text: 'Carousel item deleted successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Failed to delete carousel item' })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setMessage({ type: 'error', text: 'An error occurred while deleting carousel item' })
    }
  }

  const videoUrl = watch('videoUrl')

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Carousel Management</h1>
            <p className="text-gray-600">Manage multiple carousel items for the events page header</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Add/Edit Item Form */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? `Edit: ${editingItem?.title}` : 'Add New Carousel Item'}
              </h2>
              {isEditing && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Video URL
                  </label>
                  <input
                    {...register('videoUrl')}
                    type="url"
                    id="videoUrl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=VIDEO_ID"
                  />
                  {errors.videoUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.videoUrl.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    {...register('logoUrl')}
                    type="url"
                    id="logoUrl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/images/logo.png"
                  />
                  {errors.logoUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BLACKPINK"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  {...register('subtitle')}
                  type="text"
                  id="subtitle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="World Tour Concert"
                />
                {errors.subtitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.subtitle.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Experience the global K-pop sensation..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Button Text
                  </label>
                  <input
                    {...register('ctaText')}
                    type="text"
                    id="ctaText"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Get Tickets Now"
                  />
                  {errors.ctaText && (
                    <p className="mt-1 text-sm text-red-600">{errors.ctaText.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ctaLink" className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Button Link
                  </label>
                  <input
                    {...register('ctaLink')}
                    type="url"
                    id="ctaLink"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/tickets"
                  />
                  {errors.ctaLink && (
                    <p className="mt-1 text-sm text-red-600">{errors.ctaLink.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    {...register('sortOrder', { valueAsNumber: true })}
                    type="number"
                    id="sortOrder"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  {errors.sortOrder && (
                    <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              {videoUrl && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Video Preview</label>
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={videoUrl}
                      title="Video Preview"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving 
                    ? (isEditing ? 'Updating...' : 'Adding...') 
                    : (isEditing ? 'Update Carousel Item' : 'Add Carousel Item')
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Carousel Items List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Carousel Items</h2>
            
            {carouselItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No carousel items found. Add your first item above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carouselItems.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg border-2 ${
                    item.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">
                          <strong>Sort Order:</strong> {item.sortOrder}
                        </div>
                        <div className="text-xs text-gray-500">
                          <strong>CTA:</strong> {item.ctaText}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => editItem(item)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleItemStatus(item)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            item.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <a
              href="/events"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Events Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
