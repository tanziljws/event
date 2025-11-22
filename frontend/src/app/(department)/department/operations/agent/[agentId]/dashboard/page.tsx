'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Area
} from 'recharts'
import { 
  UserCheck, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Activity,
  RefreshCw,
  ArrowLeft,
  Calendar,
  MapPin,
  Mail,
  Phone,
  PieChart as PieChartIcon
} from 'lucide-react'

interface AgentStats {
  totalOrganizers: number
  pendingOrganizers: number
  approvedOrganizers: number
  rejectedOrganizers: number
  totalEvents: number
  pendingEvents: number
  approvedEvents: number
  rejectedEvents: number
}

interface AgentAssignment {
  id: string
  type: 'EVENT' | 'ORGANIZER'
  title: string
  status: string
  priority: string
  assignedAt: string
  createdAt: string
  assigner?: {
    fullName: string
    email: string
  }
}

interface AgentDashboardData {
  agent: {
    id: string
    fullName: string
    email: string
    role: string
    department: string
    userPosition: string
    lastActivity: string
  }
  stats: AgentStats
  assignments: AgentAssignment[]
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    status: string
  }>
  performanceMetrics: {
    completionRate: number
    averageProcessingTime: number
    qualityScore: number
    totalAssignments: number
    completedAssignments: number
    reassignments: number
  }
  workload: {
    currentWorkload: number
    capacity: number
    utilization: number
  }
}

export default function AgentDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const agentId = params.agentId as string

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && agentId) {
      fetchAgentDashboard()
    }
  }, [isAuthenticated, user, agentId])

  const fetchAgentDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getAgentDashboard(agentId)
      
      if (response.success && response.data) {
        setDashboardData(response.data)
      } else {
        setError('Failed to fetch agent dashboard data')
      }
    } catch (err) {
      setError('Error fetching agent dashboard')
      console.error('Error fetching agent dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAgentDashboard()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'NORMAL': return 'text-blue-600 bg-blue-100'
      case 'LOW': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (!dashboardData) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </OperationsLayout>
    )
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/department/operations/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Operations Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Agent Dashboard - {dashboardData.agent.fullName}
              </h1>
              <p className="text-gray-600 mt-1">
                Individual performance and assignment overview
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Agent Info Card */}
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-2xl font-bold text-white">
                    {dashboardData.agent.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {dashboardData.agent.fullName}
                  </h2>
                  <p className="text-gray-700">{dashboardData.agent.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {dashboardData.agent.role}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {dashboardData.agent.userPosition}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {dashboardData.agent.department}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(dashboardData.agent.lastActivity)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Pending Organizers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.stats.pendingOrganizers}
                  </p>
                  <p className="text-sm text-gray-700">
                    Awaiting review
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Approved Organizers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.stats.approvedOrganizers}
                  </p>
                  <p className="text-sm text-gray-700">
                    Successfully approved
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Rejected Organizers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.stats.rejectedOrganizers}
                  </p>
                  <p className="text-sm text-gray-700">
                    Rejected applications
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.stats.totalOrganizers + dashboardData.stats.totalEvents}
                  </p>
                  <p className="text-sm text-gray-700">
                    All time assignments
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Individual performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {dashboardData.performanceMetrics.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${dashboardData.performanceMetrics.completionRate}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Processing Time</span>
                  <span className="text-lg font-bold text-blue-600">
                    {dashboardData.performanceMetrics.averageProcessingTime.toFixed(1)}m
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Quality Score</span>
                  <span className="text-lg font-bold text-purple-600">
                    {dashboardData.performanceMetrics.qualityScore.toFixed(1)}/10
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reassignments</span>
                  <span className="text-lg font-bold text-orange-600">
                    {dashboardData.performanceMetrics.reassignments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Workload Status
              </CardTitle>
              <CardDescription>Current workload and capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Workload</span>
                  <span className="text-lg font-bold text-blue-600">
                    {dashboardData.workload.currentWorkload}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Capacity</span>
                  <span className="text-lg font-bold text-gray-600">
                    {dashboardData.workload.capacity}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Utilization</span>
                  <span className="text-lg font-bold text-purple-600">
                    {dashboardData.workload.utilization.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      dashboardData.workload.utilization > 80 ? 'bg-red-500' : 
                      dashboardData.workload.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(dashboardData.workload.utilization, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Status Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Assignment Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of assignments by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Approved', value: dashboardData.stats.approvedOrganizers, color: '#10B981' },
                        { name: 'Pending', value: dashboardData.stats.pendingOrganizers, color: '#F59E0B' },
                        { name: 'Rejected', value: dashboardData.stats.rejectedOrganizers, color: '#EF4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Approved', value: dashboardData.stats.approvedOrganizers, color: '#10B981' },
                        { name: 'Pending', value: dashboardData.stats.pendingOrganizers, color: '#F59E0B' },
                        { name: 'Rejected', value: dashboardData.stats.rejectedOrganizers, color: '#EF4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Weekly Performance Trends
              </CardTitle>
              <CardDescription>Performance metrics over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { day: 'Mon', completed: 3, pending: 2 },
                    { day: 'Tue', completed: 5, pending: 1 },
                    { day: 'Wed', completed: 4, pending: 3 },
                    { day: 'Thu', completed: 6, pending: 1 },
                    { day: 'Fri', completed: 7, pending: 0 },
                    { day: 'Sat', completed: 2, pending: 1 },
                    { day: 'Sun', completed: 1, pending: 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Current Assignments
            </CardTitle>
            <CardDescription>Active assignments for this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No current assignments</p>
              ) : (
                dashboardData.assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(assignment.assignedAt)}
                        </span>
                        {assignment.assigner && (
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            by {assignment.assigner.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500">
                      <div>Type: {assignment.type}</div>
                      <div>Created: {formatDate(assignment.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions performed by this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'event' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  )
}
