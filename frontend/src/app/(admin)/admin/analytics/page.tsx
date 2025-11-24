'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalEvents: number
    totalUsers: number
    totalRegistrations: number
    totalRevenue: number
  }
  eventStats: {
    published: number
    draft: number
    upcoming: number
    past: number
  }
  registrationTrends: {
    daily: Array<{ date: string; count: number }>
    weekly: Array<{ week: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
  userStats: {
    newUsers: number
    activeUsers: number
    verifiedUsers: number
    adminUsers: number
  }
  revenueStats: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  topEvents: Array<{
    id: string
    title: string
    registrations: number
    revenue: number
  }>
}

export default function AdminAnalytics() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
      fetchAnalytics()
    }
  }, [isAuthenticated, user])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current year for analytics
      const currentYear = new Date().getFullYear()
      
      // Fetch dashboard stats and monthly analytics in parallel
      const [dashboardResponse, monthlyResponse] = await Promise.all([
        ApiService.getAdminDashboard(),
        ApiService.getMonthlyAnalytics(currentYear, dateRange)
      ])
      
      if (!dashboardResponse.success) {
        throw new Error(dashboardResponse.message || 'Failed to fetch dashboard data')
      }
      
      const dashboardData = dashboardResponse.data?.stats || {}
      const monthlyData = monthlyResponse.data?.monthlyData || []
      
      // Calculate date range for filtering
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      
      // Get events for event stats
      const eventsResponse = await ApiService.getAdminEvents({ limit: 1000 })
      const allEvents = eventsResponse.data?.events || []
      
      const publishedEvents = allEvents.filter((e: any) => e.isPublished)
      const draftEvents = allEvents.filter((e: any) => !e.isPublished)
      const upcomingEvents = allEvents.filter((e: any) => {
        const eventDate = new Date(e.eventDate)
        return eventDate >= now
      })
      const pastEvents = allEvents.filter((e: any) => {
        const eventDate = new Date(e.eventDate)
        return eventDate < now
      })
      
      // Get users for user stats
      const usersResponse = await ApiService.getAdminUsers({ limit: 1000 })
      const allUsers = usersResponse.data?.users || []
      
      const newUsers = allUsers.filter((u: any) => {
        const userDate = new Date(u.createdAt)
        return userDate >= startDate
      }).length
      
      const verifiedUsers = allUsers.filter((u: any) => u.emailVerified).length
      const adminUsers = allUsers.filter((u: any) => 
        ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT', 'CS_HEAD', 'CS_AGENT', 'FINANCE_HEAD', 'FINANCE_AGENT'].includes(u.role)
      ).length
      
      // Calculate revenue stats
      const totalRevenue = dashboardData.totalRevenue || 0
      
      // Get this month and last month revenue
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      
      // For now, we'll use a simple calculation
      // In a real scenario, you'd fetch payments filtered by date
      const thisMonthRevenue = totalRevenue * 0.3 // Placeholder - would need payment API
      const lastMonthRevenue = totalRevenue * 0.25 // Placeholder
      const growth = lastMonthRevenue > 0 
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0
      
      // Map monthly data to registration trends
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyTrends = monthlyData.map((data: any) => ({
        month: monthNames[data.month - 1] || `Month ${data.month}`,
        count: data.total || 0
      }))
      
      // Get top events (events with most registrations)
      const topEventsData = allEvents
        .map((event: any) => ({
          id: event.id,
          title: event.title,
          registrations: event._count?.registrations || 0,
          revenue: (event._count?.registrations || 0) * (parseFloat(event.price) || 0)
        }))
        .sort((a: any, b: any) => b.registrations - a.registrations)
        .slice(0, 3)
      
      // Map to AnalyticsData structure
      const analyticsData: AnalyticsData = {
        overview: {
          totalEvents: dashboardData.totalEvents || 0,
          totalUsers: dashboardData.totalParticipants || 0,
          totalRegistrations: dashboardData.totalRegistrations || 0,
          totalRevenue: totalRevenue
        },
        eventStats: {
          published: publishedEvents.length,
          draft: draftEvents.length,
          upcoming: upcomingEvents.length,
          past: pastEvents.length
        },
        registrationTrends: {
          daily: [], // Would need daily registration API
          weekly: [], // Would need weekly registration API
          monthly: monthlyTrends
        },
        userStats: {
          newUsers: newUsers,
          activeUsers: allUsers.length, // Simplified - would need activity tracking
          verifiedUsers: verifiedUsers,
          adminUsers: adminUsers
        },
        revenueStats: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growth: growth
        },
        topEvents: topEventsData
      }
      
      setAnalytics(analyticsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat data analytics'
      setError(errorMessage)
      console.error('Analytics error:', err)
      toast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

  useEffect(() => {
    if (isAuthenticated && user && ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
      fetchAnalytics()
    }
  }, [dateRange, isAuthenticated, user])

  if (loading) {
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
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600">Insights dan statistik sistem event management</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
            <option value="1y">1 Tahun Terakhir</option>
          </select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Total events di platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Total registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {analytics.overview.totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.revenueStats.growth > 0 ? '+' : ''}{analytics.revenueStats.growth}% growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Statistics</CardTitle>
            <CardDescription>Distribusi status event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Published</Badge>
                </div>
                <span className="font-semibold">{analytics.eventStats.published}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Draft</Badge>
                </div>
                <span className="font-semibold">{analytics.eventStats.draft}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Upcoming</Badge>
                </div>
                <span className="font-semibold">{analytics.eventStats.upcoming}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Past</Badge>
                </div>
                <span className="font-semibold">{analytics.eventStats.past}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>Distribusi user dan aktivitas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Users</span>
                <span className="font-semibold">{analytics.userStats.newUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <span className="font-semibold">{analytics.userStats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verified Users</span>
                <span className="font-semibold">{analytics.userStats.verifiedUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admin Users</span>
                <span className="font-semibold">{analytics.userStats.adminUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Statistics</CardTitle>
          <CardDescription>Analisis pendapatan dan pertumbuhan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                Rp {analytics.revenueStats.total.toLocaleString('id-ID')}
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                Rp {analytics.revenueStats.thisMonth.toLocaleString('id-ID')}
              </div>
              <p className="text-sm text-gray-600">Bulan Ini</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                +{analytics.revenueStats.growth}%
              </div>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>Event dengan registrasi dan revenue tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topEvents.map((event, index) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.registrations} registrations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    Rp {event.revenue.toLocaleString('id-ID')}
                  </div>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registration Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Trends</CardTitle>
          <CardDescription>Grafik tren registrasi berdasarkan periode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart akan ditampilkan di sini</p>
              <p className="text-sm text-gray-400">Integrasi dengan chart library (Chart.js/Recharts)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
