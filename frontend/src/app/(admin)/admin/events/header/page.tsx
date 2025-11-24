'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, X } from 'lucide-react'

const headerContentSchema = z.object({
  bannerUrl: z.string().min(1, 'Banner URL is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  description: z.string().min(1, 'Description is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  ctaLink: z.string().url('Please enter a valid CTA link')
})

type HeaderContentForm = z.infer<typeof headerContentSchema>

interface HeaderContent {
  id: string
  bannerUrl: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export default function EventsHeaderAdmin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [headers, setHeaders] = useState<HeaderContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<HeaderContentForm>({
    resolver: zodResolver(headerContentSchema),
    defaultValues: {
      bannerUrl: '/banner/default-banner.png',
      title: 'Featured Event',
      subtitle: 'Discover Amazing Events',
      description: 'Join us for exciting events and unforgettable experiences.',
      ctaText: 'Explore Events',
      ctaLink: '#'
    }
  })

  // Redirect if not authenticated or not super admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
      router.push('/login')
        return
      }
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/404')
        return
      }
    }
  }, [isAuthenticated, user, authLoading, router])

  // Load all headers
  useEffect(() => {
    const loadHeaders = async () => {
      try {
        const response = await fetch('/api/admin/events/header?all=true')
        if (response.ok) {
          const data = await response.json()
          setHeaders(Array.isArray(data) ? data : [data])
        }
      } catch (error) {
        console.error('Error loading headers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      loadHeaders()
    }
  }, [isAuthenticated, user])

  const loadHeaders = async () => {
    try {
      const response = await fetch('/api/admin/events/header?all=true')
      if (response.ok) {
        const data = await response.json()
        setHeaders(Array.isArray(data) ? data : [data])
      }
    } catch (error) {
      console.error('Error loading headers:', error)
    }
  }

  const onSubmit = async (data: HeaderContentForm) => {
    setIsSaving(true)
    setMessage(null)

    try {
      let response
      if (editingId) {
        // Update existing
        response = await fetch('/api/admin/events/header', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingId,
            ...data,
            isActive: headers.find(h => h.id === editingId)?.isActive ?? true,
            sortOrder: headers.find(h => h.id === editingId)?.sortOrder ?? 0
          }),
        })
      } else {
        // Create new
        response = await fetch('/api/admin/events/header', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      }

      if (response.ok) {
        setMessage({ type: 'success', text: editingId ? 'Header updated successfully!' : 'Header created successfully!' })
        setEditingId(null)
        setShowAddForm(false)
        reset()
        await loadHeaders()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save header' }))
        setMessage({ type: 'error', text: errorData.message || errorData.error || 'Failed to save header' })
      }
    } catch (error) {
      console.error('Error saving header:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving header' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this header?')) return

    try {
      const response = await fetch(`/api/admin/events/header?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Header deleted successfully!' })
        await loadHeaders()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete header' }))
        setMessage({ type: 'error', text: errorData.message || 'Failed to delete header' })
      }
    } catch (error) {
      console.error('Error deleting header:', error)
      setMessage({ type: 'error', text: 'An error occurred while deleting header' })
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const header = headers.find(h => h.id === id)
      if (!header) return

      const response = await fetch('/api/admin/events/header', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...header,
          isActive: !currentActive
        }),
      })

      if (response.ok) {
        await loadHeaders()
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const header = headers.find(h => h.id === id)
      if (!header) return

      const currentIndex = headers.findIndex(h => h.id === id)
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (newIndex < 0 || newIndex >= headers.length) return

      const targetHeader = headers[newIndex]
      const newSortOrder = targetHeader.sortOrder
      const targetSortOrder = header.sortOrder

      // Swap sort orders
      await Promise.all([
        fetch('/api/admin/events/header', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...header, sortOrder: newSortOrder })
        }),
        fetch('/api/admin/events/header', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...targetHeader, sortOrder: targetSortOrder })
        })
      ])

      await loadHeaders()
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  const handleEdit = (header: HeaderContent) => {
    setEditingId(header.id)
    setShowAddForm(true)
    reset({
      bannerUrl: header.bannerUrl,
      title: header.title,
      subtitle: header.subtitle,
      description: header.description,
      ctaText: header.ctaText,
      ctaLink: header.ctaLink
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    reset()
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, headerId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    setUploading(headerId || 'new')
    setMessage(null)

    try {
      const response = await ApiService.uploadSingleImage(file)

      if (response.success && response.data?.url) {
        setValue('bannerUrl', response.data.url)
        setMessage({ type: 'success', text: 'Banner uploaded successfully!' })
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to upload banner' })
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error)
      setMessage({ type: 'error', text: error.message || 'An error occurred while uploading banner' })
    } finally {
      setUploading(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return null
  }

  const bannerUrl = watch('bannerUrl')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Header Carousel</h1>
              <p className="text-gray-600">Manage multiple event banners for the carousel on the events page</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true)
                  setEditingId(null)
                  reset()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Header
              </button>
            )}
          </div>
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Header' : 'Add New Header'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
                  <input
                    type="file"
                    id="bannerUpload"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(e)}
                    className="hidden"
                  />
                  <label
                    htmlFor="bannerUpload"
                    className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors z-10"
                  >
                    <div className="text-center text-white">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">
                        {uploading === (editingId || 'new') ? 'Uploading...' : 'Click to upload banner'}
                      </p>
                    </div>
                </label>
                  <img 
                    src={bannerUrl || '/banner/default-banner.png'} 
                    alt="Banner Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="hidden"
                  {...register('bannerUrl')}
                />
                {errors.bannerUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.bannerUrl.message}</p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                <input
                    type="text"
                  {...register('title')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                    placeholder="Enter title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Subtitle</label>
                <input
                    type="text"
                  {...register('subtitle')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                    placeholder="Enter subtitle"
                />
                {errors.subtitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.subtitle.message}</p>
                )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm resize-none"
                  placeholder="Enter description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">CTA Text</label>
                  <input
                    type="text"
                    {...register('ctaText')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                    placeholder="Enter CTA text"
                  />
                  {errors.ctaText && (
                    <p className="mt-1 text-sm text-red-600">{errors.ctaText.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">CTA Link</label>
                  <input
                    type="url"
                    {...register('ctaLink')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                    placeholder="https://example.com"
                  />
                  {errors.ctaLink && (
                    <p className="mt-1 text-sm text-red-600">{errors.ctaLink.message}</p>
                  )}
              </div>
            </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Header' : 'Create Header'}
                </button>
              <button
                type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              </div>
            </form>
          </div>
        )}

        {/* Headers List */}
        <div className="space-y-4">
          {headers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <p className="text-gray-500 mb-4">No headers found. Create your first header to get started.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Header
              </button>
            </div>
          ) : (
            headers.map((header, index) => (
              <div
                key={header.id}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                  header.isActive ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-6">
                  {/* Banner Preview */}
                  <div className="flex-shrink-0 w-64">
                    <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden">
                      <img
                        src={header.bannerUrl}
                        alt={header.title}
                        className="w-full h-full object-cover"
                      />
                      {!header.isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Inactive</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{header.title}</h3>
                        <p className="text-lg text-gray-600 mb-2">{header.subtitle}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{header.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          header.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {header.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                          Order: {header.sortOrder}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={header.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {header.ctaText} →
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleActive(header.id, header.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        header.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={header.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {header.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(header)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(header.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(header.id, 'up')}
                        disabled={index === 0}
                        className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(header.id, 'down')}
                        disabled={index === headers.length - 1}
                        className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
