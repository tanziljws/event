'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

const headerContentSchema = z.object({
  videoUrl: z.string().url('Please enter a valid video URL'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  description: z.string().min(1, 'Description is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  ctaLink: z.string().url('Please enter a valid CTA link')
})

type HeaderContentForm = z.infer<typeof headerContentSchema>

interface HeaderContent {
  id: string
  videoUrl: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
  createdAt: Date
  updatedAt: Date
}

export default function EventsHeaderAdmin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [headerContent, setHeaderContent] = useState<HeaderContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<HeaderContentForm>({
    resolver: zodResolver(headerContentSchema),
    defaultValues: {
      videoUrl: 'https://www.youtube.com/embed/XEb4McVJ1-U?start=1578&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=XEb4McVJ1-U',
      title: 'SHEILA ON 7',
      subtitle: '6th Anniversary Concert',
      description: 'May 1996 - 2012 • Special Performance. Experience the legendary Indonesian rock band\'s anniversary concert with exclusive live performances and unforgettable moments.',
      ctaText: 'Buy Tickets Now',
      ctaLink: '#'
    }
  })

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, authLoading, router])

  // Load header content
  useEffect(() => {
    const loadHeaderContent = async () => {
      try {
        const response = await fetch('/api/admin/events/header')
        if (response.ok) {
          const data = await response.json()
          setHeaderContent(data)
          reset(data)
        }
      } catch (error) {
        console.error('Error loading header content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'ADMIN') {
      loadHeaderContent()
    }
  }, [isAuthenticated, user, reset])

  const onSubmit = async (data: HeaderContentForm) => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/events/header', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setHeaderContent(result)
        setMessage({ type: 'success', text: 'Header content updated successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Failed to update header content' })
      }
    } catch (error) {
      console.error('Error updating header content:', error)
      setMessage({ type: 'error', text: 'An error occurred while updating header content' })
    } finally {
      setIsSaving(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Header Settings</h1>
            <p className="text-gray-600">Configure the featured video and content for the events page header</p>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Video Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Video Settings</h2>
              
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Video URL
                </label>
                <input
                  {...register('videoUrl')}
                  type="url"
                  id="videoUrl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID?start=1578&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=VIDEO_ID"
                />
                {errors.videoUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.videoUrl.message}</p>
                )}
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
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Content Settings</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Main Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SHEILA ON 7"
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
                  placeholder="6th Anniversary Concert"
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="May 1996 - 2012 • Special Performance. Experience the legendary Indonesian rock band's anniversary concert with exclusive live performances and unforgettable moments."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Button Text
                  </label>
                  <input
                    {...register('ctaText')}
                    type="text"
                    id="ctaText"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buy Tickets Now"
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
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
