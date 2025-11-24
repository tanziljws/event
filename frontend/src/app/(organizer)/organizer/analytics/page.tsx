'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
import OrganizerLayout from '@/components/layout/organizer-layout'
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  Search,
  ArrowLeft,
  Eye,
  Edit,
  Download
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Event {
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

export default function OrganizerAnalyticsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [eventStatusData, setEventStatusData] = useState<EventStatusData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
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
    if (isAuthenticated && user) {
      fetchEvents()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, statusFilter, categoryFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getOrganizerEvents({
        page: 1,
        limit: 100
      })

      if (data.success) {
        const eventsData = data.data.events.map((event: any) => ({
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
        }))

        setEvents(eventsData)

        // Generate chart data
        generateChartData(eventsData)

        // Generate status data
        generateStatusData(eventsData)
      }
    } catch (err) {
      setError('Failed to fetch events')
      console.error('Events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (eventsData: Event[]) => {
    const now = new Date()
    const last6Months = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })

      const monthEvents = eventsData.filter((event) => {
        const eventDate = new Date(event.createdAt)
        return eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
      })

      const monthParticipants = monthEvents.reduce((sum, event) =>
        sum + event._count.registrations, 0
      )

      last6Months.push({
        month: monthName,
        events: monthEvents.length,
        participants: monthParticipants,
        revenue: 0
      })
    }

    setChartData(last6Months)
  }

  const generateStatusData = (eventsData: Event[]) => {
    const statusCounts = eventsData.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'APPROVED' ? 'Published' :
        status === 'PENDING' ? 'Pending' :
          status === 'DRAFT' ? 'Draft' : status,
      value: count,
      color: status === 'APPROVED' ? '#10B981' :
        status === 'PENDING' ? '#F59E0B' :
          status === 'DRAFT' ? '#6B7280' : '#9CA3AF'
    }))

    setEventStatusData(statusData)
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Published' },
      'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT']

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getUniqueCategories = () => {
    return Array.from(new Set(events.map(event => event.category)))
  }

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/organizer')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
              <p className="text-gray-600">Comprehensive analytics and insights for your events</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Published</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-600">
                Showing {filteredEvents.length} of {events.length} events
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Events Created (Last 6 Months)</CardTitle>
              <CardDescription>Number of events created per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Event Status Distribution</CardTitle>
              <CardDescription>Current status of all events</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Table View
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {filteredEvents.length} events found
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card>
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
              <CardDescription>View your events in calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date()
                  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
                  const startDate = new Date(firstDay)
                  startDate.setDate(startDate.getDate() - firstDay.getDay() + i)

                  const dayEvents = filteredEvents.filter(event => {
                    const eventDate = new Date(event.eventDate)
                    return eventDate.toDateString() === startDate.toDateString()
                  })

                  const isCurrentMonth = startDate.getMonth() === date.getMonth()
                  const isToday = startDate.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] p-2 border border-gray-200 rounded-lg relative ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'ring-2 ring-blue-500' : ''} ${dayEvents.length > 6 ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                          {startDate.getDate()}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${dayEvents.length <= 2 ? 'bg-green-100 text-green-700' :
                              dayEvents.length <= 4 ? 'bg-yellow-100 text-yellow-700' :
                                dayEvents.length <= 6 ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                            }`}>
                            {dayEvents.length}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 max-h-[80px] overflow-y-auto" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#D1D5DB #F3F4F6'
                      }}>
                        {dayEvents.slice(0, 6).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="truncate font-medium">{event.title}</div>
                            <div className="text-blue-600">
                              {event._count.registrations}/{event.maxParticipants} participants
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 6 && (
                          <div
                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:bg-gray-100 p-1 rounded"
                            onClick={() => {
                              // Show all events for this day in a modal
                              const dayEventsForModal = filteredEvents.filter(event => {
                                const eventDate = new Date(event.eventDate)
                                const startDate = new Date(date.getFullYear(), date.getMonth(), i - firstDay.getDay() + 1)
                                return eventDate.toDateString() === startDate.toDateString()
                              })
                              setSelectedDayEvents(dayEventsForModal)
                              setSelectedDate(startDate)
                            }}
                          >
                            +{dayEvents.length - 6} more events
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Event Performance Table</CardTitle>
                  <CardDescription>Detailed statistics and performance metrics</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Participants</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fill Rate</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                              <BarChart3 className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-medium text-slate-900 mb-1">No events found</h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                                ? 'Try adjusting your filters to see more events.'
                                : 'Get started by creating your first event.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => {
                        const registrationRate = event.maxParticipants > 0
                          ? ((event._count.registrations / event.maxParticipants) * 100).toFixed(1)
                          : '0'

                        return (
                          <tr key={event.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{event.title}</div>
                                  <div className="text-sm text-slate-500 truncate">{event.location}</div>
                                  <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                      {event.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-900">{formatDate(event.eventDate)}</div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(event.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm">
                                  <span className="font-semibold text-slate-900">{event._count.registrations}</span>
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="text-slate-600">{event.maxParticipants}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className={`h-2 rounded-full transition-all ${parseFloat(registrationRate) >= 80 ? 'bg-green-500' :
                                        parseFloat(registrationRate) >= 50 ? 'bg-blue-500' :
                                          parseFloat(registrationRate) >= 25 ? 'bg-yellow-500' :
                                            'bg-slate-300'
                                      }`}
                                    style={{ width: `${registrationRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-900 min-w-[45px]">{registrationRate}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/organizer/attendance?eventId=${event.id}`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/events/${event.id}`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/organizer/events/${event.id}/edit`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-gray-900">{formatDate(selectedEvent.eventDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedEvent.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div>{getStatusBadge(selectedEvent.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900">{selectedEvent.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{selectedEvent._count.registrations}</div>
                    <div className="text-sm text-blue-600">Participants</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{selectedEvent.maxParticipants}</div>
                    <div className="text-sm text-green-600">Max Capacity</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">
                      {selectedEvent.maxParticipants > 0
                        ? ((selectedEvent._count.registrations / selectedEvent.maxParticipants) * 100).toFixed(1)
                        : '0'}%
                    </div>
                    <div className="text-sm text-purple-600">Registration Rate</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">
                      {Math.ceil((new Date(selectedEvent.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0
                        ? `${Math.ceil((new Date(selectedEvent.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d`
                        : 'Past'}
                    </div>
                    <div className="text-sm text-orange-600">Days Until Event</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/organizer/attendance?eventId=${selectedEvent.id}`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Attendance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/events/${selectedEvent.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Public
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Events Modal */}
        {selectedDayEvents.length > 0 && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Events on {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDayEvents([])
                    setSelectedDate(null)
                  }}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDayEvents.map((event) => {
                  const registrationRate = event.maxParticipants > 0
                    ? ((event._count.registrations / event.maxParticipants) * 100).toFixed(1)
                    : '0'

                  return (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {event.location}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {event.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-900">{event._count.registrations}</div>
                          <div className="text-xs text-blue-600">Participants</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-900">{event.maxParticipants}</div>
                          <div className="text-xs text-green-600">Max Capacity</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-lg font-bold text-purple-900">{registrationRate}%</div>
                          <div className="text-xs text-purple-600">Rate</div>
                        </div>
                      </div>

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
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  )
}

