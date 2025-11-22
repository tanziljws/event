'use client'

import React, { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    // Set target date to 30 days from now
    const now = new Date()
    const targetDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
    targetDate.setHours(21, 0, 0, 0) // Set to 9:00 PM

    const timer = setInterval(() => {
      const currentTime = new Date().getTime()
      const distance = targetDate.getTime() - currentTime

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="content-animate delay-1 mb-8">
      <h4 className="text-2xl font-medium text-white mb-6" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
        Event Starts In:
      </h4>
      <div className="flex space-x-4 sm:space-x-6">
        <div className="text-center countdown-container">
          <div className="text-4xl sm:text-5xl lg:text-6xl countdown-number text-white">{timeLeft.days}</div>
          <div className="text-sm sm:text-base lg:text-lg countdown-label text-white">Days</div>
        </div>
        <div className="text-center countdown-container">
          <div className="text-4xl sm:text-5xl lg:text-6xl countdown-number text-white">{timeLeft.hours}</div>
          <div className="text-sm sm:text-base lg:text-lg countdown-label text-white">Hours</div>
        </div>
        <div className="text-center countdown-container">
          <div className="text-4xl sm:text-5xl lg:text-6xl countdown-number text-white">{timeLeft.minutes}</div>
          <div className="text-sm sm:text-base lg:text-lg countdown-label text-white">Minutes</div>
        </div>
        <div className="text-center countdown-container">
          <div className="text-4xl sm:text-5xl lg:text-6xl countdown-number text-white">{timeLeft.seconds}</div>
          <div className="text-sm sm:text-base lg:text-lg countdown-label text-white">Seconds</div>
        </div>
      </div>
    </div>
  )
}

// Memoize untuk prevent re-render parent component
export default React.memo(CountdownTimer)

