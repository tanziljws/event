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
  RefreshCw,
  MapPin,
  Clock,
  Ticket,
  CheckCircle2,
  XCircle
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
    platformFee?: number
    createdAt?: string
  }
  stats: {
    totalRegistrations: number
    totalAttendance: number
    attendanceRate: number
    totalRevenue: number
    averageTicketPrice: number
    platformFee?: number
    organizerRevenue?: number
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
  ticketTypeBreakdown?: Array<{
    id: string
    name: string
    price: number
    isFree: boolean
    color: string
    capacity: number
    sold: number
    available: number
    revenue: number
    attendance: number
    percentage: number
    soldPercentage: number
    attendanceRate: number
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
      
      // Fetch analytics data from backend
      const analyticsData = await ApiService.getOrganizerEventAnalytics(eventId)

      if (analyticsData.success && analyticsData.data) {
        setAnalytics(analyticsData.data)
      } else {
        setError(analyticsData.message || 'Failed to fetch analytics data')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data')
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
        <div className="flex items-center justify-center min-h-[60vh]">
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full shadow-sm border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Not Available</h2>
              <p className="text-gray-500 mb-6">{error || 'Analytics data is not available for this event.'}</p>
              <Button onClick={() => router.push('/organizer/events')} className="w-full">
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
              size="icon"
              onClick={() => router.push('/organizer/events')}
              className="h-10 w-10 rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900"
          >
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{analytics.event.title}</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {formatDate(analytics.event.eventDate)}
                </span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {analytics.event.eventTime}
                </span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  {analytics.event.location}
                </span>
              </div>
            </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
              Export Report
          </Button>
        </div>
      </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Registrations */}
          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-2.5 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
              </div>
                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {((analytics.stats.totalRegistrations / analytics.event.maxParticipants) * 100).toFixed(1)}% Filled
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.stats.totalRegistrations}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  from {analytics.event.maxParticipants} capacity
                </p>
          </div>
        </CardContent>
      </Card>

          {/* Attendance */}
          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 p-2.5 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {analytics.stats.attendanceRate.toFixed(1)}% Rate
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Attendance</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.stats.totalAttendance}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  checked-in participants
                </p>
            </div>
          </CardContent>
        </Card>

          {/* Total Revenue */}
          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-50 p-2.5 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <span className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  Gross
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.stats.totalRevenue)}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. {formatCurrency(analytics.stats.averageTicketPrice)} / ticket
                </p>
            </div>
          </CardContent>
        </Card>

          {/* Remaining Spots */}
          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-50 p-2.5 rounded-lg">
                  <Ticket className="h-6 w-6 text-orange-600" />
                </div>
                <span className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  Available
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Remaining Spots</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analytics.event.maxParticipants - analytics.stats.totalRegistrations}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  tickets left to sell
                </p>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Daily Registrations Chart - Takes up 2 columns */}
          <Card className="shadow-sm border-gray-200 lg:col-span-2">
          <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-gray-500" />
                Registration Trends
            </CardTitle>
              <CardDescription>Daily registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                  <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelFormatter={(value) => formatDate(value)}
                      formatter={(value: number) => [value, 'Registrations']}
                    />
                    <Bar
                      dataKey="registrations"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

          {/* Attendance Distribution - Takes up 1 column */}
          <Card className="shadow-sm border-gray-200">
          <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-gray-500" />
                Attendance Status
            </CardTitle>
              <CardDescription>Present vs Absent breakdown</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.attendanceData}
                    cx="50%"
                    cy="50%"
                      innerRadius={60}
                    outerRadius={80}
                      paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                </PieChart>
              </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900">{analytics.stats.totalRegistrations}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-3">
                {analytics.attendanceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-600">{item.status}</span>
                    </div>
                    <div className="font-medium text-gray-900">
                      {item.count} <span className="text-gray-400 mx-1">/</span> {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

         {/* Ticket Type Breakdown */}
         {analytics.ticketTypeBreakdown && analytics.ticketTypeBreakdown.length > 0 && (
           <Card className="shadow-sm border-gray-200">
             <CardHeader className="border-b border-gray-100 pb-4">
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-lg font-semibold text-gray-900">Ticket Type Performance</CardTitle>
                   <CardDescription>Sales breakdown by ticket type</CardDescription>
                 </div>
                 <div className="bg-indigo-50 p-2 rounded-lg">
                   <Ticket className="h-5 w-5 text-indigo-600" />
                 </div>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Type</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>
                       <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {analytics.ticketTypeBreakdown.map((ticket, index) => (
                       <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 px-6">
                           <div className="flex items-center">
                             <div
                               className="w-3 h-3 rounded-full mr-3"
                               style={{ backgroundColor: ticket.color }}
                             />
                             <div>
                               <span className="text-sm font-medium text-gray-900">{ticket.name}</span>
                               {ticket.isFree && (
                                 <span className="ml-2 text-xs text-gray-500">(Free)</span>
                               )}
                             </div>
                           </div>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <span className="text-sm font-semibold text-gray-900">
                             {ticket.isFree ? 'Free' : formatCurrency(ticket.price)}
                           </span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex flex-col items-end">
                             <span className="text-sm font-semibold text-gray-900">{ticket.sold}</span>
                             <span className="text-xs text-gray-500">{ticket.soldPercentage.toFixed(1)}%</span>
                           </div>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <span className="text-sm text-gray-600">{ticket.available}</span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <span className="text-sm font-semibold text-gray-900">{formatCurrency(ticket.revenue)}</span>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end">
                             <span className="text-sm text-gray-600 mr-3">{ticket.percentage.toFixed(1)}%</span>
                             <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                               <div
                                 className="h-full rounded-full"
                                 style={{
                                   width: `${ticket.percentage}%`,
                                   backgroundColor: ticket.color
                                 }}
                               />
                             </div>
                           </div>
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex flex-col items-end">
                             <span className="text-sm font-medium text-gray-900">{ticket.attendance}</span>
                             <span className="text-xs text-gray-500">{ticket.attendanceRate.toFixed(1)}%</span>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot className="bg-gray-50 border-t border-gray-200">
                     <tr>
                       <td className="py-3 px-6 text-sm font-semibold text-gray-900">Total</td>
                       <td className="py-3 px-6"></td>
                       <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">
                         {analytics.ticketTypeBreakdown.reduce((sum, t) => sum + t.sold, 0)}
                       </td>
                       <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">
                         {analytics.ticketTypeBreakdown.reduce((sum, t) => sum + t.available, 0)}
                       </td>
                       <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">
                         {formatCurrency(analytics.ticketTypeBreakdown.reduce((sum, t) => sum + t.revenue, 0))}
                       </td>
                       <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">100%</td>
                       <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">
                         {analytics.ticketTypeBreakdown.reduce((sum, t) => sum + t.attendance, 0)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </CardContent>
           </Card>
         )}

         {/* Detailed Tables Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
           <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Revenue Breakdown</CardTitle>
                  <CardDescription>Revenue by ticket type or source</CardDescription>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
          </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.revenueBreakdown.map((item, index) => {
                      const totalRevenue = analytics.stats.totalRevenue || 1;
                      const percentage = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                  <div className="flex items-center">
                    <div 
                                className="w-2 h-2 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                              <span className="text-sm font-medium text-gray-900">{item.source}</span>
                  </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-sm text-gray-600 mr-3">{percentage.toFixed(1)}%</span>
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                  </div>
                </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="py-3 px-6 text-sm font-semibold text-gray-900">Total</td>
                      <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(analytics.stats.totalRevenue)}
                      </td>
                      <td className="py-3 px-6"></td>
                    </tr>
                  </tfoot>
                </table>
            </div>
          </CardContent>
        </Card>

          {/* Recent Activity / Daily Breakdown */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Daily Activity</CardTitle>
                  <CardDescription>Recent registration performance</CardDescription>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Regs</th>
                      <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.dailyRegistrations.length > 0 ? (
                      [...analytics.dailyRegistrations].reverse().map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-6 text-sm text-gray-600">
                            {formatDate(day.date)}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {day.registrations}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(day.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 px-6 text-center text-sm text-gray-500">
                          No activity data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
      </div>
    </OrganizerLayout>
  )
}
