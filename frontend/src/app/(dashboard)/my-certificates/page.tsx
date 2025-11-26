'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { Certificate } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Award, Download, Calendar, MapPin, Search, Shield, User, ArrowRight, Filter, Eye, FileText, TrendingUp, Users, Star, Zap, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import Footer from '@/components/layout/footer'

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  // Strict user role protection - admin should not access user certificates
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        // Admin trying to access user certificates, redirect to 404 for security
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getUserCertificates({
        page,
        limit: 10,
        sortBy: 'issuedAt',
        sortOrder: 'desc',
        search: searchQuery || undefined
      })

      if (response.success) {
        setCertificates(response.data.certificates || [])
        setTotalPages(response.data.pagination?.pages || 1)
      } else {
        setError(response.message || 'Failed to load certificates')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && user.role !== 'ADMIN') {
      loadCertificates()
    }
  }, [page, searchQuery, isInitialized, isAuthenticated, user])

  // Certificate carousel effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const slides = document.querySelectorAll('.certificate-slide')
      const dots = document.querySelectorAll('.certificate-dot')

      if (slides.length === 0) return

      let currentSlide = 0

      const showSlide = (index: number) => {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'))
        dots.forEach(dot => dot.classList.remove('active'))

        // Add active class to current slide and dot
        slides[index]?.classList.add('active')
        dots[index]?.classList.add('active')
      }

      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length
        showSlide(currentSlide)
      }

      // Auto-rotate every 4 seconds
      const interval = setInterval(nextSlide, 4000)

      // Add click handlers to dots
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          currentSlide = index
          showSlide(currentSlide)
        })
      })

      return () => {
        clearInterval(interval)
        dots.forEach(dot => {
          dot.removeEventListener('click', () => { })
        })
      }
    }, 500) // Delay for carousel initialization

    return () => clearTimeout(timer)
  }, [certificates])

  const handleDownloadCertificate = (certificateUrl: string) => {
    if (certificateUrl) {
      window.open(certificateUrl, '_blank')
    }
  }

  const handleGenerateCertificate = async (registrationId: string) => {
    try {
      const response = await ApiService.generateCertificate(registrationId)
      if (response.success) {
        // Reload certificates
        loadCertificates()
      } else {
        setError(response.message || 'Failed to generate certificate')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate')
    }
  }

  const isEventEnded = (certificate: Certificate): boolean => {
    if (!certificate.eventEndDateTime) return false
    return new Date() >= new Date(certificate.eventEndDateTime)
  }

  const getCertificateStatusInfo = (certificate: Certificate) => {
    if (certificate.status === 'available') {
      return {
        label: 'Tersedia',
        color: 'bg-green-500',
        icon: CheckCircle2,
        message: 'Sertifikat siap diunduh'
      }
    } else if (certificate.status === 'ready') {
      return {
        label: 'Siap Digenerate',
        color: 'bg-blue-500',
        icon: Sparkles,
        message: 'Event sudah selesai, sertifikat dapat digenerate'
      }
    } else {
      return {
        label: 'Menunggu Event Selesai',
        color: 'bg-orange-500',
        icon: Clock,
        message: certificate.eventEndDateTime 
          ? `Sertifikat akan tersedia setelah ${formatDateTime(certificate.eventEndDateTime)}`
          : 'Sertifikat akan tersedia setelah event selesai'
      }
    }
  }

  // Show loading while checking authentication and role
  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If admin, show loading while redirecting to 404
  if (user.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <style dangerouslySetInnerHTML={{
        __html: `
          .certificate-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(229, 231, 235, 0.5);
          }
          
          .certificate-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            border-color: rgba(59, 130, 246, 0.2);
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .certificate-carousel {
            position: relative;
            width: 100%;
            height: 100%;
          }
          
          .certificate-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.5s ease-in-out;
          }
          
          .certificate-slide.active {
            opacity: 1;
            transform: translateX(0);
          }
          
          .certificate-dot.active {
            background-color: #3b82f6 !important;
          }
          
          .certificate-dot:hover {
            transform: scale(1.2);
          }
          
          .certificate-blur {
            filter: blur(8px);
            opacity: 0.6;
            pointer-events: none;
          }
          
          .certificate-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            border-radius: 0.75rem;
          }
        `
      }} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1">
              <div className="group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  placeholder="Cari sertifikat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 text-base"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>Semua ({certificates.length})</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {certificates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Total sertifikat: {certificates.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Status: Semua terverifikasi</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Certificates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
              <Award className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Belum Ada Sertifikat</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? 'Tidak ada sertifikat yang sesuai dengan pencarian Anda.'
                  : 'Anda belum memiliki sertifikat. Ikuti event dan hadir untuk mendapatkan sertifikat!'
                }
              </p>
              {!searchQuery && (
                <Link href="/events">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                    <span>Jelajahi Event</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            certificates.map((certificate) => {
              const statusInfo = getCertificateStatusInfo(certificate)
              const StatusIcon = statusInfo.icon
              const isBlurred = certificate.status !== 'available'
              const isClickable = certificate.status === 'available'

              return (
                <div
                  key={certificate.id}
                  className={`certificate-card group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full border-2 ${
                    isClickable 
                      ? 'cursor-pointer border-gray-100 hover:border-blue-200' 
                      : 'cursor-default border-gray-200'
                  }`}
                  onClick={() => isClickable && certificate.certificateUrl && handleDownloadCertificate(certificate.certificateUrl)}
                >
                  {/* Status Badge - Top Right */}
                  <div className={`absolute top-0 right-0 w-0 h-0 border-t-[60px] border-l-[60px] border-l-transparent z-10 ${
                    certificate.status === 'available' ? 'border-t-green-500' :
                    certificate.status === 'ready' ? 'border-t-blue-500' :
                    'border-t-orange-500'
                  }`}></div>
                  <div className="absolute top-2 right-2 z-20">
                    <StatusIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Certificate Preview with Border Design */}
                  <div className="relative p-4 bg-gradient-to-br from-amber-50 via-white to-blue-50">
                    {/* Decorative Border */}
                    <div className={`relative border-4 border-double border-amber-400 rounded-xl p-6 bg-white shadow-inner ${isBlurred ? 'certificate-blur' : ''}`}>
                      {/* Blur Overlay for Pending/Ready */}
                      {isBlurred && (
                        <div className="certificate-overlay">
                          <div className="text-center px-4">
                            <StatusIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-700 mb-1">{statusInfo.label}</p>
                            <p className="text-xs text-gray-500">{statusInfo.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Inner Decorative Border */}
                      <div className="absolute inset-2 border border-amber-200 rounded-lg"></div>

                      {/* Certificate Content */}
                      <div className="relative z-10 text-center">
                        {/* Certificate Icon */}
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                          <Award className="w-8 h-8 text-white" />
                        </div>

                        {/* Certificate Title */}
                        <div className="mb-2">
                          <p className="text-xs text-amber-700 font-semibold tracking-widest uppercase">Certificate of</p>
                          <h4 className="text-lg font-bold text-gray-900 tracking-wide">Completion</h4>
                        </div>

                        {/* Event Title */}
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                          {certificate.event?.title}
                        </h3>

                        {/* Participant Name */}
                        <div className="border-t-2 border-b-2 border-amber-200 py-2 mb-2">
                          <p className="text-xs text-gray-500 mb-1">Presented to</p>
                          <p className="text-base font-bold text-gray-900" style={{
                            fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive"
                          }}>
                            {certificate.participant?.fullName || user?.fullName}
                          </p>
                        </div>

                        {/* Certificate Number */}
                        {certificate.certificateNumber ? (
                          <p className="text-xs text-gray-500 font-mono">
                            {certificate.certificateNumber}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 font-mono italic">
                            {certificate.id.startsWith('pending-') ? 'Belum digenerate' : `CERT-${certificate.id.slice(0, 8).toUpperCase()}`}
                          </p>
                        )}
                      </div>

                      {/* Corner Decorations */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400"></div>
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400"></div>
                    </div>

                    {/* Status Badge - Bottom Left */}
                    <div className="absolute bottom-6 left-6">
                      <div className={`flex items-center gap-1 px-2 py-1 ${statusInfo.color} text-white rounded-full text-xs font-semibold shadow-md`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 bg-gradient-to-b from-white to-gray-50 flex flex-col flex-grow">
                    {/* Event Details */}
                    <div className="space-y-2 mb-4 flex-shrink-0">
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 mr-2" />
                        <span>{formatDateTime(certificate.event?.eventDate || '')}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 mr-2" />
                        <span className="truncate">{certificate.event?.location}</span>
                      </div>
                      {certificate.issuedAt ? (
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Issued: {formatDateTime(certificate.issuedAt)}</span>
                        </div>
                      ) : certificate.eventEndDateTime && (
                        <div className="flex items-center text-xs text-orange-600">
                          <Clock className="w-3.5 h-3.5 text-orange-500 mr-2" />
                          <span>Event selesai: {formatDateTime(certificate.eventEndDateTime)}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Message */}
                    {certificate.status !== 'available' && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 font-medium text-center">
                          {statusInfo.message}
                        </p>
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-grow"></div>

                    {/* Action Button */}
                    {certificate.status === 'available' ? (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg group-hover:scale-[1.02] flex items-center justify-center gap-2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (certificate.certificateUrl) {
                            handleDownloadCertificate(certificate.certificateUrl)
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Certificate</span>
                      </Button>
                    ) : certificate.status === 'ready' ? (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateCertificate(certificate.registrationId)
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Certificate</span>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-2.5 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Event Belum Selesai</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  Previous
                </Button>
                <span className="flex items-center px-6 text-sm text-gray-600 font-medium">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
