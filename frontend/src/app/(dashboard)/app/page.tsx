'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Smartphone, 
  Download, 
  Star, 
  Users, 
  Calendar, 
  QrCode, 
  Bell, 
  Globe,
  CheckCircle,
  ArrowRight,
  Play,
  Award,
  BarChart3
} from 'lucide-react'
import Navbar from '@/components/navbar'

export default function AppPage() {
  const appStats = [
    { number: '10K+', label: 'Downloads' },
    { number: '4.8', label: 'Rating' },
    { number: '50+', label: 'Countries' },
    { number: '99.9%', label: 'Uptime' }
  ]

  return (
    <>
      <style jsx global>{`
        :root {
          --color-bg: #ffffff;
          --color-text: #1f2937;
        }

        body {
          background: var(--color-bg);
          color: var(--color-text);
          overflow-x: hidden;
        }

        /* Animated Background Grid */
        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
          opacity: 1;
        }

        /* App Card Hover Effects */
        .app-card {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          z-index: 10;
        }

        .app-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Feature Card Animation */
        .feature-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .feature-card.active {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        /* Download Button Animation */
        .download-btn {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2);
        }

        .download-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .download-btn:hover::before {
          left: 100%;
        }

        /* Phone Mockup Styles */
        .phone-body {
          position: relative;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          box-shadow: 
            0 0 0 2px rgba(255, 255, 255, 0.1),
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-radius: 3rem;
          animation: phoneGlow 4s ease-in-out infinite alternate;
        }

        @keyframes phoneGlow {
          0% {
            box-shadow: 
              0 0 0 2px rgba(255, 255, 255, 0.1),
              0 20px 40px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          100% {
            box-shadow: 
              0 0 0 2px rgba(59, 130, 246, 0.3),
              0 20px 40px rgba(59, 130, 246, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        }

        .phone-body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .side-buttons {
          position: absolute;
          background: linear-gradient(90deg, #374151 0%, #1f2937 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .phone-screen {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          border-radius: 2.5rem;
          animation: screenShimmer 6s ease-in-out infinite;
        }

        @keyframes screenShimmer {
          0%, 100% {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          }
          50% {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0f172a 100%);
          }
        }

        .notch {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .speaker {
          background: linear-gradient(90deg, #4b5563 0%, #6b7280 100%);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .camera {
          background: radial-gradient(circle, #1f2937 0%, #000000 100%);
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .status-bar {
          backdrop-filter: blur(10px);
          background: rgba(0, 0, 0, 0.3);
          animation: statusBarPulse 8s ease-in-out infinite;
        }

        @keyframes statusBarPulse {
          0%, 100% {
            background: rgba(0, 0, 0, 0.3);
          }
          50% {
            background: rgba(0, 0, 0, 0.5);
          }
        }

        .signal .bar {
          background: linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          animation: signalBars 3s ease-in-out infinite;
        }

        .signal .bar:nth-child(1) { animation-delay: 0s; }
        .signal .bar:nth-child(2) { animation-delay: 0.2s; }
        .signal .bar:nth-child(3) { animation-delay: 0.4s; }
        .signal .bar:nth-child(4) { animation-delay: 0.6s; }

        @keyframes signalBars {
          0%, 100% {
            background: linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%);
          }
          50% {
            background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          }
        }

        .wifi {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .battery {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .battery-level {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          animation: batteryCharge 5s ease-in-out infinite;
        }

        @keyframes batteryCharge {
          0%, 100% {
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          }
          50% {
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
          }
        }

        .battery-tip {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .app-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          box-shadow: 
            0 10px 25px rgba(59, 130, 246, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: appIconPulse 4s ease-in-out infinite;
        }

        @keyframes appIconPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 10px 25px rgba(59, 130, 246, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 
              0 15px 35px rgba(59, 130, 246, 0.5),
              0 0 0 2px rgba(255, 255, 255, 0.2);
          }
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .home-indicator {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Uiverse.io Playstore Button Style */
        .playstore-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #000;
          border-radius: 9999px;
          background-color: rgba(0, 0, 0, 1);
          padding: 0.625rem 1.5rem;
          text-align: center;
          color: rgba(255, 255, 255, 1);
          outline: 0;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .playstore-button:hover {
          background-color: transparent;
          color: rgba(0, 0, 0, 1);
        }

        .playstore-button .icon {
          height: 1.5rem;
          width: 1.5rem;
        }

        .playstore-button .texts {
          margin-left: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }

        .playstore-button .text-1 {
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          line-height: 1rem;
        }

        .playstore-button .text-2 {
          font-weight: 600;
        }

        /* Uiverse.io Animated Text Style */
        .card {
          --bg-color: transparent;
          background-color: var(--bg-color);
          padding: 1rem 2rem;
          border-radius: 1.25rem;
        }
        
        .loader {
          color: rgb(124, 124, 124);
          font-family: "Poppins", sans-serif;
          font-weight: 500;
          font-size: 25px;
          -webkit-box-sizing: content-box;
          box-sizing: content-box;
          height: 40px;
          padding: 10px 10px;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          border-radius: 8px;
        }

        /* Small version for animated text */
        .card-small {
          padding: 0.5rem 1rem !important;
          width: fit-content;
        }

        .loader-small {
          height: 30px !important;
          padding: 5px 5px !important;
          justify-content: flex-start !important;
          margin-left: 0 !important;
        }

        .words {
          overflow: hidden;
          position: relative;
        }
        
        .words::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            var(--bg-color) 10%,
            transparent 30%,
            transparent 70%,
            var(--bg-color) 90%
          );
          z-index: 20;
        }

        .word {
          display: block;
          height: 100%;
          padding-left: 6px;
          color: #3b82f6;
          animation: spin_4991 4s infinite;
        }

        @keyframes spin_4991 {
          10% {
            -webkit-transform: translateY(-102%);
            transform: translateY(-102%);
          }

          25% {
            -webkit-transform: translateY(-100%);
            transform: translateY(-100%);
          }

          35% {
            -webkit-transform: translateY(-202%);
            transform: translateY(-202%);
          }

          50% {
            -webkit-transform: translateY(-200%);
            transform: translateY(-200%);
          }

          60% {
            -webkit-transform: translateY(-302%);
            transform: translateY(-302%);
          }

          75% {
            -webkit-transform: translateY(-300%);
            transform: translateY(-300%);
          }

          85% {
            -webkit-transform: translateY(-402%);
            transform: translateY(-402%);
          }

          100% {
            -webkit-transform: translateY(-400%);
            transform: translateY(-400%);
          }
        }

        /* Small version for header buttons */
        .playstore-button-small {
          padding: 0.5rem 1rem !important;
          max-width: 200px;
        }

        .playstore-button-small .icon {
          height: 1.25rem !important;
          width: 1.25rem !important;
        }

        .playstore-button-small .texts {
          margin-left: 0.75rem !important;
        }

        .playstore-button-small .text-1 {
          font-size: 0.625rem !important;
          line-height: 0.875rem !important;
        }

        .playstore-button-small .text-2 {
          font-size: 0.875rem !important;
          font-weight: 600;
        }

        /* Glassmorphism effect for app content */
        .app-content > div:not(.feature-cards) {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Download buttons styling */
        .download-btn {
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: downloadBtnGlow 6s ease-in-out infinite;
        }

        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        @keyframes downloadBtnGlow {
          0%, 100% {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          }
          50% {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          }
        }

        /* Stat cards styling */
        .stat-card {
          transition: all 0.3s ease;
          animation: statCardPulse 7s ease-in-out infinite;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.12);
        }

        @keyframes statCardPulse {
          0%, 100% {
            background: rgba(255, 255, 255, 0.1);
          }
          50% {
            background: rgba(255, 255, 255, 0.15);
          }
        }

        /* Feature items styling */
        .feature-item {
          transition: all 0.3s ease;
          animation: featureItemGlow 8s ease-in-out infinite;
        }

        .feature-item:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.08);
        }

        @keyframes featureItemGlow {
          0%, 100% {
            background: rgba(255, 255, 255, 0.05);
          }
          50% {
            background: rgba(255, 255, 255, 0.08);
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-white relative">
        {/* Animated Background Grid */}
        <div className="bg-grid" />
        
        {/* Main Content with higher z-index */}
        <div style={{ position: 'relative', zIndex: 20 }}>
          {/* Navbar */}
          <Navbar />

          {/* Hero Section */}
          <section className="pt-24 pb-32 relative z-10 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4">
                    Event Management
                    <br />
                    <span className="text-blue-600 font-semibold">Mobile App</span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">
                    Kelola event Anda dengan mudah dan efisien langsung dari smartphone. 
                    Akses semua fitur event management di ujung jari Anda.
                  </p>
                  
                  {/* Animated Mobile App Text */}
                  <div className="card card-small mb-6">
                    <div className="loader loader-small">
                      <div className="words">
                        <span className="word">Mobile App</span>
                        <span className="word">Event Manager</span>
                        <span className="word">Smart Solution</span>
                        <span className="word">Easy Access</span>
                        <span className="word">Mobile App</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Buttons */}
                  <div className="flex flex-col gap-3 justify-center lg:justify-start mb-6">
                    <a href="#" className="playstore-button playstore-button-small">
                      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <div className="texts">
                        <div className="text-1">Download on the</div>
                        <div className="text-2">App Store</div>
                      </div>
                    </a>
                    <a href="#" className="playstore-button playstore-button-small">
                      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.496 12l2.202-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"/>
                      </svg>
                      <div className="texts">
                        <div className="text-1">GET IT ON</div>
                        <div className="text-2">Google Play</div>
                      </div>
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {appStats.slice(0, 2).map((stat, index) => (
                      <div key={index} className="text-center lg:text-left">
                        <div className="text-xl font-bold text-gray-900">{stat.number}</div>
                        <div className="text-xs text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center Content - Phone Mockup */}
                <div className="relative">
                  <div className="phone-mockup relative mx-auto w-80 h-[650px]">
                    {/* Phone Body */}
                    <div className="phone-body relative w-full h-full bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                      {/* Side Buttons */}
                      <div className="side-buttons absolute left-0 top-20 w-1 h-16 bg-gray-700 rounded-r-sm"></div>
                      <div className="side-buttons absolute left-0 top-32 w-1 h-12 bg-gray-700 rounded-r-sm"></div>
                      <div className="side-buttons absolute right-0 top-24 w-1 h-8 bg-gray-700 rounded-l-sm"></div>
                      
                      {/* Screen */}
                      <div className="phone-screen w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                        {/* Notch */}
                        <div className="notch absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10">
                          <div className="speaker absolute top-1 left-4 w-8 h-1 bg-gray-600 rounded-full"></div>
                          <div className="camera absolute top-1 right-4 w-3 h-3 bg-gray-800 rounded-full"></div>
                        </div>
                        
                        {/* Status Bar */}
                        <div className="status-bar absolute top-2 left-4 right-4 flex justify-between items-center text-white text-xs z-10">
                          <div className="left-side">
                            <span className="time font-semibold">9:41</span>
                          </div>
                          <div className="right-side flex items-center space-x-1">
                            <div className="signal flex items-end space-x-0.5">
                              <div className="bar w-1 h-2 bg-white rounded-sm"></div>
                              <div className="bar w-1 h-3 bg-white rounded-sm"></div>
                              <div className="bar w-1 h-4 bg-white rounded-sm"></div>
                              <div className="bar w-1 h-5 bg-white rounded-sm"></div>
                            </div>
                            <div className="wifi w-4 h-3 border border-white rounded-sm relative">
                              <div className="absolute top-0.5 left-0.5 w-2 h-1 border-t border-white rounded-sm"></div>
                              <div className="absolute top-1 left-1 w-1 h-0.5 border-t border-white rounded-sm"></div>
                            </div>
                            <div className="battery relative w-6 h-3 border border-white rounded-sm">
                              <div className="battery-level absolute top-0.5 left-0.5 w-4 h-1.5 bg-white rounded-sm"></div>
                              <div className="battery-tip absolute -right-0.5 top-0.5 w-0.5 h-2 bg-white rounded-r-sm"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* App Interface */}
                        <div className="app-interface absolute inset-0 pt-8">
                          
                          {/* App Content - Live Website */}
                          <div className="app-content w-full h-full">
                            <iframe
                              src="/"
                              className="w-full h-full border-0 rounded-[2.5rem]"
                              title="Event Management Website"
                              style={{
                                transform: 'scale(0.8)',
                                transformOrigin: 'top left',
                                width: '125%',
                                height: '125%'
                              }}
                            />
                          </div>
                          
                          {/* Home Indicator */}
                          <div className="home-indicator absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Right Content */}
                <div className="text-center lg:text-right">
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-light text-gray-900">
                        Solusi Lengkap untuk Event Anda
                      </h3>
                      <p className="text-gray-600 font-light leading-relaxed">
                        Nikmati kemudahan mengelola event dengan fitur-fitur canggih yang dirancang khusus untuk kebutuhan Anda.
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 mb-1">QR Code Scanner</h4>
                          <p className="text-sm text-gray-600 font-light">Check-in peserta dengan cepat dan akurat</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 mb-1">Push Notifications</h4>
                          <p className="text-sm text-gray-600 font-light">Notifikasi real-time untuk update event</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 mb-1">Participant Management</h4>
                          <p className="text-sm text-gray-600 font-light">Kelola daftar peserta dengan mudah</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 mb-1">Digital Certificates</h4>
                          <p className="text-sm text-gray-600 font-light">Generate sertifikat digital otomatis</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="p-6">
                      <div className="text-center lg:text-right mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Statistik Aplikasi</h4>
                        <p className="text-sm text-gray-600">Bukti kepercayaan pengguna</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {appStats.slice(2, 4).map((stat, index) => (
                          <div key={index} className="text-center lg:text-right">
                            <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                            <div className="text-xs text-gray-600">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>





        </div>
      </div>

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
