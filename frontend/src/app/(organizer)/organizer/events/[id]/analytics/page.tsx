'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
import OrganizerLayout from '@/components/layout/organizer-layout'
import { 
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface EventAnalytics {
  event: {
    id: string
    title: string
    eventDate: string
    eventTime: string
    location: string
    maxParticipants: number
    price: number
    isFree: boolean
    category: string
  }
  stats: {
    totalRegistrations: number
    totalAttendance: number
    attendanceRate: number
    totalRevenue: number
    averageTicketPrice: number
    registrationGrowth: number
    attendanceGrowth: number
    revenueGrowth: number
  }
  dailyRegistrations: Array<{
    date: string
    registrations: number
    revenue: number
  }>
  attendanceData: Array<{
    status: string
    count: number
    percentage: number
  }>
  revenueBreakdown: Array<{
    source: string
    amount: number
    percentage: number
  }>
}

export default function EventAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (user.role !== 'ORGANIZER' || user.verificationStatus !== 'APPROVED') {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && eventId) {
      fetchAnalytics()
    }
  }, [isAuthenticated, user, eventId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch event details and analytics data
      const [eventData, registrationsData] = await Promise.all([
        ApiService.getEvent(eventId),
        ApiService.getOrganizerEventRegistrations(eventId)
      ])
      
      if (eventData.success && registrationsData.success) {
        const event = eventData.data.event
        const registrations = registrationsData.data.registrations || []
        
        // Calculate analytics
        const totalRegistrations = registrations.length
        const totalAttendance = registrations.filter((r: any) => r.attendanceStatus === 'PRESENT').length
        const attendanceRate = totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0
        const totalRevenue = registrations.reduce((sum: number, r: any) => sum + (r.paidAmount || 0), 0)
        const averageTicketPrice = totalRegistrations > 0 ? totalRevenue / totalRegistrations : 0
        
        // Generate daily registrations data (from event creation to latest registration)
        const dailyRegistrations = generateDailyRegistrations(registrations, event.createdAt)
        
        // Generate attendance data
        const attendanceData = [
          { status: 'Present', count: totalAttendance, percentage: attendanceRate },
          { status: 'Absent', count: totalRegistrations - totalAttendance, percentage: 100 - attendanceRate }
        ]
        
        // Generate revenue breakdown
        const revenueBreakdown = [
          { source: 'Ticket Sales', amount: totalRevenue, percentage: 100 },
          { source: 'Platform Fee', amount: totalRevenue * 0.05, percentage: 5 }
        ]
        
        
        setAnalytics({
          event: {
            id: event.id,
            title: event.title,
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            location: event.location,
            maxParticipants: event.maxParticipants,
            price: event.price || 0,
            isFree: event.isFree,
            category: event.category
          },
          stats: {
            totalRegistrations,
            totalAttendance,
            attendanceRate,
            totalRevenue,
            averageTicketPrice,
            registrationGrowth: 0, // Mock data
            attendanceGrowth: 0, // Mock data
            revenueGrowth: 0 // Mock data
          },
          dailyRegistrations,
          attendanceData,
          revenueBreakdown
        })
      } else {
        setError('Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Failed to fetch analytics data')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyRegistrations = (registrations: any[], eventCreatedAt: string) => {
    if (!registrations.length) return []
    
    // Get event creation date
    const eventDate = new Date(eventCreatedAt)
    
    // Get the latest registration date
    const latestRegistration = registrations.reduce((latest, r) => {
      const regDate = new Date(r.registeredAt)
      return regDate > latest ? regDate : latest
    }, new Date(eventDate))
    
    // Generate data from event creation to latest registration
    const dailyData = []
    const currentDate = new Date(eventDate)
    
    while (currentDate <= latestRegistration) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const dayRegistrations = registrations.filter(r => 
        r.registeredAt && r.registeredAt.split('T')[0] === dateStr
      )
      
      const dayRevenue = dayRegistrations.reduce((sum, r) => sum + (r.paidAmount || 0), 0)
      
      dailyData.push({
        date: dateStr,
        registrations: dayRegistrations.length,
        revenue: dayRevenue
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dailyData
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (!isInitialized || loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </OrganizerLayout>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (user.role !== 'ORGANIZER' || user.verificationStatus !== 'APPROVED') {
    return null
  }

  if (error || !analytics) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Not Available</h2>
              <p className="text-gray-600 mb-4">{error || 'Analytics data is not available for this event.'}</p>
              <Button onClick={() => router.push(`/organizer/events/${eventId}`)}>
                Back to Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </OrganizerLayout>
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
            onClick={() => router.push(`/organizer/events/${eventId}`)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{analytics.event.title}</h1>
            <p className="text-gray-600 mt-1">Event Analytics & Statistics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Event Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Event Date</p>
                <p className="font-semibold text-blue-900">{formatDate(analytics.event.eventDate)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Event Time</p>
                <p className="font-semibold text-blue-900">{analytics.event.eventTime}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Max Capacity</p>
                <p className="font-semibold text-blue-900">{analytics.event.maxParticipants}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Ticket Price</p>
                <p className="font-semibold text-blue-900">
                  {analytics.event.isFree ? 'Free' : formatCurrency(analytics.event.price)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Registrations</p>
                <p className="text-2xl font-bold text-green-900">{analytics.stats.totalRegistrations}</p>
                <p className="text-xs text-green-700">
                  {((analytics.stats.totalRegistrations / analytics.event.maxParticipants) * 100).toFixed(1)}% of capacity
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Attendance</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.stats.totalAttendance}</p>
                <p className="text-xs text-blue-700">
                  {analytics.stats.attendanceRate.toFixed(1)}% attendance rate
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(analytics.stats.totalRevenue)}</p>
                <p className="text-xs text-purple-700">
                  Avg: {formatCurrency(analytics.stats.averageTicketPrice)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Registration Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {((analytics.stats.totalRegistrations / analytics.event.maxParticipants) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-orange-700">
                  {analytics.event.maxParticipants - analytics.stats.totalRegistrations} spots left
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Registrations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Daily Registrations (Last 30 Days)
            </CardTitle>
            <CardDescription>Registration trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value, name) => [value, name === 'registrations' ? 'Registrations' : 'Revenue']}
                  />
                  <Bar dataKey="registrations" fill="#3B82F6" name="registrations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" />
              Attendance Distribution
            </CardTitle>
            <CardDescription>Present vs Absent participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }: any) => `${status}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Revenue distribution by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.revenueBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.source}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
      </div>
    </OrganizerLayout>
  )
}
