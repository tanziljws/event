'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonDashboard } from '@/components/ui/skeleton'
import { SessionIndicator } from '@/components/auth/session-status'
import { ApiService } from '@/lib/api'
import { 
  Calendar, 
  Users, 
  Ticket, 
  TrendingUp,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Bell,
  BarChart3,
  PieChart,
  TrendingDown,
  Clock,
  MapPin,
  Zap,
  ArrowRight,
  Settings,
  Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

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

// Fallback mock data (will be replaced by real API data)
const registrationTrends = [
  { month: 'Jan', registrations: 0, events: 0 },
  { month: 'Feb', registrations: 0, events: 0 },
  { month: 'Mar', registrations: 0, events: 0 },
  { month: 'Apr', registrations: 0, events: 0 },
  { month: 'May', registrations: 0, events: 0 },
  { month: 'Jun', registrations: 0, events: 0 }
]

const eventCategories = [
  { name: 'TECHNOLOGY', value: 0, color: 'bg-blue-500' },
  { name: 'BUSINESS', value: 0, color: 'bg-green-500' },
  { name: 'EDUCATION', value: 0, color: 'bg-purple-500' }
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
  const [timeRange, setTimeRange] = useState('current-month') // current-month, last-month, last-year, custom
  const [chartType, setChartType] = useState('bar') // bar, pie
  const [revenueChartType, setRevenueChartType] = useState('bar') // bar, pie
  const [demographicsChartType, setDemographicsChartType] = useState('bar') // bar, pie
  const [categoriesChartType, setCategoriesChartType] = useState('bar') // bar, pie
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'New event created successfully', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Event "Tech Conference" has low registrations', time: '1 hour ago' },
    { id: 3, type: 'info', message: 'Monthly report is ready for download', time: '3 hours ago' }
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [selectedYear, timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Calculate year based on timeRange
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Overview of your event management system</p>
          </div>
           <div className="flex items-center space-x-4">
             {/* Time Range Picker */}
             <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg shadow-blue-500/10">
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
             
             {/* Custom Year Picker - Only show when custom is selected */}
             {timeRange === 'custom' && (
               <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg shadow-blue-500/10">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg shadow-green-500/10">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  autoRefresh ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span>Auto Refresh</span>
              </button>
            </div>

            {/* Notification Center */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg shadow-purple-500/10 relative">
              <button className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* Session Indicator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-blue-500/10">
              <SessionIndicator />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Events</CardTitle>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats?.stats?.totalEvents || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.stats?.publishedEvents || 0} published
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Participants</CardTitle>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats?.stats?.totalParticipants || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.stats?.recentRegistrations || 0} recent
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Registrations</CardTitle>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Ticket className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {stats?.stats?.totalRegistrations || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.stats?.eventsThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Revenue</CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {formatCurrency(stats?.stats?.totalRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.stats?.eventsThisYear || 0} events this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Simple Data Overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Registration Trends - Simple Table */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Registration Trends</CardTitle>
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
                    className={`p-2 rounded-lg transition-colors ${
                      chartType === 'bar' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${
                      chartType === 'pie' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <PieChart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartType === 'bar' ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(analytics?.registrationTrends || registrationTrends).filter((item: any) => item.registrations > 0 || item.events > 0)}>
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="registrations" fill="url(#blueGradient)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="events" fill="url(#greenGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        <linearGradient id="pieBlueGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="pieGreenGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={(analytics?.registrationTrends || registrationTrends).filter((item: any) => item.registrations > 0 || item.events > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ month, registrations }: any) => `${month}: ${registrations}`}
                        outerRadius={90}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="registrations"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {(analytics?.registrationTrends || registrationTrends).filter((item: any) => item.registrations > 0 || item.events > 0).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#pieBlueGradient)' : 'url(#pieGreenGradient)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {(analytics?.registrationTrends || registrationTrends).filter((item: any) => item.registrations > 0 || item.events > 0).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No data available for {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Categories - Simple List */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Event Categories</CardTitle>
                  <CardDescription className="text-gray-600">Distribution by category</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCategoriesChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${
                      categoriesChartType === 'bar' 
                        ? 'bg-green-100 text-green-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCategoriesChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${
                      categoriesChartType === 'pie' 
                        ? 'bg-green-100 text-green-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <PieChart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesChartType === 'bar' ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(analytics?.eventCategories || eventCategories).filter((cat: any) => cat.value > 0)}>
                      <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [value, 'Events']}
                      />
                      <Bar dataKey="value" fill="url(#greenGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        <linearGradient id="categoryGreenGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="categoryEmeraldGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={(analytics?.eventCategories || eventCategories).filter((cat: any) => cat.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={90}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {(analytics?.eventCategories || eventCategories).filter((cat: any) => cat.value > 0).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#categoryGreenGradient)' : 'url(#categoryEmeraldGradient)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [value, 'Events']} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Demographics - Simple Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Revenue Summary</CardTitle>
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
                    className={`p-2 rounded-lg transition-colors ${
                      revenueChartType === 'bar' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRevenueChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${
                      revenueChartType === 'pie' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <PieChart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartType === 'bar' ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(analytics?.revenueData || revenueData).filter((item: any) => item.revenue > 0)}>
                      <defs>
                        <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `Rp ${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="url(#orangeGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        <linearGradient id="revenueOrangeGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                        <linearGradient id="revenueRedGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={(analytics?.revenueData || revenueData).filter((item: any) => item.revenue > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ month, revenue }: any) => `${month}: ${formatCurrency(revenue)}`}
                        outerRadius={90}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="revenue"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {(analytics?.revenueData || revenueData).filter((item: any) => item.revenue > 0).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#revenueOrangeGradient)' : 'url(#revenueRedGradient)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {(analytics?.revenueData || revenueData).filter((item: any) => item.revenue > 0).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No revenue data available for {selectedYear}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participant Demographics - Simple List */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Participant Demographics</CardTitle>
                  <CardDescription className="text-gray-600">Age distribution of participants</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDemographicsChartType('bar')}
                    className={`p-2 rounded-lg transition-colors ${
                      demographicsChartType === 'bar' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDemographicsChartType('pie')}
                    className={`p-2 rounded-lg transition-colors ${
                      demographicsChartType === 'pie' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <PieChart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {demographicsChartType === 'bar' ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(analytics?.participantDemographics || participantDemographics).filter((demo: any) => demo.count > 0)}>
                      <defs>
                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="age" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any) => [value, name === 'count' ? 'Participants' : 'Percentage']}
                      />
                      <Bar dataKey="count" fill="url(#purpleGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        <linearGradient id="demoPurpleGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="demoVioletGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={(analytics?.participantDemographics || participantDemographics).filter((demo: any) => demo.count > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ age, count, percentage }: any) => `${age}: ${count} (${percentage}%)`}
                        outerRadius={90}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="count"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {(analytics?.participantDemographics || participantDemographics).filter((demo: any) => demo.count > 0).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'url(#demoPurpleGradient)' : 'url(#demoVioletGradient)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any) => [value, name === 'count' ? 'Participants' : 'Percentage']} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center mb-2">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Recent Events
            </h3>
            <p className="text-gray-600 text-sm">Latest events in your system</p>
          </div>
          
          <div className="space-y-3">
            {stats?.stats?.topEvents?.slice(0, 5).map((event, index) => (
              <div key={event.id} className="group">
                <div className="flex items-center p-4 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md rounded-xl transition-all duration-300">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center mt-1 space-x-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            {event.participantCount} participants
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                          Active
                        </span>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No recent events</p>
                <p className="text-gray-400 text-sm mt-1">Create your first event to get started</p>
              </div>
            )}
          </div>
          
          {stats?.stats?.topEvents && stats.stats.topEvents.length > 5 && (
            <div className="pt-3 border-t border-gray-200">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors">
                View All Events ({stats.stats.topEvents.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
