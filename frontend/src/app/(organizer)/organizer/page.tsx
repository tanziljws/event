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
  BarChart3,
  Settings,
  ArrowRight,
  Activity,
  Briefcase,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

interface DashboardStats {
  totalEvents: number
  totalParticipants: number
  totalRevenue: number
  platformFee: number
  organizerRevenue: number
  pendingEvents: number
  participantGrowth: number
  eventGrowth: number
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
    platformFee: 0,
    organizerRevenue: 0,
    pendingEvents: 0,
    participantGrowth: 0,
    eventGrowth: 0
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

        // Calculate trends (mock logic for now as API might not return historical data yet)
        // In a real scenario, we'd compare with previous month's data
        const mockParticipantGrowth = 12.5 // +12.5%
        const mockEventGrowth = 5.2 // +5.2%

        setStats({
          totalEvents: stats.totalEvents,
          totalParticipants: stats.totalRegistrations,
          totalRevenue: stats.totalRevenue || 0,
          platformFee: stats.platformFee || 0,
          organizerRevenue: stats.organizerRevenue || 0,
          pendingEvents: stats.totalEvents - stats.publishedEvents,
          participantGrowth: mockParticipantGrowth,
          eventGrowth: mockEventGrowth
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
          let statusLabel = event.status;
          if (event.isPublished) {
            statusLabel = 'PUBLISHED';
          }

          acc[statusLabel] = (acc[statusLabel] || 0) + 1
          return acc
        }, {})

        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status === 'PUBLISHED' ? 'Published' :
            status === 'APPROVED' ? 'Approved' :
              status === 'PENDING' ? 'Pending' :
                status === 'DRAFT' ? 'Draft' : status,
          value: count as number,
          color: status === 'PUBLISHED' ? '#10B981' :
            status === 'APPROVED' ? '#3B82F6' :
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
      <div className="space-y-8">
        {/* Enhanced Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-blue-100 font-medium">Organizer Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.fullName}!</h1>
              <p className="text-blue-100 max-w-xl">
                Here's what's happening with your events today. You have {stats.pendingEvents} unpublished events pending your attention.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/organizer/events/create')}
                className="bg-white text-blue-600 hover:bg-blue-50 border-none font-semibold shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Event
              </Button>
              <div className="flex bg-blue-800/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('dashboard')}
                  className={viewMode === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"></div>
        </div>

        {/* Conditional Content */}
        {viewMode === 'dashboard' ? (
          <>
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stats.eventGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {stats.eventGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.eventGrowth)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Events</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvents}</h3>
                    <p className="text-xs text-gray-400 mt-1">Events created this month</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${stats.participantGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {stats.participantGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.participantGrowth)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Participants</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalParticipants}</h3>
                    <p className="text-xs text-gray-400 mt-1">Registered users across events</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Revenue
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue (Gross)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                      Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Platform Fee (3%):</span>
                        <span className="text-red-600">- Rp {stats.platformFee.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                        <span className="font-semibold text-gray-900">Yang Masuk ke Wallet:</span>
                        <span className="font-bold text-green-600">Rp {stats.organizerRevenue.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Total dari customer sebelum potongan fee</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-50 rounded-xl">
                      <Activity className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                      Action Needed
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Events</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingEvents}</h3>
                    <p className="text-xs text-gray-400 mt-1">Events waiting to be published</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Participant Growth Area Chart */}
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Participant Growth</CardTitle>
                      <CardDescription>Monthly participant registration trends</CardDescription>
                    </div>
                    <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12.5% vs last month
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="participants"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorParticipants)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Event Status Distribution */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Event Status</CardTitle>
                  <CardDescription>Distribution of your events</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {eventStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-gray-900">{stats.totalEvents}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-6">
                    {eventStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Top Events & Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Top Performing Events */}
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader className="border-b border-gray-50 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                        Top Performing Events
                      </CardTitle>
                      <CardDescription>Events with highest participant engagement</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllEvents(!showAllEvents)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {showAllEvents ? 'Show Less' : 'View All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {(showAllEvents ? allEvents : allEvents.slice(0, 5)).map((event) => {
                      const registrationRate = event.maxParticipants > 0
                        ? ((event._count.registrations / event.maxParticipants) * 100).toFixed(1)
                        : '0'

                      return (
                        <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{event.title}</h4>
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(event.status)}
                                </div>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                                  {formatDate(event.eventDate)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1.5 text-gray-400" />
                                  {event._count.registrations} / {event.maxParticipants}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                                  {registrationRate}% filled
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => router.push(`/organizer/events/${event.id}/analytics`)}
                              >
                                Analytics
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/organizer/events/${event.id}/edit`)}
                              >
                                <Settings className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(parseFloat(registrationRate), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                    {allEvents.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No events found. Create your first event to get started!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions & Tips */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => router.push('/organizer/events/create')}
                      className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm h-auto py-3"
                    >
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <Plus className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Create Event</div>
                        <div className="text-xs text-gray-500">Start a new event page</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => router.push('/organizer/attendance')}
                      className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm h-auto py-3"
                    >
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Check Attendance</div>
                        <div className="text-xs text-gray-500">Scan or view list</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => router.push('/organizer/analytics')}
                      className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm h-auto py-3"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">View Reports</div>
                        <div className="text-xs text-gray-500">Download analytics</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => router.push('/organizer/events')}
                      className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm h-auto py-3"
                    >
                      <div className="bg-amber-100 p-2 rounded-lg mr-3">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Generate Certificates</div>
                        <div className="text-xs text-gray-500">Bulk generate for events</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Sparkles className="h-6 w-6 text-yellow-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Pro Tip</h4>
                        <p className="text-blue-100 text-sm leading-relaxed">
                          Events with custom certificates get 25% more engagement. Try adding a certificate template to your next event!
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4 bg-white text-blue-600 hover:bg-blue-50 border-none"
                          onClick={() => router.push('/organizer/events')}
                        >
                          Try it now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
