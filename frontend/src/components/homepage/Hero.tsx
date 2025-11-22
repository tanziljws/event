'use client'

import React from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import CountdownTimer from './CountdownTimer'

// Lazy load SmartImage
const SmartImage = dynamic(() => import('@/components/SmartImage'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
})

interface HeroProps {
  scrollY: number
  isScrollLocked: boolean
  scrollProgress: number
}

const Hero: React.FC<HeroProps> = ({ scrollY, isScrollLocked }) => {
  return (
    <main className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 relative z-20" style={{ scrollSnapAlign: 'start' }} data-section="0">
      {/* Sheila On 7 Banner Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Image
          src="/banner/sheila-banner.png"
          alt="Sheila On 7 Banner"
          fill
          className="object-cover"
          loading="eager"
          priority
          style={{ minHeight: '100vh' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Vignetting Effects */}
        <div className="vignette-overlay"></div>
        <div className="vignette-corners"></div>
        <div className="vignette-edges"></div>
        
        {/* Firework Motion Blur Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Firework Trails */}
          <div className="firework-trail" style={{ left: '15%', top: '20%', animationDelay: '0s' }}></div>
          <div className="firework-trail" style={{ left: '85%', top: '25%', animationDelay: '0.5s' }}></div>
          <div className="firework-trail" style={{ left: '50%', top: '15%', animationDelay: '1s' }}></div>
          <div className="firework-trail" style={{ left: '25%', top: '30%', animationDelay: '1.5s' }}></div>
          <div className="firework-trail" style={{ left: '75%', top: '35%', animationDelay: '2s' }}></div>
          
          {/* Firework Sparks */}
          <div className="firework-spark" style={{ left: '18%', top: '22%', animationDelay: '0.2s' }}></div>
          <div className="firework-spark" style={{ left: '82%', top: '27%', animationDelay: '0.7s' }}></div>
          <div className="firework-spark" style={{ left: '52%', top: '17%', animationDelay: '1.2s' }}></div>
          <div className="firework-spark" style={{ left: '28%', top: '32%', animationDelay: '1.7s' }}></div>
          <div className="firework-spark" style={{ left: '72%', top: '37%', animationDelay: '2.2s' }}></div>
          
          {/* Firework Bursts */}
          <div className="firework-burst" style={{ left: '20%', top: '18%', animationDelay: '0.3s' }}></div>
          <div className="firework-burst" style={{ left: '80%', top: '23%', animationDelay: '0.8s' }}></div>
          <div className="firework-burst" style={{ left: '48%', top: '13%', animationDelay: '1.3s' }}></div>
          <div className="firework-burst" style={{ left: '30%', top: '28%', animationDelay: '1.8s' }}></div>
          <div className="firework-burst" style={{ left: '70%', top: '33%', animationDelay: '2.3s' }}></div>
        </div>

        {/* Parallax Layered Atmospheric Effects */}
        {/* Far Background Layer - Dust Particles */}
        <div className="parallax-far-background parallax-move-slow">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="dust-particle" style={{ left: `${5 + i * 10}%`, top: '100%', animationDelay: `${i * 2}s` }}></div>
          ))}
        </div>

        {/* Background Layer - Glow Orbs */}
        <div className="parallax-background parallax-move-medium">
          <div className="glow-orb" style={{ left: '22%', top: '25%', animationDelay: '1s' }}></div>
          <div className="glow-orb" style={{ left: '78%', top: '30%', animationDelay: '3s' }}></div>
          <div className="glow-orb" style={{ left: '42%', top: '55%', animationDelay: '5s' }}></div>
          <div className="glow-orb" style={{ left: '58%', top: '50%', animationDelay: '7s' }}></div>
          <div className="glow-orb" style={{ left: '32%', top: '75%', animationDelay: '9s' }}></div>
        </div>

        {/* Mid Background Layer - Atmospheric Particles */}
        <div className="parallax-mid-background parallax-move-medium">
          <div className="atmospheric-particle" style={{ left: '10%', top: '40%', animationDelay: '0s' }}></div>
          <div className="atmospheric-particle" style={{ left: '90%', top: '45%', animationDelay: '1s' }}></div>
          <div className="atmospheric-particle" style={{ left: '30%', top: '60%', animationDelay: '2s' }}></div>
          <div className="atmospheric-particle" style={{ left: '70%', top: '55%', animationDelay: '3s' }}></div>
          <div className="atmospheric-particle" style={{ left: '50%', top: '70%', animationDelay: '4s' }}></div>
          <div className="atmospheric-particle" style={{ left: '15%', top: '80%', animationDelay: '5s' }}></div>
          <div className="atmospheric-particle" style={{ left: '85%', top: '75%', animationDelay: '6s' }}></div>
          <div className="atmospheric-particle" style={{ left: '40%', top: '85%', animationDelay: '7s' }}></div>
        </div>

        {/* Mid Foreground Layer - Ember Glow Effects */}
        <div className="parallax-mid-foreground parallax-move-fast">
          <div className="ember-glow" style={{ left: '12%', top: '35%', animationDelay: '0.5s' }}></div>
          <div className="ember-glow" style={{ left: '88%', top: '40%', animationDelay: '1.5s' }}></div>
          <div className="ember-glow" style={{ left: '35%', top: '65%', animationDelay: '2.5s' }}></div>
          <div className="ember-glow" style={{ left: '65%', top: '60%', animationDelay: '3.5s' }}></div>
          <div className="ember-glow" style={{ left: '55%', top: '75%', animationDelay: '4.5s' }}></div>
          <div className="ember-glow" style={{ left: '20%', top: '85%', animationDelay: '5.5s' }}></div>
        </div>

        {/* Foreground Layer - Sparkle Particles */}
        <div className="parallax-foreground parallax-move-very-fast">
          <div className="sparkle-particle" style={{ left: '8%', top: '30%', animationDelay: '0.2s' }}></div>
          <div className="sparkle-particle" style={{ left: '92%', top: '35%', animationDelay: '0.8s' }}></div>
          <div className="sparkle-particle" style={{ left: '25%', top: '50%', animationDelay: '1.4s' }}></div>
          <div className="sparkle-particle" style={{ left: '75%', top: '45%', animationDelay: '2s' }}></div>
          <div className="sparkle-particle" style={{ left: '45%', top: '65%', animationDelay: '2.6s' }}></div>
          <div className="sparkle-particle" style={{ left: '18%', top: '75%', animationDelay: '3.2s' }}></div>
          <div className="sparkle-particle" style={{ left: '82%', top: '70%', animationDelay: '3.8s' }}></div>
          <div className="sparkle-particle" style={{ left: '60%', top: '80%', animationDelay: '4.4s' }}></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image Content */}
          <div className="text-left scroll-slide-left">
            <div className="content-animate fade-in">
              <Image
                src="/images/poster.png"
                alt="Poster"
                width={600}
                height={800}
                className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg shadow-2xl"
                loading="eager"
                priority
              />
            </div>
          </div>

          {/* Right Side - Sheila On 7 Promotion */}
          <div className="text-left scroll-slide-right pl-8 lg:pl-16">
            <div className="content-animate fade-in">
              <h2 className="text-6xl sm:text-7xl font-bold text-white mb-4">
                SHEILA ON 7
              </h2>
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-6">
                16th Anniversary Concert
              </h3>
              <p className="text-lg text-white mb-8">
                May 1996 - 2012 • Special Performance
              </p>
            </div>

            {/* Countdown Timer - Memoized Component */}
            <CountdownTimer />
          </div>
        </div>

        {/* Center Text - WAIT FOR US */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scroll-center-text text-center">
            <h1 className="text-8xl sm:text-9xl font-bold text-white/90 tracking-wider">
              WAIT FOR US
            </h1>
          </div>
        </div>

        {/* Date Text - SEPTEMBER 30 JAKARTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scroll-date-text text-center">
            <h2 className="text-8xl sm:text-9xl font-bold text-white/90 tracking-wider mb-4">
              {new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { 
                month: 'long' 
              }).toUpperCase()} {new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).getDate()}
            </h2>
            <h3 className="text-6xl sm:text-7xl font-bold text-white/90 tracking-wider">
              JAKARTA
            </h3>
          </div>
        </div>

        {/* Sheila On 7 Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scroll-logo-text text-center">
            <Image
              src="/images/Sheila_on_7_2.png"
              alt="Sheila On 7 Logo"
              width={512}
              height={512}
              className="w-96 sm:w-[28rem] lg:w-[32rem] h-auto mx-auto drop-shadow-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default React.memo(Hero)

