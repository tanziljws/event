'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonDashboard } from '@/components/ui/skeleton'
import { SessionIndicator } from '@/components/auth/session-status'
import { StatCard } from '@/components/ui/stat-card'
import { BarChart, PieChart } from '@/components/charts'
import { colorScheme } from '@/lib/chart-config'
import { ApiService } from '@/lib/api'
import {
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  RefreshCw,
  Bell,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

interface DashboardStats {
  stats: {
    totalEvents: number
    publishedEvents: number
    totalParticipants: number
    totalRegistrations: number
    totalRevenue: number
    eventsThisMonth: number
    eventsThisYear: number
    upcomingEvents: number
    recentRegistrations: number
    topEvents: Array<{
      id: string
      title: string
      eventDate: string
      participantCount: number
      isPublished: boolean
      creator: {
        id: string
        fullName: string
        email: string
      }
    }>
  }
}

// Fallback mock data
const registrationTrends = [
  { month: 'Jan', registrations: 0, events: 0 },
  { month: 'Feb', registrations: 0, events: 0 },
  { month: 'Mar', registrations: 0, events: 0 },
  { month: 'Apr', registrations: 0, events: 0 },
  { month: 'May', registrations: 0, events: 0 },
  { month: 'Jun', registrations: 0, events: 0 }
]

const eventCategories = [
  { name: 'TECHNOLOGY', value: 0 },
  { name: 'BUSINESS', value: 0 },
  { name: 'EDUCATION', value: 0 }
]

const revenueData = [
  { month: 'Jan', revenue: 0 },
  { month: 'Feb', revenue: 0 },
  { month: 'Mar', revenue: 0 },
  { month: 'Apr', revenue: 0 },
  { month: 'May', revenue: 0 },
  { month: 'Jun', revenue: 0 }
]

const participantDemographics = [
  { age: '18-25', count: 0, percentage: 0 },
  { age: '26-35', count: 0, percentage: 0 },
  { age: '36-45', count: 0, percentage: 0 },
  { age: '46+', count: 0, percentage: 0 }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [timeRange, setTimeRange] = useState('current-month')
  const [chartType, setChartType] = useState('bar')
  const [revenueChartType, setRevenueChartType] = useState('bar')
  const [demographicsChartType, setDemographicsChartType] = useState('bar')
  const [categoriesChartType, setCategoriesChartType] = useState('bar')

  useEffect(() => {
    fetchDashboardData()
  }, [selectedYear, timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      let yearToFetch = selectedYear
      const now = new Date()

      switch (timeRange) {
        case 'current-month':
          yearToFetch = now.getFullYear()
          break
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          yearToFetch = lastMonth.getFullYear()
          break
        case 'last-year':
          yearToFetch = now.getFullYear() - 1
          break
        case 'custom':
          yearToFetch = selectedYear
          break
      }

      const [statsResponse, analyticsResponse] = await Promise.all([
        ApiService.getAdminDashboard(),
        ApiService.getMonthlyAnalytics(yearToFetch, timeRange)
      ])

      if (statsResponse.success) {
        setStats(statsResponse.data)
      } else {
        setError('Failed to fetch dashboard data')
      }

      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data)
      } else {
        setError('Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    if (!stats || !analytics) {
      alert('No data to export')
      return
    }

    // Prepare CSV data
    const csvRows: string[] = []

    // Header
    csvRows.push('Nusa Event Platform - Dashboard Export')
    csvRows.push(`Generated: ${new Date().toLocaleString('id-ID')}`)
    csvRows.push('')

    // Statistics Section
    csvRows.push('=== STATISTICS ===')
    csvRows.push('Metric,Value')
    csvRows.push(`Total Events,${stats.stats.totalEvents}`)
    csvRows.push(`Published Events,${stats.stats.publishedEvents}`)
    csvRows.push(`Total Participants,${stats.stats.totalParticipants}`)
    csvRows.push(`Total Registrations,${stats.stats.totalRegistrations}`)
    csvRows.push(`Total Revenue,${formatCurrency(stats.stats.totalRevenue)}`)
    csvRows.push(`Events This Month,${stats.stats.eventsThisMonth}`)
    csvRows.push(`Events This Year,${stats.stats.eventsThisYear}`)
    csvRows.push(`Upcoming Events,${stats.stats.upcomingEvents}`)
    csvRows.push(`Recent Registrations,${stats.stats.recentRegistrations}`)
    csvRows.push('')

    // Registration Trends
    if (analytics.registrationTrends && analytics.registrationTrends.length > 0) {
      csvRows.push('=== REGISTRATION TRENDS ===')
      csvRows.push('Month,Registrations,Events')
      analytics.registrationTrends.forEach((item: any) => {
        csvRows.push(`${item.month},${item.registrations},${item.events}`)
      })
      csvRows.push('')
    }

    // Event Categories
    if (analytics.eventCategories && analytics.eventCategories.length > 0) {
      csvRows.push('=== EVENT CATEGORIES ===')
      csvRows.push('Category,Count')
      analytics.eventCategories.forEach((cat: any) => {
        csvRows.push(`${cat.name},${cat.value}`)
      })
      csvRows.push('')
    }

    // Revenue Data
    if (analytics.revenueData && analytics.revenueData.length > 0) {
      csvRows.push('=== REVENUE DATA ===')
      csvRows.push('Month,Revenue (IDR)')
      analytics.revenueData.forEach((item: any) => {
        csvRows.push(`${item.month},${item.revenue}`)
      })
      csvRows.push('')
    }

    // Participant Demographics
    if (analytics.participantDemographics && analytics.participantDemographics.length > 0) {
      csvRows.push('=== PARTICIPANT DEMOGRAPHICS ===')
      csvRows.push('Age Group,Count,Percentage')
      analytics.participantDemographics.forEach((demo: any) => {
        csvRows.push(`${demo.age},${demo.count},${demo.percentage}%`)
      })
      csvRows.push('')
    }

    // Top Events
    if (stats.stats.topEvents && stats.stats.topEvents.length > 0) {
      csvRows.push('=== TOP EVENTS ===')
      csvRows.push('Title,Event Date,Participants,Published,Creator')
      stats.stats.topEvents.forEach((event: any) => {
        csvRows.push(`"${event.title}",${event.eventDate},${event.participantCount},${event.isPublished ? 'Yes' : 'No'},"${event.creator.fullName}"`)
      })
    }

    // Create CSV content
    const csvContent = csvRows.join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="space-y-8 p-6">
          <SkeletonDashboard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    )
  }

  // Prepare chart data
  const registrationChartData = {
    labels: (analytics?.registrationTrends || registrationTrends)
      .filter((item: any) => item.registrations > 0 || item.events > 0)
      .map((item: any) => item.month),
    datasets: [
      {
        label: 'Registrations',
        data: (analytics?.registrationTrends || registrationTrends)
          .filter((item: any) => item.registrations > 0 || item.events > 0)
          .map((item: any) => item.registrations),
        backgroundColor: colorScheme.blue.bg,
        borderColor: colorScheme.blue.border,
        borderWidth: 1,
      },
      {
        label: 'Events',
        data: (analytics?.registrationTrends || registrationTrends)
          .filter((item: any) => item.registrations > 0 || item.events > 0)
          .map((item: any) => item.events),
        backgroundColor: colorScheme.green.bg,
        borderColor: colorScheme.green.border,
        borderWidth: 1,
      },
    ],
  }

  const registrationPieData = {
    labels: (analytics?.registrationTrends || registrationTrends)
      .filter((item: any) => item.registrations > 0)
      .map((item: any) => item.month),
    datasets: [
      {
        data: (analytics?.registrationTrends || registrationTrends)
          .filter((item: any) => item.registrations > 0)
          .map((item: any) => item.registrations),
        backgroundColor: [
          colorScheme.blue.bg,
          colorScheme.green.bg,
          colorScheme.purple.bg,
          colorScheme.orange.bg,
          colorScheme.red.bg,
          colorScheme.indigo.bg,
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const categoriesChartData = {
    labels: (analytics?.eventCategories || eventCategories)
      .filter((cat: any) => cat.value > 0)
      .map((cat: any) => cat.name),
    datasets: [
      {
        label: 'Events',
        data: (analytics?.eventCategories || eventCategories)
          .filter((cat: any) => cat.value > 0)
          .map((cat: any) => cat.value),
        backgroundColor: colorScheme.green.bg,
        borderColor: colorScheme.green.border,
        borderWidth: 1,
      },
    ],
  }

  const categoriesPieData = {
    labels: (analytics?.eventCategories || eventCategories)
      .filter((cat: any) => cat.value > 0)
      .map((cat: any) => cat.name),
    datasets: [
      {
        data: (analytics?.eventCategories || eventCategories)
          .filter((cat: any) => cat.value > 0)
          .map((cat: any) => cat.value),
        backgroundColor: [
          colorScheme.green.bg,
          colorScheme.emerald.bg,
          colorScheme.blue.bg,
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const revenueChartData = {
    labels: (analytics?.revenueData || revenueData)
      .filter((item: any) => item.revenue > 0)
      .map((item: any) => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: (analytics?.revenueData || revenueData)
          .filter((item: any) => item.revenue > 0)
          .map((item: any) => item.revenue),
        backgroundColor: colorScheme.orange.bg,
        borderColor: colorScheme.orange.border,
        borderWidth: 1,
      },
    ],
  }

  const revenuePieData = {
    labels: (analytics?.revenueData || revenueData)
      .filter((item: any) => item.revenue > 0)
      .map((item: any) => item.month),
    datasets: [
      {
        data: (analytics?.revenueData || revenueData)
          .filter((item: any) => item.revenue > 0)
          .map((item: any) => item.revenue),
        backgroundColor: [
          colorScheme.orange.bg,
          colorScheme.red.bg,
          'rgba(251, 146, 60, 0.8)',
          'rgba(220, 38, 38, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(234, 88, 12, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const demographicsChartData = {
    labels: (analytics?.participantDemographics || participantDemographics)
      .filter((demo: any) => demo.count > 0)
      .map((demo: any) => demo.age),
    datasets: [
      {
        label: 'Participants',
        data: (analytics?.participantDemographics || participantDemographics)
          .filter((demo: any) => demo.count > 0)
          .map((demo: any) => demo.count),
        backgroundColor: colorScheme.purple.bg,
        borderColor: colorScheme.purple.border,
        borderWidth: 1,
      },
    ],
  }

  const demographicsPieData = {
    labels: (analytics?.participantDemographics || participantDemographics)
      .filter((demo: any) => demo.count > 0)
      .map((demo: any) => demo.age),
    datasets: [
      {
        data: (analytics?.participantDemographics || participantDemographics)
          .filter((demo: any) => demo.count > 0)
          .map((demo: any) => demo.count),
        backgroundColor: [
          colorScheme.purple.bg,
          'rgba(168, 85, 247, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(126, 34, 206, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Overview of your event management system</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Time Range Picker */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none"
              >
                <option value="current-month">Bulan Ini</option>
                <option value="last-month">Bulan Lalu</option>
                <option value="last-year">Tahun Lalu</option>
                <option value="custom">Custom Tahun</option>
              </select>
            </div>

            {/* Custom Year Picker */}
            {timeRange === 'custom' && (
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none"
                >
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                  <option value={2022}>2022</option>
                  <option value={2021}>2021</option>
                </select>
              </div>
            )}

            {/* Auto Refresh Toggle */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${autoRefresh ? 'text-green-700' : 'text-gray-500'
                  }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>Auto Refresh</span>
              </button>
            </div>

            {/* Export Button */}
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              disabled={!stats || !analytics}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            {/* Session Indicator */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <SessionIndicator />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={stats?.stats?.totalEvents || 0}
            subtitle={`${stats?.stats?.publishedEvents || 0} published`}
            icon={Calendar}
            iconBg="bg-blue-500"
          />
          <StatCard
            title="Total Participants"
            value={stats?.stats?.totalParticipants || 0}
            subtitle={`${stats?.stats?.recentRegistrations || 0} recent`}
            icon={Users}
            iconBg="bg-green-500"
          />
          <StatCard
            title="Registrations"
            value={stats?.stats?.totalRegistrations || 0}
            subtitle={`${stats?.stats?.eventsThisMonth || 0} this month`}
            icon={Ticket}
            iconBg="bg-purple-500"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats?.stats?.totalRevenue || 0)}
            subtitle={`${stats?.stats?.eventsThisYear || 0} events this year`}
            icon={TrendingUp}
            iconBg="bg-orange-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Registration Trends */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Registration Trends</CardTitle>
                  <CardDescription className="text-gray-600">
                    {timeRange === 'current-month' && 'Data registrasi bulan ini'}
                    {timeRange === 'last-month' && 'Data registrasi bulan lalu'}
                    {timeRange === 'last-year' && 'Data registrasi tahun lalu'}
                    {timeRange === 'custom' && `Data registrasi tahun ${selectedYear}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${chartType === 'bar'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${chartType === 'pie'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartType === 'bar' ? (
                <BarChart data={registrationChartData} />
              ) : (
                <PieChart data={registrationPieData} />
              )}
              {registrationChartData.labels.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No data available for {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Categories */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Event Categories</CardTitle>
                  <CardDescription className="text-gray-600">Distribution by category</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCategoriesChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${categoriesChartType === 'bar'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCategoriesChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${categoriesChartType === 'pie'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesChartType === 'bar' ? (
                <BarChart data={categoriesChartData} />
              ) : (
                <PieChart data={categoriesPieData} />
              )}
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Revenue Summary</CardTitle>
                  <CardDescription className="text-gray-600">
                    {timeRange === 'current-month' && 'Data pendapatan bulan ini'}
                    {timeRange === 'last-month' && 'Data pendapatan bulan lalu'}
                    {timeRange === 'last-year' && 'Data pendapatan tahun lalu'}
                    {timeRange === 'custom' && `Data pendapatan tahun ${selectedYear}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRevenueChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${revenueChartType === 'bar'
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRevenueChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${revenueChartType === 'pie'
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartType === 'bar' ? (
                <BarChart
                  data={revenueChartData}
                  options={{
                    scales: {
                      y: {
                        ticks: {
                          callback: (value: any) => formatCurrency(value)
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `Revenue: ${formatCurrency(context.parsed.y)}`
                        }
                      }
                    }
                  }}
                />
              ) : (
                <PieChart
                  data={revenuePieData}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${context.label}: ${formatCurrency(context.parsed)}`
                        }
                      }
                    }
                  }}
                />
              )}
              {revenueChartData.labels.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No revenue data available for {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participant Demographics */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Participant Demographics</CardTitle>
                  <CardDescription className="text-gray-600">Age distribution of participants</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDemographicsChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${demographicsChartType === 'bar'
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDemographicsChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${demographicsChartType === 'pie'
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {demographicsChartType === 'bar' ? (
                <BarChart data={demographicsChartData} />
              ) : (
                <PieChart data={demographicsPieData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Events Table */}
        {stats?.stats?.topEvents && stats.stats.topEvents.length > 0 && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Top Events</CardTitle>
              <CardDescription className="text-gray-600">Most popular events by participant count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Participants</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organizer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.stats.topEvents.slice(0, 5).map((event) => (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{event.title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(event.eventDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{event.participantCount}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                            {event.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{event.creator.fullName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
