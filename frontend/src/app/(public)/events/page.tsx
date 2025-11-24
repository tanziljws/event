'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiService } from '@/lib/api'
import { useError } from '@/contexts/error-context'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonEventCard } from '@/components/ui/skeleton'
import { Event } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { getImageUrl } from '@/lib/image-utils'
import Navbar from '@/components/navbar'
import Footer from '@/components/layout/footer'
import { 
  SiSony,
  SiBose,
  SiAudiotechnica,
  SiSennheiser,
  SiJbl,
  SiSpotify,
  SiApple,
  SiGoogle,
  SiYoutube,
  SiAmazon
} from 'react-icons/si'

const searchSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'eventDate', 'title', 'maxParticipants']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

type SearchForm = z.infer<typeof searchSchema>

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const [activeEvent, setActiveEvent] = useState<string | null>(null)
  const [isHeaderLoading, setIsHeaderLoading] = useState(true)
  const [headerContent, setHeaderContent] = useState({
    bannerUrl: '/banner/default-banner.png',
    title: 'Featured Event',
    subtitle: 'Discover Amazing Events',
    description: 'Join us for exciting events and unforgettable experiences.',
    ctaText: 'Explore Events',
    ctaLink: '#',
    logoUrl: null
  })
  const [carouselItems, setCarouselItems] = useState<any[]>([])
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [isCarouselAutoPlay, setIsCarouselAutoPlay] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [carouselProgress, setCarouselProgress] = useState(0)
  const { handleError } = useError()
  const router = useRouter()
  const cursorRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())


  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      sortBy: 'eventDate',
      sortOrder: 'asc',
    },
  })

  const searchQuery = watch('search')
  const sortBy = watch('sortBy')
  const sortOrder = watch('sortOrder')

  const fetchEvents = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true)
      
      let response
      if (searchQuery && searchQuery.trim().length >= 2) {
        response = await ApiService.searchEvents({
          q: searchQuery.trim(),
          page: pageNum,
          limit: 12
        })
      } else {
        response = await ApiService.getPublicEvents({
          page: pageNum,
          limit: 12,
          search: searchQuery,
          isPublished: true,
          sortBy: sortBy || 'eventDate',
          sortOrder: sortOrder || 'asc',
        })
      }

      if (response.success && response.data) {
        const newEvents = response.data.events || []
        if (reset) {
          setEvents(newEvents)
        } else {
          setEvents(prev => [...prev, ...newEvents])
        }
        setTotalPages(response.data.pagination?.totalPages || 1)
        setHasMore(pageNum < (response.data.pagination?.totalPages || 1))
      }
    } catch (error) {
      handleError(error, 'Gagal memuat daftar event')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(1, true)
  }, [searchQuery, sortBy, sortOrder])

  // Set first event as active when events are loaded
  useEffect(() => {
    if (events.length > 0 && !activeEvent) {
      setActiveEvent(events[0].id)
    }
  }, [events, activeEvent])

  // Load carousel items from API
  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        const response = await fetch('/api/admin/events/header/carousel')
        if (response.ok) {
          const data = await response.json()
          setCarouselItems(data)
          if (data.length > 0) {
            setHeaderContent(data[0])
          }
        }
      } catch (error) {
        console.error('Error loading carousel items:', error)
        // Fallback to single item
        const response = await fetch('/api/admin/events/header')
        if (response.ok) {
          const data = await response.json()
          setHeaderContent(data)
          setCarouselItems([data])
        }
      }
    }

    loadCarouselItems()
  }, [])

  // Header loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderLoading(false)
    }, 2000) // 2 seconds loading

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Smooth carousel transition function
  const transitionToSlide = (newIndex: number) => {
    if (isTransitioning || newIndex === currentCarouselIndex) {
      return
    }
    
    setIsTransitioning(true)
    setCarouselProgress(0)
    
    // Fade out current content
    setTimeout(() => {
      setCurrentCarouselIndex(newIndex)
      setHeaderContent(carouselItems[newIndex])
      
      // Fade in new content
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 300)
  }

  // Carousel autoplay effect with progress tracking
  useEffect(() => {
    if (!isCarouselAutoPlay || carouselItems.length <= 1 || isTransitioning) {
      return
    }

    const interval = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = (currentCarouselIndex + 1) % carouselItems.length
          transitionToSlide(nextIndex)
          return 0
        }
        return prev + (100 / 80) // 8 seconds = 80 * 100ms intervals
      })
    }, 100) // Update every 100ms for smooth progress

    return () => {
      clearInterval(interval)
    }
  }, [carouselItems, currentCarouselIndex, isCarouselAutoPlay, isTransitioning])

  // Trigger sponsor header animations on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      const leftElements = document.querySelectorAll('.slide-in-left')
      const rightElements = document.querySelectorAll('.slide-in-right')
      const upElements = document.querySelectorAll('.slide-in-up')
      
      leftElements.forEach(el => el.classList.add('visible'))
      rightElements.forEach(el => el.classList.add('visible'))
      upElements.forEach(el => el.classList.add('visible'))
    }, 500) // Delay 500ms after page load

    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animation-id')
            if (elementId) {
              if (entry.target.classList.contains('fade-in-section')) {
                setVisibleSections(prev => new Set([...prev, elementId]))
              } else if (entry.target.classList.contains('stagger-card')) {
                setVisibleCards(prev => new Set([...prev, elementId]))
              }
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    // Observe sections
    sectionRefs.current.forEach((element) => {
      if (element) observer.observe(element)
    })

    // Observe cards
    cardRefs.current.forEach((element) => {
      if (element) observer.observe(element)
    })

    return () => {
      sectionRefs.current.forEach((element) => {
        if (element) observer.unobserve(element)
      })
      cardRefs.current.forEach((element) => {
        if (element) observer.unobserve(element)
      })
    }
  }, [events])


  // Custom cursor effect
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [])

  useEffect(() => {
    setCurrentTime(new Date())
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])




  const handleSearch = (data: SearchForm) => {
    setPage(1)
    fetchEvents(1, true)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchEvents(nextPage, false)
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  const getEventStatus = (event: Event, currentTime?: Date) => {
    const now = currentTime || new Date()
    const eventDate = new Date(`${event.eventDate}T${event.eventTime}`)

    if (now < eventDate) {
      return { status: 'upcoming', color: 'event-status-upcoming' }
    } else if (now >= eventDate) {
      return { status: 'completed', color: 'event-status-completed' }
    } else {
      return { status: 'ongoing', color: 'event-status-ongoing' }
    }
  }

  const getAvailabilityStatus = (event: Event) => {
    const maxParticipants = event.maxParticipants || 0
    const registeredCount = event.registeredCount || 0
    const available = maxParticipants - registeredCount
    
    if (available <= 0) {
      return { status: 'full', color: 'availability-full', text: 'Penuh' }
    } else if (available <= 5) {
      return { status: 'limited', color: 'availability-limited', text: `${available} slot tersisa` }
    } else {
      return { status: 'available', color: 'availability-available', text: `${available} slot tersisa` }
    }
  }

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen relative">
        {/* Custom Cursor */}
        <div ref={cursorRef} className="custom-cursor" />
        
        {/* Animated Background Grid */}
        <div className="bg-grid" />
        
        {/* Main Content with higher z-index */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="h-12 bg-gray-200 rounded-lg w-full md:w-80 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full md:w-48 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full md:w-48 animate-pulse"></div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonEventCard key={i} />
            ))}
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />
      
      {/* Animated Background Grid */}
      <div className="bg-grid" />
      
      {/* Normal Navbar */}
      <Navbar />

      {/* Main Content with higher z-index */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Featured Image or Video Layout Header */}
        <div className="relative bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isHeaderLoading ? (
              /* Loading State */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Video Loading Skeleton */}
                <div className="lg:col-span-2">
                  <div className="relative aspect-video bg-gray-200 rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 animate-pulse">
                    <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Text Loading Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-40"></div>
                </div>
              </div>
            ) : (
              /* Loaded State */
              <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 items-center transition-all duration-500 ${
          isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}>
                {/* Featured Banner - Left Side (2/3 width) */}
                <div className="lg:col-span-2">
                  <div 
                    className="relative aspect-video bg-gray-200 rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50"
                    onMouseEnter={() => setIsCarouselAutoPlay(false)}
                    onMouseLeave={() => setIsCarouselAutoPlay(true)}
                  >
                    {/* Banner Image */}
                    <img 
                      src={headerContent.bannerUrl || '/banner/default-banner.png'} 
                      alt="Featured Event Banner" 
                      className="w-full h-full object-cover rounded-3xl"
                      onError={(e) => {
                        // Fallback to a solid color if image fails to load
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-3xl"></div>

                    {/* Carousel Controls - Bottom Right */}
                    {carouselItems.length > 1 && (
                      <div className="absolute bottom-4 right-4 z-10">
                        {/* Slide Counter */}
                        <div className="mb-2 text-right">
                          <span className="text-white/80 text-sm font-medium">
                            {currentCarouselIndex + 1} / {carouselItems.length}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mb-3 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{ width: `${carouselProgress}%` }}
                          />
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center space-x-2">
                          {/* Previous Button */}
                          <button
                            onClick={() => {
                              const prevIndex = (currentCarouselIndex - 1 + carouselItems.length) % carouselItems.length
                              transitionToSlide(prevIndex)
                              setIsCarouselAutoPlay(false)
                            }}
                            disabled={isTransitioning}
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Dots Indicator with Labels */}
                          <div className="flex space-x-1">
                            {carouselItems.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  transitionToSlide(index)
                                  setIsCarouselAutoPlay(false)
                                }}
                                disabled={isTransitioning}
                                className={`relative group transition-all duration-200 disabled:cursor-not-allowed ${
                                  index === currentCarouselIndex 
                                    ? 'w-8 h-2 bg-white rounded-full' 
                                    : 'w-2 h-2 bg-white/40 hover:bg-white/60 rounded-full'
                                }`}
                                title={item.title}
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                  {item.title}
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => {
                              const nextIndex = (currentCarouselIndex + 1) % carouselItems.length
                              transitionToSlide(nextIndex)
                              setIsCarouselAutoPlay(false)
                            }}
                            disabled={isTransitioning}
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Auto-play Toggle */}
                          <button
                            onClick={() => {
                              setIsCarouselAutoPlay(!isCarouselAutoPlay)
                              if (!isCarouselAutoPlay) {
                                setCarouselProgress(0)
                              }
                            }}
                            className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 ${
                              isCarouselAutoPlay 
                                ? 'bg-white/30 text-white' 
                                : 'bg-white/20 text-white/60 hover:bg-white/30'
                            }`}
                            title={isCarouselAutoPlay ? 'Pause Auto-play' : 'Start Auto-play'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              {isCarouselAutoPlay ? (
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                              ) : (
                                <path d="M8 5v14l11-7z"/>
                              )}
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Text Content - Right Side (1/3 width) */}
                <div 
                  className="lg:col-span-1 space-y-6"
                  onMouseEnter={() => setIsCarouselAutoPlay(false)}
                  onMouseLeave={() => setIsCarouselAutoPlay(true)}
                >
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-slide-in-right">
                      {headerContent.title}
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-light text-gray-700 mb-4 animate-slide-in-right delay-200">
                      {headerContent.subtitle}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed animate-slide-in-right delay-400">
                      {headerContent.description}
                    </p>
                  </div>
                  
                  <div className="pt-4 animate-slide-in-right delay-600">
                    <button 
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      onClick={() => window.open(headerContent.ctaLink, '_blank')}
                    >
                      {headerContent.ctaText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        

      <style dangerouslySetInnerHTML={{
        __html: `
          /* CSS Variables */
          :root {
            --color-primary: #3b82f6;
            --color-secondary: #8b5cf6;
            --color-accent: #10b981;
            --color-bg: #ffffff;
            --color-surface: #f8fafc;
            --color-text: #1f2937;
            --color-muted: #6b7280;
            --border-default: #e5e7eb;
          }

          /* Base Body Styles */
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            overflow-x: hidden;
          }
          
          .event-card {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          

          /* Custom Cursor */
          .custom-cursor {
            position: fixed;
            width: 20px;
            height: 20px;
            background: var(--color-primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            mix-blend-mode: difference;
          }

          /* Animated Background Grid */
          .bg-grid {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background-image: 
              linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
            background-size: 20px 20px;
            pointer-events: none;
            z-index: 1;
            opacity: 1;
          }

          /* Social Media Buttons - From Uiverse.io by vinodjangid07 */
          .card {
            width: fit-content;
            height: fit-content;
            background-color: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px 15px;
            gap: 12px;
            box-shadow: none;
          }

          /* for all social containers*/
          .socialContainer {
            width: 40px;
            height: 40px;
            background-color: rgb(44, 44, 44);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transition-duration: .3s;
          }
          /* instagram*/
          .containerOne:hover {
            background-color: #d62976;
            transition-duration: .3s;
          }
          /* twitter*/
          .containerTwo:hover {
            background-color: #00acee;
            transition-duration: .3s;
          }
          /* linkdin*/
          .containerThree:hover {
            background-color: #0072b1;
            transition-duration: .3s;
          }
          /* Whatsapp*/
          .containerFour:hover {
            background-color: #128C7E;
            transition-duration: .3s;
          }

          .socialContainer:active {
            transform: scale(0.9);
            transition-duration: .3s;
          }

          .socialSvg {
            width: 14px;
          }

          .socialSvg path {
            fill: rgb(255, 255, 255);
          }

          .socialContainer:hover .socialSvg {
            animation: slide-in-top 0.3s both;
          }

          @keyframes slide-in-top {
            0% {
              transform: translateY(-50px);
              opacity: 0;
            }

            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .event-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e5e7eb;
          }
          
          .event-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border-color: #d1d5db;
          }
          
          
          .event-status-upcoming {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .event-status-ongoing {
            background: #dcfce7;
            color: #166534;
          }
          
          .event-status-completed {
            background: #f3f4f6;
            color: #6b7280;
          }
          
          .availability-available {
            background: #dcfce7;
            color: #166534;
          }
          
          .availability-limited {
            background: #fef3c7;
            color: #d97706;
          }
          
          .availability-full {
            background: #fee2e2;
            color: #dc2626;
          }
          
          .search-input-expand {
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
          }
          
          .search-input-expand:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .filter-select {
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
          }
          
          .filter-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .popular-event-card {
            opacity: 0.7;
            transform: scale(0.95);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .popular-event-card.active {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
          
          .popular-event-card.prev {
            opacity: 0.5;
            transform: scale(0.9) translateX(-20px);
          }
          
          .popular-event-card.next {
            opacity: 0.5;
            transform: scale(0.9) translateX(20px);
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .animated-button {
            position: relative;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 24px;
            border: 2px solid;
            border-color: transparent;
            font-size: 14px;
            background-color: #3b82f6;
            border-radius: 100px;
            font-weight: 600;
            color: #ffffff;
            box-shadow: 0 0 0 1px #ffffff;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .animated-button svg {
            position: absolute;
            width: 18px;
            fill: #ffffff;
            z-index: 9;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .animated-button .arr-1 {
            right: 12px;
          }
          
          .animated-button .arr-2 {
            left: -25%;
          }
          
          .animated-button .circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            background-color: #dbeafe;
            border-radius: 50%;
            opacity: 0;
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .animated-button .text {
            position: relative;
            z-index: 1;
            transform: translateX(-8px);
            transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .animated-button:hover {
            box-shadow: 0 0 0 12px transparent;
            color: #1e40af;
            border-radius: 12px;
            background-color: #dbeafe;
          }
          
          .animated-button:hover .arr-1 {
            right: -25%;
          }
          
          .animated-button:hover .arr-2 {
            left: 12px;
          }
          
          .animated-button:hover .text {
            transform: translateX(8px);
          }
          
          .animated-button:hover svg {
            fill: #1e40af;
          }
          
          .animated-button:active {
            scale: 0.95;
            box-shadow: 0 0 0 4px #3b82f6;
          }
          
          .animated-button:hover .circle {
            width: 180px;
            height: 180px;
            opacity: 1;
          }

          /* Netflix-style scrollbar */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          /* Netflix-style hover effects */
          .netflix-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }

          .netflix-card:hover {
            transform: scale(1.05);
            z-index: 10;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
          }

          /* Netflix-style image hover effect */
          .netflix-card:hover img {
            transform: scale(1.1);
            filter: brightness(1.1);
          }

          /* Netflix-style content reveal */
          .netflix-card .opacity-0 {
            transition: opacity 0.3s ease-in-out;
          }

          .netflix-card:hover .opacity-0 {
            opacity: 1 !important;
          }

          /* Category row spacing */
          .category-row {
            margin-bottom: 3rem;
          }

          /* Fade in animation for sections */
          .fade-in-section {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .fade-in-section.visible {
            opacity: 1;
            transform: translateY(0);
          }

          /* Staggered animation for cards */
          .stagger-card {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .stagger-card.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          /* Floating animation for hero content */
          .floating-content {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          /* Pulse animation for buttons */
          .pulse-button {
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          /* Slide in from left animation */
          .slide-in-left {
            opacity: 0;
            transform: translateX(-100px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .slide-in-left.visible {
            opacity: 1;
            transform: translateX(0);
            transition-delay: 0.2s;
          }

          /* Slide in from right animation */
          .slide-in-right {
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .slide-in-right.visible {
            opacity: 1;
            transform: translateX(0);
            transition-delay: 0.4s;
          }

          /* Slide in from up animation */
          .slide-in-up {
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .slide-in-up.visible {
            opacity: 1;
            transform: translateY(0);
            transition-delay: 0.6s;
          }












          @keyframes fireworkBurst {
            0%, 100% {
              transform: scale(1);
              opacity: 0;
            }
            25% {
              transform: scale(2);
              opacity: 0.6;
            }
            50% {
              transform: scale(4);
              opacity: 1;
            }
            75% {
              transform: scale(3);
              opacity: 0.4;
            }
          }

          @keyframes lineMove {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateX(calc(100vw + 300px));
              opacity: 0;
            }
          }



          /* Scale in animation */
          .scale-in {
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Loading Animations */
          .animate-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          .animate-fade-in {
            animation: fadeIn 0.8s ease-out;
          }

          .animate-slide-in-right {
            animation: slideInRight 0.8s ease-out;
          }

          .delay-200 {
            animation-delay: 0.2s;
          }

          .delay-400 {
            animation-delay: 0.4s;
          }

          .delay-600 {
            animation-delay: 0.6s;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .scale-in.visible {
            opacity: 1;
            transform: scale(1);
          }

          /* Rotate in animation */
          .rotate-in {
            opacity: 0;
            transform: rotate(-10deg) scale(0.9);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .rotate-in.visible {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }

          /* Bounce animation for dots */
          .bounce-dot {
            animation: bounce 1s infinite;
          }

          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }

          /* Glow effect for active elements */
          .glow-effect {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }

          .glow-effect:hover {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }

          /* Shimmer effect for loading */
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          /* Parallax effect for hero */
          .parallax-bg {
            transform: translateZ(0);
            will-change: transform;
          }

          /* Magnetic hover effect */
          .magnetic-hover {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .magnetic-hover:hover {
            transform: translateY(-8px) scale(1.02);
          }

          /* Expandable Cards Animation */
          .expandable-card {
            transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform, width, opacity, background-size;
            transform-origin: center;
          }
          
          .expandable-card.active {
            flex-grow: 10000;
            transform: scale(1);
            max-width: 600px;
            margin: 0px;
            border-radius: 40px;
            background-size: cover;
            background-position: center;
          }
          
          .expandable-card:not(.active) {
            min-width: 60px;
            margin: 8px;
            background-size: auto 120%;
            background-position: center;
            border-radius: 30px;
            flex-grow: 1;
            transform: scale(0.95);
          }
          
          .expandable-card:not(.active):hover {
            transform: scale(1.02);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Content Animation */
          .card-content {
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: bottom;
          }
          
          .card-content.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            transition-delay: 0.2s;
          }
          
          .card-content:not(.active) {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            transition-delay: 0s;
          }
          
          /* Shadow Animation */
          .card-shadow {
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .card-shadow.active {
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
          }
          
          .card-shadow:not(.active) {
            background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
          }
          
          /* Smooth Container Animation */
          .expandable-container {
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Enhanced Hover States */
          .expandable-card:not(.active) {
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .expandable-card:not(.active):hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Icon Animation */
          .card-icon {
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: center;
          }
          
          .card-icon:hover {
            transform: scale(1.1) rotate(5deg);
            background: rgba(255,255,255,0.3);
          }
          
          /* Mobile Responsive */
          @media screen and (max-width: 1024px) {
            .expandable-container {
              flex-direction: column;
              height: auto;
              gap: 1rem;
            }
            
            .expandable-card.active {
              max-width: 100%;
              width: 100%;
              height: 350px;
              margin: 0;
              border-radius: 20px;
              background-size: cover;
              flex-grow: 0;
              transform: none;
            }
            
            .expandable-card:not(.active) {
              display: none;
            }
          }
          
          @media screen and (max-width: 768px) {
            .expandable-card.active {
              height: 300px;
              border-radius: 16px;
            }
          }
          
          @media screen and (max-width: 480px) {
            .expandable-card.active {
              height: 280px;
              border-radius: 12px;
            }
          }
          
          /* Fade in animation for button */
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 0.5s ease-in-out;
          }
        `
      }} />



      {/* Only on NUSA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ONLY ON NUSA
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Eksklusif events yang hanya bisa Anda temukan di platform kami
            </p>
          </div>

          {/* Expandable Cards Container */}
          <div className="relative">
            <div className="expandable-container flex items-stretch overflow-hidden min-w-full max-w-full w-full h-[400px] md:h-[500px] gap-2 md:gap-4">
              {events.slice(0, 5).filter(event => event.isPublished).map((event, index) => {
                const availability = getAvailabilityStatus(event)
                const isActive = activeEvent === event.id
                const canOpen = event.isPublished && (availability.status === 'available' || availability.status === 'limited')
                
                return (
                  <div
                    key={event.id}
                    className={`expandable-card relative overflow-hidden rounded-3xl transition-all duration-700 ease-in-out ${
                      isActive ? 'active' : ''
                    } ${canOpen ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    style={{
                      backgroundImage: event.thumbnailUrl ? `url(${getImageUrl(event.thumbnailUrl)})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundSize: isActive ? 'cover' : 'auto 120%',
                      backgroundPosition: 'center',
                      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onClick={(e) => {
                      if (canOpen) {
                        if (isActive) {
                          // If already active, navigate to event detail
                          e.stopPropagation()
                          handleEventClick(event.id)
                        } else {
                          // First click: expand card
                          setActiveEvent(event.id)
                        }
                      }
                    }}
                  >
                    {/* Shadow Overlay */}
                    <div className={`card-shadow absolute bottom-0 left-0 right-0 h-32 ${
                      isActive ? 'active' : ''
                    }`}></div>
                    
                    {/* Content */}
                    <div className={`card-content absolute bottom-0 left-0 right-0 p-4 md:p-6 ${
                      isActive ? 'active' : ''
                    }`}>
                      <div className="text-white">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg md:text-2xl font-bold line-clamp-2 flex-1">{event.title}</h3>
                          {event.isPrivate && (
                            <div className="ml-2 flex items-center bg-purple-600/80 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-xs font-medium">PRIVATE</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                          <span className="flex items-center">
                            <span className="text-yellow-400 mr-1">⭐</span>
                            4.8
                          </span>
                          <span className="text-xs bg-red-600 px-2 md:px-3 py-1 rounded-full">
                            {event.isFree || !event.price ? 'GRATIS' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                        <div className="text-xs md:text-sm text-gray-200 mb-3">
                          {formatDateTime(event.eventDate)} • {event.eventTime}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-gray-300">
                            {event.registeredCount || 0} attendees
                          </span>
                          <div className={`text-xs px-2 md:px-3 py-1 rounded-full ${
                            availability.status === 'available' ? 'bg-green-600 text-white' :
                            availability.status === 'limited' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {availability.text}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Icon for inactive cards */}
                    {!isActive && (
                      <div className="card-icon absolute bottom-4 right-4 w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Click to expand hint for inactive cards */}
                    {!isActive && canOpen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-all duration-300 ease-in-out">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                          Click to expand
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Netflix-Style Events Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Tidak ada event</h3>
              <p className="text-gray-600 font-light text-lg">
                {searchQuery ? 'Tidak ada event yang sesuai dengan pencarian Anda' : 'Belum ada event yang tersedia'}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Trending Events */}
              <div 
                className={`relative fade-in-section ${visibleSections.has('trending-section') ? 'visible' : ''}`}
                data-animation-id="trending-section"
                ref={(el) => {
                  if (el) sectionRefs.current.set('trending-section', el)
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold text-gray-900 slide-in-left ${visibleSections.has('trending-section') ? 'visible' : ''}`}>Trending Now</h2>
                  <div className={`text-sm text-gray-500 slide-in-right ${visibleSections.has('trending-section') ? 'visible' : ''}`}>
                    ← Scroll horizontal untuk melihat lebih banyak →
                  </div>
                </div>
                <div className="relative group">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth">
                    {events.slice(0, 8).map((event) => {
                      const eventStatus = getEventStatus(event, currentTime || undefined)
                      const availability = getAvailabilityStatus(event)
                      
                      return (
                        <div
                          key={event.id}
                          className={`flex-shrink-0 w-[24rem] cursor-pointer group/item stagger-card magnetic-hover ${visibleCards.has(`trending-${event.id}`) ? 'visible' : ''}`}
                          data-animation-id={`trending-${event.id}`}
                          ref={(el) => {
                            if (el) cardRefs.current.set(`trending-${event.id}`, el)
                          }}
                          onClick={() => handleEventClick(event.id)}
                        >
                          <div className="relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full">
                            {/* Image Section */}
                            <div className="relative h-48 overflow-hidden">
                              {event.thumbnailUrl ? (
                                <img
                                  src={getImageUrl(event.thumbnailUrl)}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="w-16 h-16 bg-white/80 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p className="text-blue-700 text-sm font-medium">Event</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Status Badge - Always Visible */}
                              <div className="absolute top-3 right-3 flex flex-col gap-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  availability.status === 'available' ? 'bg-green-500 text-white' :
                                  availability.status === 'limited' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                  {availability.text}
                                </div>
                                {(event as any).generateCertificate && (
                                  <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    CERT
                                  </div>
                                )}
                              </div>
                              
                              {/* Price Badge - Always Visible */}
                              <div className="absolute top-3 left-3">
                                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                                  <span className="text-sm font-bold text-gray-900">
                                    {event.isFree || !event.price ? 'GRATIS' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Content Section - Always Visible */}
                            <div className="p-4 flex flex-col flex-1 bg-white">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 pr-2">{event.title}</h3>
                                {event.isPrivate && (
                                  <div className="flex items-center bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                                    <svg className="w-3 h-3 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-xs font-medium text-purple-600">PRIVATE</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Date and Time - Always Visible */}
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDateTime(event.eventDate)}</span>
                                {event.eventTime && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>{event.eventTime}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Location - Always Visible */}
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                              
                              {/* Footer - Always Visible */}
                              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="font-medium">4.8</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span>{event.registeredCount || 0} peserta</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Category-based Rows */}
              {['Music', 'Business', 'Technology', 'Education', 'Sports', 'Art'].map((category, categoryIndex) => {
                const categoryEvents = events.filter(event => 
                  event.category?.toLowerCase().includes(category.toLowerCase()) || 
                  (category === 'Music' && !event.category) // Default to Music if no category
                ).slice(0, 6)
                
                if (categoryEvents.length === 0) return null
                
                return (
                  <div 
                    key={category} 
                    className={`relative fade-in-section ${visibleSections.has(`category-${category}`) ? 'visible' : ''}`}
                    data-animation-id={`category-${category}`}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(`category-${category}`, el)
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`text-2xl font-bold text-gray-900 slide-in-left ${visibleSections.has(`category-${category}`) ? 'visible' : ''}`}>{category}</h2>
                      <div className={`text-sm text-gray-500 slide-in-right ${visibleSections.has(`category-${category}`) ? 'visible' : ''}`}>
                        ← Scroll horizontal untuk melihat lebih banyak →
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth">
                        {categoryEvents.map((event) => {
                          const eventStatus = getEventStatus(event, currentTime || undefined)
                          const availability = getAvailabilityStatus(event)
                          
                          return (
                            <div
                              key={event.id}
                              className={`flex-shrink-0 w-[24rem] cursor-pointer stagger-card magnetic-hover ${visibleCards.has(`${category}-${event.id}`) ? 'visible' : ''}`}
                              data-animation-id={`${category}-${event.id}`}
                              ref={(el) => {
                                if (el) cardRefs.current.set(`${category}-${event.id}`, el)
                              }}
                              onClick={() => handleEventClick(event.id)}
                            >
                              <div className="relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full">
                                {/* Image Section */}
                                <div className="relative h-48 overflow-hidden">
                                  {event.thumbnailUrl ? (
                                    <img
                                      src={getImageUrl(event.thumbnailUrl)}
                                      alt={event.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center">
                                      <div className="text-center">
                                        <div className="w-16 h-16 bg-white/80 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p className="text-blue-700 text-sm font-medium">Event</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Status Badge - Always Visible */}
                                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      availability.status === 'available' ? 'bg-green-500 text-white' :
                                      availability.status === 'limited' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                      {availability.text}
                                    </div>
                                    {(event as any).generateCertificate && (
                                      <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                        CERT
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Price Badge - Always Visible */}
                                  <div className="absolute top-3 left-3">
                                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                                      <span className="text-sm font-bold text-gray-900">
                                        {event.isFree || !event.price ? 'GRATIS' : `Rp ${Number(event.price).toLocaleString('id-ID')}`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Content Section - Always Visible */}
                                <div className="p-4 flex flex-col flex-1 bg-white">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 pr-2">{event.title}</h3>
                                    {event.isPrivate && (
                                      <div className="flex items-center bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                                        <svg className="w-3 h-3 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-xs font-medium text-purple-600">PRIVATE</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Date and Time - Always Visible */}
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{formatDateTime(event.eventDate)}</span>
                                    {event.eventTime && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>{event.eventTime}</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Location - Always Visible */}
                                  <div className="flex items-center text-sm text-gray-600 mb-3">
                                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                  
                                  {/* Footer - Always Visible */}
                                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <span className="font-medium">4.8</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span>{event.registeredCount || 0} peserta</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-12">
              <Button
                onClick={loadMore}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 glow-effect magnetic-hover"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Memuat...
                  </>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div 
        className="py-24 bg-blue-600 mt-16 fade-in-section"
        data-animation-id="cta-section"
        ref={(el) => {
          if (el) sectionRefs.current.set('cta-section', el)
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl font-light text-white mb-6 scale-in ${visibleSections.has('cta-section') ? 'visible' : ''}`}>
            Tidak Menemukan Event yang Tepat?
          </h2>
          <p className={`text-xl text-blue-100 font-light mb-8 max-w-2xl mx-auto slide-in-left ${visibleSections.has('cta-section') ? 'visible' : ''}`}>
            Buat event Anda sendiri dan undang peserta untuk bergabung. 
            Platform kami memudahkan Anda mengelola event dari awal hingga selesai.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center slide-in-right ${visibleSections.has('cta-section') ? 'visible' : ''}`}>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 glow-effect magnetic-hover"
            >
              Buat Event Baru
            </Button>
            <Button
              onClick={() => router.push('/contact')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 magnetic-hover"
            >
              Hubungi Tim
            </Button>
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </div>
  )
}
