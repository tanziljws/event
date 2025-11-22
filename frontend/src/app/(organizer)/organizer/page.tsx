'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
import OrganizerLayout from '@/components/layout/organizer-layout'
import EventCalendar from '@/components/calendar/event-calendar'
import { 
  Plus,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  BarChart3,
  Settings,
  ArrowRight,
  Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardStats {
  totalEvents: number
  totalParticipants: number
  totalRevenue: number
  pendingEvents: number
}

interface RecentEvent {
  id: string
  title: string
  eventDate: string
  status: string
  location: string
  maxParticipants: number
  isPublished: boolean
  generateCertificate: boolean
  category: string
  createdAt: string
  _count: {
    registrations: number
  }
}

interface ChartData {
  month: string
  events: number
  participants: number
  revenue: number
}

interface EventStatusData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export default function OrganizerDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    pendingEvents: 0
  })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [eventStatusData, setEventStatusData] = useState<EventStatusData[]>([])
  const [allEvents, setAllEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar'>('dashboard')

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
      if (user.role === 'ORGANIZER' && user.verificationStatus !== 'APPROVED') {
        router.push('/login')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'ORGANIZER' || user.role === 'ADMIN')) {
      fetchDashboardData()
      fetchAllEvents()
    }
  }, [isAuthenticated, user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API using ApiService
      const data = await ApiService.getOrganizerDashboard(user?.id || '')
      
      if (data.success) {
        const { stats, recentEvents } = data.data
        
        setStats({
          totalEvents: stats.totalEvents,
          totalParticipants: stats.totalRegistrations,
          totalRevenue: stats.totalRevenue || 0,
          pendingEvents: stats.totalEvents - stats.publishedEvents
        })
        
        setRecentEvents(recentEvents.map((event: any) => ({
          id: event.id,
          title: event.title,
          eventDate: event.eventDate,
          status: event.status,
          location: event.location,
          maxParticipants: event.maxParticipants,
          isPublished: event.isPublished,
          generateCertificate: event.generateCertificate,
          category: event.category,
          createdAt: event.createdAt,
          _count: { registrations: event._count.registrations }
        })))

        // Generate chart data based on recent events
        const now = new Date()
        const last6Months = []
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthName = date.toLocaleDateString('en-US', { month: 'short' })
          
          // Count events and participants for this month
          const monthEvents = recentEvents.filter((event: any) => {
            const eventDate = new Date(event.createdAt)
            return eventDate.getMonth() === date.getMonth() && 
                   eventDate.getFullYear() === date.getFullYear()
          })
          
          const monthParticipants = monthEvents.reduce((sum: number, event: any) => 
            sum + event._count.registrations, 0
          )
          
          last6Months.push({
            month: monthName,
            events: monthEvents.length,
            participants: monthParticipants,
            revenue: 0 // Add missing revenue property
          })
        }
        
        setChartData(last6Months)

        // Event status distribution based on real data
        const statusCounts = recentEvents.reduce((acc: any, event: any) => {
          acc[event.status] = (acc[event.status] || 0) + 1
          return acc
        }, {})
        
        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status === 'APPROVED' ? 'Published' : 
                status === 'PENDING' ? 'Pending' : 
                status === 'DRAFT' ? 'Draft' : status,
          value: count as number,
          color: status === 'APPROVED' ? '#10B981' : 
                 status === 'PENDING' ? '#F59E0B' : 
                 status === 'DRAFT' ? '#6B7280' : '#9CA3AF'
        }))
        
        setEventStatusData(statusData)
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllEvents = async () => {
    try {
      const data = await ApiService.getOrganizerEvents({
        page: 1,
        limit: 100
      })
      
      if (data.success) {
        setAllEvents(data.data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          eventDate: event.eventDate,
          status: event.status,
          location: event.location,
          maxParticipants: event.maxParticipants,
          isPublished: event.isPublished,
          generateCertificate: event.generateCertificate,
          category: event.category,
          createdAt: event.createdAt,
          _count: { registrations: event._count.registrations }
        })))
      }
    } catch (err) {
      console.error('Failed to fetch all events:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT']
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const handleEventClick = (event: RecentEvent) => {
    router.push(`/organizer/events/${event.id}/analytics`)
  }


  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect to login
  }

  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return null // Will redirect to dashboard
  }

  if (user.role === 'ORGANIZER' && user.verificationStatus !== 'APPROVED') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Not Verified</h2>
            <p className="text-gray-600 mb-4">Your organizer account is pending verification by admin.</p>
            <Button onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your events.</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'dashboard' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('dashboard')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Content */}
        {viewMode === 'dashboard' ? (
          <>
            {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Events</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Participants</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  Rp {stats.totalRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Unpublished Events</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pendingEvents}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Participants per Event Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Participants per Event
            </CardTitle>
            <CardDescription>Number of participants for each of your events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentEvents.slice(0, 8).map(event => ({
                  name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
                  participants: event._count.registrations
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} participants`, 'Participants']}
                    labelFormatter={(label) => `Event: ${label}`}
                  />
                  <Bar dataKey="participants" fill="#10B981" name="participants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Event Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Event Status Overview
            </CardTitle>
            <CardDescription>Current status of your events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} events`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Navigate to different sections of your organizer panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Button
              onClick={() => router.push('/organizer/events')}
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 hover:text-blue-800"
            >
              <Calendar className="h-8 w-8" />
              <span className="font-semibold">My Events</span>
              <span className="text-xs text-blue-600">Manage your events</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => router.push('/organizer/events/create')}
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200 text-green-700 hover:text-green-800"
            >
              <Plus className="h-8 w-8" />
              <span className="font-semibold">Create Event</span>
              <span className="text-xs text-green-600">Start a new event</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => router.push('/organizer/attendance')}
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 hover:text-purple-800"
            >
              <Users className="h-8 w-8" />
              <span className="font-semibold">Attendance</span>
              <span className="text-xs text-purple-600">Manage participants</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/organizer/analytics')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Analytics</h3>
                <p className="text-sm text-gray-600">Detailed insights and performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/organizer/events')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Events</h3>
                <p className="text-sm text-gray-600">View and manage all your events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/organizer/attendance')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance</h3>
                <p className="text-sm text-gray-600">Track participant attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Events Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                All Events Overview
              </CardTitle>
              <CardDescription>Complete list of all your events with detailed statistics</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="flex items-center"
            >
              {showAllEvents ? 'Hide Details' : 'Show Details'}
              <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${showAllEvents ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        {showAllEvents && (
          <CardContent>
            <div className="space-y-4">
              {allEvents.map((event) => {
                const registrationRate = event.maxParticipants > 0 
                  ? ((event._count.registrations / event.maxParticipants) * 100).toFixed(1)
                  : '0'
                
                const daysUntilEvent = Math.ceil(
                  (new Date(event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                
                return (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{formatDate(event.eventDate)}</span>
                          <span>•</span>
                          <span>{event.location}</span>
                          <span>•</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(event.status)}
                        {event.isPublished && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Published
                          </span>
                        )}
                        {event.generateCertificate && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            Certificate
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-900">{event._count.registrations}</div>
                        <div className="text-xs text-blue-600">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-900">{event.maxParticipants}</div>
                        <div className="text-xs text-green-600">Max Capacity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-900">{registrationRate}%</div>
                        <div className="text-xs text-purple-600">Registration Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-900">
                          {daysUntilEvent > 0 ? `${daysUntilEvent}d` : 'Past'}
                        </div>
                        <div className="text-xs text-orange-600">Days Until</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/organizer/attendance?eventId=${event.id}`)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Attendance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/organizer/events/${event.id}/analytics`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Public
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>
          </>
        ) : (
          /* Calendar View */
          <EventCalendar
            events={allEvents}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </OrganizerLayout>
  )
}
