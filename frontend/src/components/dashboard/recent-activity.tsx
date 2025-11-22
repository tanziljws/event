'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Calendar, Clock, MapPin, Award, Ticket, CheckCircle, XCircle } from 'lucide-react'
import { ApiService } from '@/lib/api'
// import { useError } from '@/hooks/use-error'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  eventDate: string
  eventTime: string
  location: string
  flyerUrl?: string
}

interface Registration {
  id: string
  eventId: string
  registrationToken: string
  hasAttended: boolean
  attendanceTime?: string
  registeredAt: string
  attendedAt?: string
  event: Event
}

interface Certificate {
  id: string
  certificateNumber: string
  certificateUrl: string
  issuedAt: string
  registration: {
    event: Event
    attendedAt?: string
  }
}

interface RecentActivityProps {
  userId: string
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // const { handleError } = useError()
  
  const handleError = (error: any, message: string) => {
    console.error(message, error)
  }

  useEffect(() => {
    fetchRecentActivity()
  }, [userId])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      
      // Fetch recent registrations and certificates in parallel
      const [registrationsResponse, certificatesResponse] = await Promise.all([
        ApiService.getUserEventRegistrations({ page: 1, limit: 5, sortBy: 'registeredAt', sortOrder: 'desc' }),
        ApiService.getMyCertificates({ page: 1, limit: 5, sortBy: 'issuedAt', sortOrder: 'desc' })
      ])

      const activities: any[] = []

      // Process registrations
      if (registrationsResponse.success && registrationsResponse.data?.registrations) {
        registrationsResponse.data.registrations.forEach((reg: Registration) => {
          activities.push({
            id: `reg-${reg.id}`,
            type: 'registration',
            title: `Mendaftar Event: ${reg.event.title}`,
            description: `Anda telah mendaftar untuk event "${reg.event.title}"`,
            date: reg.registeredAt,
            status: reg.hasAttended ? 'attended' : 'registered',
            event: reg.event,
            registration: reg
          })
        })
      }

      // Process certificates
      if (certificatesResponse.success && certificatesResponse.data?.certificates) {
        certificatesResponse.data.certificates.forEach((cert: Certificate) => {
          activities.push({
            id: `cert-${cert.id}`,
            type: 'certificate',
            title: `Sertifikat Diterbitkan: ${cert.registration.event.title}`,
            description: `Sertifikat untuk event "${cert.registration.event.title}" telah siap`,
            date: cert.issuedAt,
            status: 'completed',
            event: cert.registration.event,
            certificate: cert
          })
        })
      }

      // Sort by date (newest first) and take latest 10
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setActivities(activities.slice(0, 10))

    } catch (error) {
      handleError(error, 'Gagal memuat aktivitas terbaru')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'registration':
        return status === 'attended' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Calendar className="h-5 w-5 text-blue-600" />
      case 'certificate':
        return <Award className="h-5 w-5 text-purple-600" />
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attended':
        return <Badge variant="default" className="bg-green-100 text-green-800">Hadir</Badge>
      case 'registered':
        return <Badge variant="secondary">Terdaftar</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Selesai</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Kemarin'
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            Event dan aktivitas terbaru Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>
          Event dan aktivitas terbaru Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada aktivitas terbaru</p>
            <p className="text-sm mb-4">Daftar event untuk melihat aktivitas di sini</p>
            <Link href="/events">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Lihat Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(activity.status)}
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(activity.event.eventDate).toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.event.eventTime}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {activity.event.location}
                    </div>
                  </div>
                  {activity.type === 'certificate' && (
                    <div className="mt-2">
                      <Link href={`/my-certificates`}>
                        <Button variant="outline" size="sm">
                          <Award className="h-3 w-3 mr-1" />
                          Lihat Sertifikat
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length >= 10 && (
              <div className="text-center pt-4">
                <Link href="/my-registrations">
                  <Button variant="outline" size="sm">
                    Lihat Semua Aktivitas
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
