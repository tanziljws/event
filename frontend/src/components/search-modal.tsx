'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { Event } from '@/types'
import { getImageUrl } from '@/lib/image-utils'
import { formatDateTime } from '@/lib/utils'
import { X, Search, Clock, TrendingUp, Loader2, MapPin, Calendar, Users, ArrowRight, Sparkles } from 'lucide-react'

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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
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
      }, 200)
    } else {
      // Delay unmount to allow exit animation
      const timer = setTimeout(() => {
        setIsMounted(false)
        setSearchQuery('')
        setSearchResults([])
        setHasSearched(false)
        setSuggestions([])
        setShowSuggestions(false)
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
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setShowSuggestions(false)

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

    // Show suggestions while typing (before search)
    if (value.trim().length >= 2) {
      setShowSuggestions(true)
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value)
      }, 400)
    } else {
      setSearchResults([])
      setHasSearched(false)
      setSuggestions([])
      setShowSuggestions(false)
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

  // Scroll to top when results change
  useEffect(() => {
    if (searchResults.length > 0 && resultsRef.current) {
      resultsRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchResults])

  if (!isMounted && !isOpen) return null

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className={`fixed inset-0 z-[9998] transition-all duration-500 ease-out ${
          isOpen 
            ? 'opacity-100 backdrop-blur-md bg-black/40' 
            : 'opacity-0 backdrop-blur-0 bg-black/0'
        }`}
        onClick={onClose}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      />

      {/* Modal Container */}
      <div 
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-20 px-4 pointer-events-none"
      >
        <div
          className={`w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden transition-all duration-500 ease-out ${
            isOpen 
              ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' 
              : '-translate-y-12 scale-[0.92] opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: isOpen 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
              : 'none'
          }}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-gray-100 px-6 py-5">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative">
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                  searchQuery ? 'text-blue-600 scale-110' : 'text-gray-400'
                }`}>
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Cari event, kategori, atau lokasi..."
                  className="w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-400 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl outline-none text-lg transition-all duration-300 focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setHasSearched(false)
                      setSuggestions([])
                      setShowSuggestions(false)
                      inputRef.current?.focus()
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={onClose}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content with smooth scrolling */}
          <div 
            ref={resultsRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
            }}
          >
            {/* Loading State with animation */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Mencari event...</p>
              </div>
            )}

            {/* No Results State */}
            {!isLoading && hasSearched && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Tidak ada event yang ditemukan untuk &quot;<span className="font-semibold text-gray-700">{searchQuery}</span>&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setHasSearched(false)
                    inputRef.current?.focus()
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  Coba Pencarian Lain
                </button>
              </div>
            )}

            {/* Search Results with stagger animation */}
            {!isLoading && searchResults.length > 0 && (
              <div className="p-6 animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Ditemukan {searchResults.length} event
                    </h3>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((event, index) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="group cursor-pointer bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                        {event.thumbnailUrl ? (
                          <img
                            src={getImageUrl(event.thumbnailUrl)}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                                <Calendar className="w-8 h-8 text-blue-600" />
                              </div>
                              <p className="text-xs text-gray-500 font-medium">Event</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 shadow-lg">
                            {event.isFree || !event.price ? 'GRATIS' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                        {event.category && (
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1.5 bg-blue-600/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white shadow-lg">
                              {event.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 text-lg">
                          {event.title}
                        </h4>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-1">{formatDateTime(event.eventDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          {event.registeredCount !== undefined && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span>{event.registeredCount || 0} peserta terdaftar</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">Klik untuk detail</span>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Initial State - Recent & Popular Searches */}
            {!isLoading && !hasSearched && (
              <div className="p-6 animate-fade-in">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Pencarian Terakhir
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center gap-2 group"
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <Clock className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {popularSearches.length > 0 && (
                  <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Pencarian Populer
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handlePopularSearchClick(search)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center gap-2 group"
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {recentSearches.length === 0 && popularSearches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                      <Search className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Mulai Pencarian</h3>
                    <p className="text-gray-500 text-center max-w-md mb-4">
                      Ketik untuk mencari event, kategori, atau lokasi
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">⌘</kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">K</kbd>
                      <span className="ml-2">untuk membuka pencarian</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Live Suggestions while typing */}
            {!isLoading && !hasSearched && showSuggestions && suggestions.length > 0 && searchQuery.length >= 2 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-slide-up">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Saran Pencarian
                  </h3>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 hover:shadow-md flex items-center gap-3 group"
                      style={{
                        animationDelay: `${index * 30}ms`
                      }}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="flex-1 text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                        {suggestion.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with keyboard hint */}
          {!isLoading && !hasSearched && (
            <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">Enter</kbd>
                    <span>untuk mencari</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">Esc</kbd>
                    <span>untuk tutup</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">↑</kbd>
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">↓</kbd>
                  <span>untuk navigasi</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        /* Custom scrollbar for webkit browsers */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
      `}</style>
    </>
  )
}
