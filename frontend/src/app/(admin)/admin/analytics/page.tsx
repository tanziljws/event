'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
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
      
      // Simulate analytics data (replace with actual API calls)
      const mockData: AnalyticsData = {
        overview: {
          totalEvents: 25,
          totalUsers: 150,
          totalRegistrations: 450,
          totalRevenue: 12500000
        },
        eventStats: {
          published: 20,
          draft: 5,
          upcoming: 15,
          past: 10
        },
        registrationTrends: {
          daily: [
            { date: '2025-09-01', count: 12 },
            { date: '2025-09-02', count: 18 },
            { date: '2025-09-03', count: 25 },
            { date: '2025-09-04', count: 22 },
            { date: '2025-09-05', count: 30 }
          ],
          weekly: [
            { week: 'Week 1', count: 85 },
            { week: 'Week 2', count: 92 },
            { week: 'Week 3', count: 78 },
            { week: 'Week 4', count: 105 }
          ],
          monthly: [
            { month: 'Jun', count: 320 },
            { month: 'Jul', count: 380 },
            { month: 'Aug', count: 420 },
            { month: 'Sep', count: 450 }
          ]
        },
        userStats: {
          newUsers: 25,
          activeUsers: 120,
          verifiedUsers: 140,
          adminUsers: 3
        },
        revenueStats: {
          total: 12500000,
          thisMonth: 3500000,
          lastMonth: 2800000,
          growth: 25
        },
        topEvents: [
          { id: '1', title: 'Tech Conference 2025', registrations: 150, revenue: 4500000 },
          { id: '2', title: 'Marketing Workshop', registrations: 120, revenue: 3600000 },
          { id: '3', title: 'Design Bootcamp', registrations: 80, revenue: 2400000 }
        ]
      }
      
      setAnalytics(mockData)
    } catch (err) {
      setError('Gagal memuat data analytics')
      console.error('Analytics error:', err)
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
    fetchAnalytics()
  }, [dateRange])

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
              +2 dari bulan lalu
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
              +15 dari bulan lalu
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
              +45 dari bulan lalu
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
              +25% dari bulan lalu
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
