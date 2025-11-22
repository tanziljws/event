'use client'

import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import './homepage.css'

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
      // Reset scroll progress when component mounts
      scrollProgressRef.current = 0
      setScrollProgress(0)
      setIsScrollLocked(false)
      document.body.style.overflow = 'auto'
      
      const handleScroll = () => {
        const scrollPosition = window.scrollY
        setScrollY(scrollPosition)
        
        // Removed console.log for better performance
        
        // Only handle scroll if not in text animation phase
        if (scrollProgressRef.current >= 600) {
          // Snap effect at 600px - auto scroll to 900px position
          if (scrollPosition > 550 && scrollPosition < 650) {
            // Force scroll to 900px position
            window.scrollTo({
              top: 900,
              behavior: 'smooth'
            })
          }
        }
      }
      
      // Add wheel event listener for text animation
      const handleWheel = (e: WheelEvent) => {
        const scrollPosition = window.scrollY
        
        // Only handle text animation when in header section (0-500px)
        if (scrollPosition < 500) {
          // Detect scroll direction
          const isScrollingUp = e.deltaY < 0
          const isScrollingDown = e.deltaY > 0
          
          // If scrolling up and text is already out, reset animation
          if (isScrollingUp && scrollProgressRef.current > 0) {
            e.preventDefault()
            const newProgress = Math.max(scrollProgressRef.current - Math.abs(e.deltaY) * 0.15, 0)
            scrollProgressRef.current = newProgress
            setScrollProgress(newProgress)
            
            // Reset text animations based on progress
            const leftText = document.querySelector('.scroll-slide-left')
            const rightText = document.querySelector('.scroll-slide-right')
            const centerText = document.querySelector('.scroll-center-text')
            const dateText = document.querySelector('.scroll-date-text')
            const logoText = document.querySelector('.scroll-logo-text')
            
            if (newProgress <= 180) {
              leftText?.classList.remove('scroll-out')
            }
            
            if (newProgress <= 360) {
              rightText?.classList.remove('scroll-out')
            }
            
            // Hide center text when right text starts coming back
            if (newProgress <= 450) {
              centerText?.classList.remove('scroll-in')
            }
            
            // Hide date text and show center text when scrolling back
            if (newProgress <= 520) {
              dateText?.classList.remove('scroll-in')
              if (newProgress > 450) {
                centerText?.classList.add('scroll-in')
              }
            }
            
            // Hide logo and show date text when scrolling back
            if (newProgress <= 580) {
              logoText?.classList.remove('scroll-in')
              if (newProgress > 520) {
                dateText?.classList.add('scroll-in')
              }
            }
            
            // If fully reset, unlock scroll
            if (newProgress <= 0) {
              setIsScrollLocked(false)
              document.body.style.overflow = 'auto'
            }
          }
          // If scrolling down and animation not complete
          else if (isScrollingDown && scrollProgressRef.current < 700) {
            e.preventDefault()
            // Extremely slow scroll sensitivity
            const newProgress = Math.min(scrollProgressRef.current + Math.abs(e.deltaY) * 0.15, 700)
            scrollProgressRef.current = newProgress
            setScrollProgress(newProgress)
            
            // Trigger text animations based on wheel progress
            const leftText = document.querySelector('.scroll-slide-left')
            const rightText = document.querySelector('.scroll-slide-right')
            const centerText = document.querySelector('.scroll-center-text')
            const dateText = document.querySelector('.scroll-date-text')
            const logoText = document.querySelector('.scroll-logo-text')
            
            if (newProgress > 180) {
              leftText?.classList.add('scroll-out')
            }
            
            if (newProgress > 360) {
              rightText?.classList.add('scroll-out')
            }
            
            // Show center text after right text is fully out (with delay)
            if (newProgress > 450) {
              centerText?.classList.add('scroll-in')
            }
            
            // Show date text after center text (with more delay)
            if (newProgress > 520) {
              centerText?.classList.remove('scroll-in')
              dateText?.classList.add('scroll-in')
            }
            
            // Show logo after date text (with even more delay)
            if (newProgress > 580) {
              dateText?.classList.remove('scroll-in')
              logoText?.classList.add('scroll-in')
            }
            
            // After text animations complete, allow normal scroll
            if (newProgress >= 700) {
              setIsScrollLocked(false)
              document.body.style.overflow = 'auto'
              // Auto scroll to next section
              setTimeout(() => {
                window.scrollTo({
                  top: 300,
                  behavior: 'smooth'
                })
                // Ensure scroll is fully unlocked after auto scroll
                setTimeout(() => {
                  setIsScrollLocked(false)
                  document.body.style.overflow = 'auto'
                }, 1000)
              }, 500)
            }
          }
        }
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
    window.addEventListener('wheel', handleWheel, { passive: false })
    
      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('wheel', handleWheel)
        clearTimeout(timer)
        // Cleanup body overflow and reset states
        document.body.style.overflow = 'auto'
        scrollProgressRef.current = 0
        setScrollProgress(0)
        setIsScrollLocked(false)
      }
    }, 200) // Defer scroll effects 200ms to let page render first

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // Fetch featured events from API - deferred to not block initial render
  useEffect(() => {
    let isMounted = true

    // Defer API call to not block initial render
    const timeoutId = setTimeout(() => {
      const fetchFeaturedEvents = async () => {
        try {
          setLoading(true)
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
        {/* Transparent Homepage Navbar */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-visible">
                <Image
                  src="/logo-nusa.png"
                  alt="Nusa Logo"
                  width={48}
                  height={48}
                  className="h-full w-auto max-w-full object-contain"
                  style={{ maxHeight: '48px' }}
                  loading="eager"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">E</span>'
                    }
                  }}
                />
              </div>
              <span className="text-white font-bold text-xl">Nusa</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search Form */}
              <form onSubmit={handleSubmit(handleSearch)} className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    {...register('query')}
                    type="text"
                    placeholder="Cari event..."
                    className="w-64 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Navigation Links */}
              <Link href="/about" className="text-white/90 hover:text-white transition-colors duration-300">
                About
              </Link>
              <Link href="/events" className="text-white/90 hover:text-white transition-colors duration-300">
                Event
              </Link>
              <Link href="/pricing" className="text-white/90 hover:text-white transition-colors duration-300">
                Pricing
              </Link>
              <Link href="/contact" className="text-white/90 hover:text-white transition-colors duration-300">
                Kontak
              </Link>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 text-sm">Hi, {user?.fullName}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-300"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-300"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 text-white text-sm"
              >
                Cari
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {showSearch && (
            <div className="md:hidden mt-4">
              <form onSubmit={handleSubmit(handleSearch)} className="flex items-center space-x-2">
                <input
                  {...register('query')}
                  type="text"
                  placeholder="Cari event..."
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-300"
                >
                  Cari
                </button>
              </form>
            </div>
          )}

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
              <Link href="/about" className="block text-white/90 hover:text-white transition-colors duration-300">
                About
              </Link>
              <Link href="/events" className="block text-white/90 hover:text-white transition-colors duration-300">
                Event
              </Link>
              <Link href="/pricing" className="block text-white/90 hover:text-white transition-colors duration-300">
                Pricing
              </Link>
              <Link href="/contact" className="block text-white/90 hover:text-white transition-colors duration-300">
                Kontak
              </Link>
              <div className="pt-3 border-t border-white/20">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <span className="block text-white/90 text-sm">Hi, {user?.fullName}</span>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-300"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="block w-full px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-all duration-300 text-center"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 text-center"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Header Section with Split Layout - Lazy Loaded */}
        <Hero scrollY={scrollY} isScrollLocked={isScrollLocked} scrollProgress={scrollProgress} />

        {/* Test Content Section */}
        <section className="min-h-screen flex items-end justify-center px-4 sm:px-6 lg:px-8 relative bg-white pb-20 pt-32" style={{ scrollSnapAlign: 'start' }} data-section="1">
          {/* Running Text */}
          <div className="absolute top-0 left-0 w-full overflow-hidden bg-gray-800 py-4 running-text-container">
            <div className="running-text">
              <span className="text-3xl font-bold text-white whitespace-nowrap">
                SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW • SHEILA ON 7 • BUY TICKET NOW •
              </span>
            </div>
          </div>
          
          <div className="text-center max-w-6xl mx-auto">
            {/* Next Big Event Section */}
            <div className="content-animate delay-1 mb-16">
              <h2 className="text-5xl sm:text-6xl font-bold text-blue-600 mb-12 text-center">
                EVENTS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Event 1 */}
                <div className="text-left">
                  <div className="text-blue-600 text-lg font-bold mb-2">DEC 25, 2024</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Music of the Spheres World Tour</h3>
                  <div className="text-red-500 text-lg font-semibold">SOLD OUT</div>
                </div>
                
                {/* Event 2 */}
                <div className="text-left">
                  <div className="text-blue-600 text-lg font-bold mb-2">JAN 15, 2025</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">The Eras Tour</h3>
                  <div className="text-green-500 text-lg font-semibold">TICKETS AVAILABLE</div>
                </div>
                
                {/* Event 3 */}
                <div className="text-left">
                  <div className="text-blue-600 text-lg font-bold mb-2">FEB 20, 2025</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Mathematics Tour</h3>
                  <div className="text-orange-500 text-lg font-semibold">LIMITED SEATS</div>
                </div>
              </div>
            </div>

             <div className="content-animate delay-2 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               {/* Coldplay - Music of the Spheres World Tour */}
               <div className="relative group cursor-pointer">
                 <div className="event-card-container">
                   <Image
                     src="/next_events/music_speheres.jpg"
                     alt="Coldplay Concert"
                     width={600}
                     height={400}
                     className="w-full h-auto group-hover:scale-110 transition-transform duration-300"
                     loading="lazy"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                     <h3 className="text-lg font-semibold mb-1 line-clamp-2">Music of the Spheres World Tour</h3>
                     <p className="text-sm text-gray-200 line-clamp-1">Jakarta Convention Center</p>
                   </div>
                 </div>
               </div>

               {/* Taylor Swift - The Eras Tour */}
               <div className="relative group cursor-pointer">
                 <div className="event-card-container">
                   <Image
                     src="/next_events/the_eras.jpg"
                     alt="Taylor Swift Concert"
                     width={600}
                     height={400}
                     className="w-full h-auto group-hover:scale-110 transition-transform duration-300"
                     loading="lazy"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                     <h3 className="text-lg font-semibold mb-1 line-clamp-2">The Eras Tour</h3>
                     <p className="text-sm text-gray-200 line-clamp-1">Jakarta Convention Center</p>
                   </div>
                 </div>
               </div>

               {/* Ed Sheeran - Mathematics Tour */}
               <div className="relative group cursor-pointer">
                 <div className="event-card-container">
                   <Image
                     src="/next_events/edsheeran.jpg"
                     alt="Ed Sheeran Concert"
                     width={600}
                     height={400}
                     className="w-full h-auto group-hover:scale-110 transition-transform duration-300"
                     loading="lazy"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                     <h3 className="text-lg font-semibold mb-1 line-clamp-2">Mathematics Tour</h3>
                     <p className="text-sm text-gray-200 line-clamp-1">Jakarta Convention Center</p>
                   </div>
                 </div>
               </div>
             </div>

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
                            <path d="M8 5v14l11-7z"/>
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
                          <path d="M8 5v14l11-7z"/>
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

    {/* Footer */}
    <footer className="bg-gray-50 border-t border-gray-200 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <span className="text-xl font-semibold text-gray-900">Event Management</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Platform manajemen event paling canggih untuk tim modern. Buat, kelola, dan skalakan event dengan tools yang dirancang untuk dunia modern.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h6 className="text-sm font-semibold text-gray-900 mb-4">Produk</h6>
            <div className="space-y-3">
              <Link href="/events" className="block text-gray-600 hover:text-gray-900 transition-colors">Lihat Event</Link>
              <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/app" className="block text-gray-600 hover:text-gray-900 transition-colors">Mobile App</Link>
              <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</Link>
              <Link href="/login" className="block text-gray-600 hover:text-gray-900 transition-colors">Masuk</Link>
              <Link href="/register" className="block text-gray-600 hover:text-gray-900 transition-colors">Daftar</Link>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h6 className="text-sm font-semibold text-gray-900 mb-4">Perusahaan</h6>
            <div className="space-y-3">
              <Link href="/about" className="block text-gray-600 hover:text-gray-900 transition-colors">Tentang</Link>
              <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</Link>
              <Link href="/careers" className="block text-gray-600 hover:text-gray-900 transition-colors">Karir</Link>
              <Link href="/blog" className="block text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © 2025 Event Management System. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privasi</Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Syarat</Link>
              <Link href="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">Cookies</Link>
              <Link href="/security" className="text-gray-600 hover:text-gray-900 transition-colors">Keamanan</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  )
}
