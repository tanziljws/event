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
import Footer from '@/components/layout/footer'

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

      <Footer />
    </>
  )
}
