'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Zap,
  CheckCircle,
  AlertCircle,
  Timer,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface AgentPerformance {
  id: string
  fullName: string
  email: string
  role: string
  metrics: {
    totalProcessed: number
    approved: number
    rejected: number
    averageResponseTime: number
    qualityScore: number
    efficiency: number
    workload: number
    capacity: number
  }
  trends: {
    daily: Array<{ date: string; processed: number; approved: number; rejected: number }>
    weekly: Array<{ week: string; processed: number; efficiency: number }>
  }
}

interface OrganizerInsights {
  totalRegistrations: number
  approvalRate: number
  rejectionRate: number
  averageProcessingTime: number
  trends: {
    daily: Array<{ date: string; registrations: number; approvals: number; rejections: number }>
    monthly: Array<{ month: string; registrations: number; approvalRate: number }>
  }
  demographics: {
    organizerTypes: Array<{ type: string; count: number; percentage: number }>
    businessTypes: Array<{ type: string; count: number; percentage: number }>
    geographicDistribution: Array<{ location: string; count: number }>
  }
}

interface AnalyticsData {
  agentPerformance: AgentPerformance[]
  organizerInsights: OrganizerInsights
  teamMetrics: {
    totalAgents: number
    activeAgents: number
    averageTeamEfficiency: number
    teamQualityScore: number
    totalWorkload: number
    totalCapacity: number
  }
  timeRange: string
  lastUpdated: string
}

export default function OperationsAnalyticsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        return
      }
      if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT'].includes(user.role)) {
        return
      }
    }
  }, [isInitialized, isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user && ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT'].includes(user.role)) {
      fetchAnalytics()
    }
  }, [isAuthenticated, user, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getOperationsAnalytics(timeRange)
      
      if (response.success && response.data) {
        setAnalyticsData(response.data)
      } else {
        setError('Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Error fetching analytics data')
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100'
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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
      <OperationsLayout>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </OperationsLayout>
    )
  }

  if (!analyticsData) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </OperationsLayout>
    )
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Analytics</h1>
            <p className="text-gray-600 mt-1">
              Advanced performance metrics and insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Team Efficiency</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.teamMetrics.averageTeamEfficiency.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-700">
                    Average across all agents
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Quality Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.teamMetrics.teamQualityScore.toFixed(1)}/10
                  </p>
                  <p className="text-sm text-gray-700">
                    Team average quality
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.teamMetrics.activeAgents}/{analyticsData.teamMetrics.totalAgents}
                  </p>
                  <p className="text-sm text-gray-700">
                    Currently working
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Workload</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.teamMetrics.totalWorkload}/{analyticsData.teamMetrics.totalCapacity}
                  </p>
                  <p className="text-sm text-gray-700">
                    Current capacity usage
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Agent Performance Analysis
            </CardTitle>
            <CardDescription>Individual agent metrics and performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Performance Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData.agentPerformance.map(agent => ({
                    name: agent.fullName.split(' ')[0], // First name only
                    processed: agent.metrics.totalProcessed,
                    efficiency: agent.metrics.efficiency,
                    quality: agent.metrics.qualityScore
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="processed" fill="#3B82F6" name="Processed" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency %" />
                    <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#F59E0B" strokeWidth={2} name="Quality Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Agent Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Agent</th>
                      <th className="text-left py-3 px-2">Processed</th>
                      <th className="text-left py-3 px-2">Approval Rate</th>
                      <th className="text-left py-3 px-2">Avg Response</th>
                      <th className="text-left py-3 px-2">Efficiency</th>
                      <th className="text-left py-3 px-2">Quality</th>
                      <th className="text-left py-3 px-2">Workload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.agentPerformance.map((agent) => {
                      const approvalRate = (agent.metrics.approved / agent.metrics.totalProcessed) * 100
                      return (
                        <tr key={agent.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{agent.fullName}</p>
                              <p className="text-xs text-gray-500">{agent.role}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-medium">{agent.metrics.totalProcessed}</span>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={approvalRate >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {approvalRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-gray-600">{formatTime(agent.metrics.averageResponseTime)}</span>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={getEfficiencyColor(agent.metrics.efficiency)}>
                              {agent.metrics.efficiency.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={getQualityColor(agent.metrics.qualityScore)}>
                              {agent.metrics.qualityScore.toFixed(1)}/10
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    agent.metrics.workload > 80 ? 'bg-red-500' : 
                                    agent.metrics.workload > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(agent.metrics.workload, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{agent.metrics.workload.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizer Insights */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Organizer Registration Trends
              </CardTitle>
              <CardDescription>Daily registration and approval patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.organizerInsights.trends.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="registrations" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Registrations" />
                    <Area type="monotone" dataKey="approvals" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Approvals" />
                    <Area type="monotone" dataKey="rejections" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Rejections" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Organizer Demographics
              </CardTitle>
              <CardDescription>Distribution by organizer type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.organizerInsights.demographics.organizerTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }: any) => `${type} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.organizerInsights.demographics.organizerTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>Weekly performance patterns and efficiency trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.agentPerformance[0]?.trends.weekly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="processed" stroke="#3B82F6" strokeWidth={2} name="Processed" />
                  <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <CardDescription>Critical metrics for operations management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.organizerInsights.approvalRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Approval Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analyticsData.organizerInsights.approvalRate >= 80 ? (
                    <span className="text-green-600 flex items-center justify-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Excellent
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center justify-center">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      Needs Improvement
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(analyticsData.organizerInsights.averageProcessingTime)}
                </div>
                <div className="text-sm text-gray-600">Avg Processing Time</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analyticsData.organizerInsights.averageProcessingTime <= 30 ? (
                    <span className="text-green-600 flex items-center justify-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Fast
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center justify-center">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      Slow
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.organizerInsights.totalRegistrations}
                </div>
                <div className="text-sm text-gray-600">Total Registrations</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  )
}