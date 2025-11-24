'use client'

import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import './homepage.css'
import Footer from '@/components/layout/footer'

// Lazy load heavy components - only load when needed
const Navbar = dynamic(() => import('@/components/navbar'), {
  ssr: false,
  loading: () => <div className="h-16" /> // Placeholder height
})

// Lazy load homepage sections - only load when needed
const Hero = dynamic(() => import('@/components/homepage/Hero'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
})

const Showcase = dynamic(() => import('@/components/homepage/Showcase'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-transparent" />
})

const LatestEvents = dynamic(() => import('@/components/homepage/LatestEvents'), {
  ssr: false,
  loading: () => <div className="py-20 bg-white" />
})

// Regular imports for frequently used items
import { Button } from '@/components/ui/button'
import { ApiService } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Event {
  id: string
  title: string
  description?: string
  location: string
  thumbnailUrl?: string | null
  eventDate?: string
  eventTime?: string
  maxParticipants?: number
  isFree?: boolean
  price?: string | null
  category?: string
  _count?: {
    registrations: number
  }
}

// Search form schema
const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required')
})

type SearchForm = z.infer<typeof searchSchema>

export default function HomePage() {
  const { user, isAuthenticated, isInitialized, logout } = useAuth()
  const router = useRouter()
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isScrollLocked, setIsScrollLocked] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const scrollProgressRef = useRef(0)
  const lastScrollY = useRef(0)

  // Search form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema)
  })

  const handleSearch = (data: SearchForm) => {
    router.push(`/events?search=${encodeURIComponent(data.query)}`)
  }

  // Mouse tracking for tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])


  // Scroll effect for background change and content animation - deferred to not block initial render
  useEffect(() => {
    // Defer scroll effects to not block initial render
    const timeoutId = setTimeout(() => {
      const handleScroll = () => {
        const scrollPosition = window.scrollY
        setScrollY(scrollPosition)
      }

      // Wait for DOM to be ready and hydration complete
      const timer = setTimeout(() => {
        const observerOptions = {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Add animation class immediately for smooth effect
              entry.target.classList.add('animate-in')
            } else {
              // Remove animation class when out of view for repeat effect
              entry.target.classList.remove('animate-in')
            }
          })
        }, observerOptions)

        // Observe all scroll animation elements
        const animateElements = document.querySelectorAll('.content-animate')
        const scrollAnimateElements = document.querySelectorAll('.scroll-animate-up')

        if (animateElements.length > 0) {
          animateElements.forEach((el) => observer.observe(el))
        }

        if (scrollAnimateElements.length > 0) {
          scrollAnimateElements.forEach((el) => observer.observe(el))
        }

        return () => observer.disconnect()
      }, 100) // Delay for scroll animation

      window.addEventListener('scroll', handleScroll)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        clearTimeout(timer)
      }
    }, 200) // Defer scroll effects 200ms to let page render first

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // Fetch featured homepage events from API - deferred to not block initial render
  useEffect(() => {
    let isMounted = true

    // Defer API call to not block initial render
    const timeoutId = setTimeout(() => {
      const fetchFeaturedEvents = async () => {
        try {
          setLoading(true)
          // Try to fetch homepage featured events first
          try {
            const featuredResponse = await ApiService.getHomepageFeaturedEvents()
            if (isMounted && featuredResponse.success && featuredResponse.data?.events) {
              const events = featuredResponse.data.events
              if (events.length === 3) {
                setFeaturedEvents(events)
                setLoading(false)
                return
              }
            }
          } catch (featuredError) {
            console.log('No featured events set, falling back to recent events')
          }

          // Fallback to recent published events if no featured events
          const response = await ApiService.getPublicEvents({
            limit: 3,
            isPublished: true,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })

          if (isMounted && response.success && response.data?.events) {
            setFeaturedEvents(response.data.events)
          }
        } catch (error) {
          console.error('Error fetching events:', error)
          // Fallback to static data if API fails
          if (isMounted) {
            setFeaturedEvents([
              {
                id: '1',
                title: 'Jakarta International Expo',
                thumbnailUrl: null,
                location: 'Jakarta Convention Center',
                _count: { registrations: 15000 }
              },
              {
                id: '2',
                title: 'Indonesia Tech Conference',
                thumbnailUrl: null,
                location: 'Balai Kartini',
                _count: { registrations: 8500 }
              },
              {
                id: '3',
                title: 'Startup Indonesia Summit',
                thumbnailUrl: null,
                location: 'ICE BSD City',
                _count: { registrations: 5200 }
              }
            ])
          }
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }

      fetchFeaturedEvents()
    }, 100) // Defer 100ms to let page render first

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])


  // if (!isInitialized) {
  //   return <LoadingSpinner />
  // }


  return (
    <>
      {/* Use global Navbar component */}
      <Navbar />

      <div
        className={`min-h-screen relative overflow-hidden scroll-smooth transition-all duration-1000 ease-in-out snap-container ${scrollY > 350 && scrollY < 450 ? 'snap-active' : ''}`}
        style={{
          scrollSnapType: 'y mandatory',
          backgroundColor: scrollY > 400 ? '#ffffff' : '#f8fafc',
          transform: `translateY(${scrollY * 0.05}px) scale(${scrollY > 200 && scrollY < 1000 ? 1 + (scrollY - 200) * 0.0005 : 1})`,
          borderRadius: `${scrollY > 400 ? Math.min((scrollY - 400) * 0.1, 20) : 0}px`,
          overflow: isScrollLocked ? 'hidden' : 'auto'
        }}
      >

        {/* Antigravity-Style Hero Section */}
        <section className="relative bg-white min-h-screen flex items-center justify-center overflow-hidden -mt-24 pt-24">
          {/* Mouse-following Gradient Background */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 50%)`,
              transition: 'background 0.3s ease'
            }}
          ></div>

          {/* Animated Particles Background */}
          <div className="absolute inset-0 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#3b82f6" opacity="0.1">
                    <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
                  </circle>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />

              {/* Animated floating particles */}
              <g className="floating-particles">
                <circle cx="10%" cy="20%" r="2" fill="#3b82f6" opacity="0.2">
                  <animate attributeName="cy" values="20%;80%;20%" dur="20s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="30%" cy="40%" r="1.5" fill="#3b82f6" opacity="0.3">
                  <animate attributeName="cy" values="40%;10%;40%" dur="15s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="50%" cy="60%" r="2.5" fill="#3b82f6" opacity="0.15">
                  <animate attributeName="cy" values="60%;30%;60%" dur="18s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.15;0.4;0.15" dur="5s" repeatCount="indefinite" />
                </circle>
                <circle cx="70%" cy="30%" r="1.8" fill="#3b82f6" opacity="0.25">
                  <animate attributeName="cy" values="30%;70%;30%" dur="22s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0.5;0.25" dur="4.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="85%" cy="50%" r="1.2" fill="#3b82f6" opacity="0.2">
                  <animate attributeName="cy" values="50%;20%;50%" dur="17s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="20%" cy="70%" r="2.2" fill="#3b82f6" opacity="0.18">
                  <animate attributeName="cy" values="70%;15%;70%" dur="19s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.18;0.42;0.18" dur="4.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="60%" cy="85%" r="1.6" fill="#3b82f6" opacity="0.22">
                  <animate attributeName="cy" values="85%;25%;85%" dur="21s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.22;0.48;0.22" dur="3.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="90%" cy="75%" r="1.4" fill="#3b82f6" opacity="0.28">
                  <animate attributeName="cy" values="75%;35%;75%" dur="16s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.28;0.52;0.28" dur="4.8s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Logo/Brand */}
            <div className="mb-8 animate-fade-in">
              <Link href="/" className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-700 transition-colors group">
                <div className="w-20 h-20 flex items-center justify-center overflow-visible transform group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/logo-nusa.png"
                    alt="Nusa Logo"
                    width={80}
                    height={80}
                    className="h-full w-auto max-w-full object-contain"
                    style={{ maxHeight: '80px' }}
                    loading="eager"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-blue-600 font-bold text-4xl">N</span>'
                      }
                    }}
                  />
                </div>
                <span className="text-2xl font-semibold">NusaEvent</span>
              </Link>
            </div>

            {/* Main Heading with NUSA Carousel */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 tracking-tight text-center">
                Create Events
              </h1>
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mt-4">
                <span className="inline-block relative" style={{ minWidth: '500px', height: '1.2em', overflow: 'hidden' }}>
                  <span className="vertical-carousel absolute top-0 left-0 w-full text-center">
                    <span className="carousel-item block">
                      <span className="text-blue-600">NOW</span>
                    </span>
                    <span className="carousel-item block">
                      <span className="text-blue-600">with US</span>
                    </span>
                    <span className="carousel-item block">
                      <span className="text-blue-600">to SHARE</span>
                    </span>
                    <span className="carousel-item block">
                      <span className="text-blue-600">ANYWHERE</span>
                    </span>
                  </span>
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p className="text-2xl md:text-3xl lg:text-4xl text-gray-600 mb-12 font-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
              with the next-generation event platform
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => {
                  // Add zoom effect
                  const body = document.body
                  body.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out'
                  body.style.transform = 'scale(1.2)'
                  body.style.opacity = '0'

                  setTimeout(() => {
                    // Reset styles before navigation
                    body.style.transform = 'scale(1)'
                    body.style.opacity = '1'
                    body.style.transition = ''
                    router.push('/events')
                  }, 600)
                }}
                className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>Explore Events</span>
              </button>
              <Link href="/about">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 transform hover:scale-105">
                  Learn more
                </button>
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes fade-in {
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
            animation: fade-in 0.8s ease-out forwards;
            opacity: 0;
          }

          .floating-particles circle {
            filter: blur(1px);
          }

          /* Vertical Carousel */
          .vertical-carousel {
            display: block;
            animation: vertical-slide 8s ease-in-out infinite;
          }

          .carousel-item {
            height: 1.2em;
            line-height: 1.2em;
          }

          @keyframes vertical-slide {
            0%, 22% {
              transform: translateY(0);
            }
            25%, 47% {
              transform: translateY(-1.2em);
            }
            50%, 72% {
              transform: translateY(-2.4em);
            }
            75%, 97% {
              transform: translateY(-3.6em);
            }
            100% {
              transform: translateY(-4.8em);
            }
          }
        `}</style>


        {/* Test Content Section */}
        <section className="min-h-screen flex items-end justify-center px-4 sm:px-6 lg:px-8 relative bg-white pb-20 pt-32" style={{ scrollSnapAlign: 'start' }} data-section="1">
          {/* Running Text */}
          <div className="absolute top-0 left-0 w-full overflow-hidden bg-blue-600 py-4 running-text-container">
            <div className="running-text">
              <span className="text-3xl font-bold text-white whitespace-nowrap">
                UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW • UPCOMING EVENTS • REGISTER NOW •
              </span>
            </div>
          </div>

          <div className="text-center max-w-6xl mx-auto">
            {/* Next Big Event Section */}
            <div className="content-animate delay-1 mb-16">
              <h2 className="text-5xl sm:text-6xl font-bold text-blue-600 mb-12 text-center">
                EVENTS
              </h2>
              {featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {featuredEvents.map((event, index) => {
                    const eventDate = event.eventDate ? new Date(event.eventDate) : null
                    const formattedDate = eventDate
                      ? eventDate.toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).toUpperCase()
                      : 'TBA'
                    
                    // Determine status based on registrations
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
                      <div key={event.id || index} className="text-left">
                        <div className="text-blue-600 text-lg font-bold mb-2">{formattedDate}</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2">{event.title}</h3>
                        <div className={`${statusColor} text-lg font-semibold`}>{statusText}</div>
                </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No featured events available</div>
              )}
            </div>

            {featuredEvents.length > 0 && (
            <div className="content-animate delay-2 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {featuredEvents.map((event, index) => (
                  <div
                    key={event.id || index}
                    className="relative group cursor-pointer"
                    onClick={() => {
                      if (event.id) {
                        router.push(`/events/${event.id}`)
                      }
                    }}
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
                      {/* Certificate Badge */}
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
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Third Section - Video Only */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative bg-white" style={{ scrollSnapAlign: 'start' }} data-section="2">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex justify-center h-[80vh]">
              {/* Video Content */}
              <div className="content-animate w-full">
                <div className="relative h-full">
                  <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl w-full h-full">
                    {/* Video Placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-white text-lg font-medium">Demo Video</p>
                        <p className="text-gray-300 text-sm">Platform Event Management</p>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                        <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fourth Section - Event Cards Alternating - Lazy Loaded */}
        <Showcase
          featuredEvents={featuredEvents}
          hoveredCard={hoveredCard}
          setHoveredCard={setHoveredCard}
        />

        {/* More Projects Button Section */}
        <section className="py-16 bg-transparent">
          <div className="max-w-7xl mx-auto pl-2 pr-4 sm:pl-2 sm:pr-6 lg:pl-2 lg:pr-8">
            <div className="text-left">
              <button className="learn-more">
                <span className="circle">
                  <span className="icon arrow"></span>
                </span>
                <span className="button-text">More Events</span>
              </button>
            </div>
          </div>
        </section>

        {/* Latest Events Section - Lazy Loaded with Scroll Trigger */}
        <LatestEvents featuredEvents={featuredEvents} />

      </div>

      {/* Floating Tooltip that follows cursor - Outside main container */}
      {hoveredCard && (
        <div
          className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg pointer-events-none whitespace-nowrap z-[9999] shadow-lg tooltip-animate"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 30,
          }}
        >
          {hoveredCard === 'card1' && (featuredEvents[0]?.title || 'Workshop Digital Marketing')}
          {hoveredCard === 'card2' && (featuredEvents[1]?.title || 'Seminar Startup & Innovation')}
          {hoveredCard === 'card3' && (featuredEvents[2]?.title || 'Conference AI & Machine Learning')}
        </div>
      )}

      <Footer />
    </>
  )
}
