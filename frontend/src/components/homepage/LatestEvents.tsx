'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-utils'

interface Event {
  id: string
  title: string
  description?: string
  location: string
  thumbnailUrl?: string | null
  category?: string
}

interface LatestEventsProps {
  featuredEvents: Event[]
}

const LatestEvents: React.FC<LatestEventsProps> = ({ featuredEvents }) => {
  const [showEvents, setShowEvents] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 500) {
        setShowEvents(true)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!showEvents) {
    return (
      <section className="py-20 bg-white" data-section="latest-events">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 scroll-animate-up">LATEST EVENTS</h2>
            <div className="w-24 h-1 bg-blue-600 scroll-animate-up" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="h-96 flex items-center justify-center">
            <div className="text-gray-400">Scroll down to see events...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white" data-section="latest-events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 scroll-animate-up">LATEST EVENTS</h2>
          <div className="w-24 h-1 bg-blue-600 scroll-animate-up" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Marquee Container */}
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee">
            {/* First set of cards */}
            {featuredEvents.map((event) => (
              <div key={`first-${event.id}`} className="flex-shrink-0 w-80 mx-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {event.thumbnailUrl ? (
                    <Image
                      src={getImageUrl(event.thumbnailUrl)}
                      alt={event.title}
                      width={320}
                      height={192}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200" style={{ display: event.thumbnailUrl ? 'none' : 'flex' }}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/80 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-blue-700 text-sm font-medium">Event</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{event.location}</span>
                      <span className="text-sm font-medium text-blue-600">{event.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {featuredEvents.map((event) => (
              <div key={`second-${event.id}`} className="flex-shrink-0 w-80 mx-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {event.thumbnailUrl ? (
                    <Image
                      src={getImageUrl(event.thumbnailUrl)}
                      alt={event.title}
                      width={320}
                      height={192}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200" style={{ display: event.thumbnailUrl ? 'none' : 'flex' }}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white/80 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-blue-700 text-sm font-medium">Event</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{event.location}</span>
                      <span className="text-sm font-medium text-blue-600">{event.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(LatestEvents)

