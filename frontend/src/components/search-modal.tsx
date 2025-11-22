'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { Event } from '@/types'
import { getImageUrl } from '@/lib/image-utils'
import { formatDateTime } from '@/lib/utils'
import { X, Search, Clock, TrendingUp, Loader2 } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchSuggestion {
  id: string
  title: string
  type: 'event' | 'category' | 'location'
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Event[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent).slice(0, 5))
      } catch (e) {
        console.error('Error parsing recent searches:', e)
      }
    }

    // Set popular searches (could be from API in the future)
    setPopularSearches(['Music', 'Business', 'Technology', 'Education', 'Sports'])
  }, [])

  // Handle mount/unmount for smooth animations
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      // Small delay to ensure modal animation starts
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    } else {
      // Delay unmount to allow exit animation
      const timer = setTimeout(() => {
        setIsMounted(false)
        setSearchQuery('')
        setSearchResults([])
        setHasSearched(false)
        setSuggestions([])
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle search with debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([])
      setHasSearched(false)
      setSuggestions([])
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await ApiService.searchEvents({
        q: query.trim(),
        page: 1,
        limit: 12
      })

      if (response.success && response.data) {
        setSearchResults(response.data.events || [])
        
        // Generate suggestions from results
        const eventSuggestions: SearchSuggestion[] = (response.data.events || []).slice(0, 5).map((event: Event) => ({
          id: event.id,
          title: event.title,
          type: 'event' as const
        }))
        setSuggestions(eventSuggestions)
      } else {
        setSearchResults([])
        setSuggestions([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value)
      }, 300)
    } else {
      setSearchResults([])
      setHasSearched(false)
      setSuggestions([])
    }
  }

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      
      // Navigate to events page with search
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
    }
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'event') {
      router.push(`/events/${suggestion.id}`)
      onClose()
    } else {
      setSearchQuery(suggestion.title)
      performSearch(suggestion.title)
    }
  }

  // Handle popular search click
  const handlePopularSearchClick = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  // Handle event click
  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`)
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isMounted && !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 pointer-events-none"
      >
        <div
          className={`w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            isOpen 
              ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' 
              : '-translate-y-8 scale-[0.96] opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center border-b border-gray-200 px-6 py-4">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Cari event, kategori, atau lokasi..."
                  className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none text-lg"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setHasSearched(false)
                      setSuggestions([])
                      inputRef.current?.focus()
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {!isLoading && hasSearched && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada hasil</h3>
                <p className="text-gray-500 text-center">
                  Tidak ada event yang ditemukan untuk &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {!isLoading && searchResults.length > 0 && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Hasil Pencarian ({searchResults.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="group cursor-pointer bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                    >
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                        {event.thumbnailUrl ? (
                          <img
                            src={getImageUrl(event.thumbnailUrl)}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-white/80 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                            {event.isFree || !event.price ? 'GRATIS' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                          {formatDateTime(event.eventDate)} • {event.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{event.category}</span>
                          <span className="text-xs text-gray-400">{event.registeredCount || 0} peserta</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !hasSearched && (
              <div className="p-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Pencarian Terakhir
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors duration-200"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {popularSearches.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Pencarian Populer
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handlePopularSearchClick(search)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-colors duration-200"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {recentSearches.length === 0 && popularSearches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Mulai pencarian</h3>
                    <p className="text-gray-500 text-center">
                      Ketik untuk mencari event, kategori, atau lokasi
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {!isLoading && !hasSearched && suggestions.length > 0 && searchQuery.length >= 2 && (
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Saran
                </h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700">{suggestion.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
