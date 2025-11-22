'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  ArrowLeft,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react'

interface AnalyticsData {
  responseTime: {
    average: number
    median: number
    p95: number
    targets: {
      urgent: number
      high: number
      medium: number
      low: number
    }
    compliance: {
      urgent: number
      high: number
      medium: number
      low: number
    }
  }
  agentPerformance: Array<{
    id: string
    name: string
    ticketsResolved: number
    averageResponseTime: number
    customerSatisfaction: number
  }>
  ticketTrends: {
    daily: Array<{
      date: string
      created: number
      resolved: number
    }>
    weekly: Array<{
      week: string
      created: number
      resolved: number
    }>
    monthly: Array<{
      month: string
      created: number
      resolved: number
    }>
  }
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
    percentage: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  totalAgents: number
}

export default function AnalyticsDashboard() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAnalytics()
    }
  }, [isAuthenticated, user, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getAnalytics(timeRange)
      
      if (response.success) {
        setAnalytics(response.data)
      } else {
        setError(response.message || 'Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Failed to fetch analytics data')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`
    }
    return `${hours.toFixed(1)}h`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-600 bg-red-100'
      case 'IN_PROGRESS': return 'text-yellow-600 bg-yellow-100'
      case 'RESOLVED': return 'text-green-600 bg-green-100'
      case 'CLOSED': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  if (!['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT'].includes(user.role)) {
    return null // Will redirect
  }

  return (
    <ProtectedRoute requireRole={['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/department/customer_service/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Performance metrics and insights</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? "primary" : "outline"}
                size="sm"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={fetchAnalytics} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Response Time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics?.responseTime.average || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Median: {formatTime(analytics?.responseTime.median || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">95th Percentile</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics?.responseTime.p95 || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Response time target
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics?.responseTime.compliance?.high || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                High Priority SLA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SLA Targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              SLA Targets & Compliance
            </CardTitle>
            <CardDescription>Response time targets and compliance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { priority: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' },
                { priority: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
                { priority: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
                { priority: 'low', label: 'Low', color: 'text-green-600 bg-green-100' }
              ].map(({ priority, label, color }) => (
                <div key={priority} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
                      {label}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics?.responseTime.compliance?.[priority as keyof typeof analytics.responseTime.compliance] || 0)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Target: {formatTime(analytics?.responseTime.targets?.[priority as keyof typeof analytics.responseTime.targets] || 0)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (analytics?.responseTime.compliance?.[priority as keyof typeof analytics.responseTime.compliance] || 0) >= 90 ? 'bg-green-500' :
                        (analytics?.responseTime.compliance?.[priority as keyof typeof analytics.responseTime.compliance] || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(analytics?.responseTime.compliance?.[priority as keyof typeof analytics.responseTime.compliance] || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Agent Performance
            </CardTitle>
            <CardDescription>Individual performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.agentPerformance.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-500">CS Agent</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agent.ticketsResolved}</p>
                      <p className="text-xs text-gray-500">Resolved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatTime(agent.averageResponseTime)}</p>
                      <p className="text-xs text-gray-500">Avg Response</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agent.customerSatisfaction}/5</p>
                      <p className="text-xs text-gray-500">Satisfaction</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.priorityDistribution.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Ticket Trends - Last 7 Days
            </CardTitle>
            <CardDescription>Daily ticket creation and resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.ticketTrends.daily.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Created: {day.created}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Resolved: {day.resolved}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
