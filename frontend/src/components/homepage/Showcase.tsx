'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { getImageUrl } from '@/lib/image-utils'

// Lazy load SmartImage
const SmartImage = dynamic(() => import('@/components/SmartImage'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
})

interface Event {
  id: string
  title: string
  thumbnailUrl?: string | null
}

interface ShowcaseProps {
  featuredEvents: Event[]
  hoveredCard: string | null
  setHoveredCard: (card: string | null) => void
}

const Showcase: React.FC<ShowcaseProps> = ({ featuredEvents, hoveredCard, setHoveredCard }) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative bg-transparent" style={{ scrollSnapAlign: 'start' }} data-section="3">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-left mb-16">
          <h2 className="content-animate fade-in text-4xl sm:text-5xl font-bold text-gray-900 mb-6 uppercase">
            Event <span className="text-blue-600">Showcase</span>
          </h2>
          <div className="w-24 h-1 bg-blue-600"></div>
        </div>

        <div className="space-y-24">
          {/* Event Card 1 - Left */}
          <div className="content-animate delay-2 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative group">
              <div 
                className="aspect-video rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
                onMouseEnter={() => setHoveredCard('card1')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {featuredEvents[0]?.thumbnailUrl ? (
                  <SmartImage
                    src={getImageUrl(featuredEvents[0].thumbnailUrl)}
                    alt={featuredEvents[0].title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-lg font-medium">Event Image</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-xl font-semibold text-gray-800 uppercase">{featuredEvents[0]?.title || 'Workshop Digital Marketing'}</h3>
              </div>
            </div>
            <div className="order-1 lg:order-2"></div>
          </div>

          {/* Event Card 2 - Right */}
          <div className="content-animate delay-3 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="lg:order-1"></div>
            <div className="lg:order-2 -mt-56 relative group">
              <div 
                className="h-[800px] rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
                onMouseEnter={() => setHoveredCard('card2')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {featuredEvents[1]?.thumbnailUrl ? (
                  <SmartImage
                    src={getImageUrl(featuredEvents[1].thumbnailUrl)}
                    alt={featuredEvents[1].title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-lg font-medium">Event Image</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-xl font-semibold text-gray-800 uppercase">{featuredEvents[1]?.title || 'Seminar Startup & Innovation'}</h3>
              </div>
            </div>
          </div>

          {/* Event Card 3 - Left */}
          <div className="content-animate delay-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="order-2 lg:order-1 -mt-56 relative group">
              <div 
                className="h-[800px] rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
                onMouseEnter={() => setHoveredCard('card3')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {featuredEvents[2]?.thumbnailUrl ? (
                  <SmartImage
                    src={getImageUrl(featuredEvents[2].thumbnailUrl)}
                    alt={featuredEvents[2].title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-lg font-medium">Event Image</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-left">
                <h3 className="text-xl font-semibold text-gray-800 uppercase">{featuredEvents[2]?.title || 'Conference AI & Machine Learning'}</h3>
              </div>
            </div>
            <div className="order-1 lg:order-2"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(Showcase)

