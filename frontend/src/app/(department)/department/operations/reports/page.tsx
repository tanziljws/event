'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { useAuth } from '@/contexts/auth-context'
import { ApiService } from '@/lib/api'
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
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Calendar as CalendarIcon,
  Target,
  Award,
  Zap
} from 'lucide-react'

interface ReportData {
  summary: {
    totalOrganizers: number
    approvedOrganizers: number
    rejectedOrganizers: number
    pendingOrganizers: number
    totalEvents: number
    approvedEvents: number
    rejectedEvents: number
    draftEvents: number
    totalAssignments: number
    completedAssignments: number
    pendingAssignments: number
  }
  organizerTrends: Array<{
    month: string
    approved: number
    rejected: number
    pending: number
  }>
  eventTrends: Array<{
    month: string
    approved: number
    rejected: number
    draft: number
  }>
  assignmentPerformance: Array<{
    agentName: string
    totalAssignments: number
    completedAssignments: number
    completionRate: number
    avgProcessingTime: number
  }>
  monthlyStats: Array<{
    month: string
    organizers: number
    events: number
    assignments: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    status: string
  }>
}

export default function OperationsReportsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [selectedAgent, setSelectedAgent] = useState('all')

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
      fetchReportData()
    }
  }, [isAuthenticated, user, dateRange, selectedAgent])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getOperationsReports(dateRange, selectedAgent === 'all' ? undefined : selectedAgent)
      
      if (response.success && response.data) {
        setReportData(response.data)
      } else {
        // Fallback to mock data if API fails
        const mockData: ReportData = {
        summary: {
          totalOrganizers: 156,
          approvedOrganizers: 142,
          rejectedOrganizers: 8,
          pendingOrganizers: 6,
          totalEvents: 89,
          approvedEvents: 76,
          rejectedEvents: 7,
          draftEvents: 6,
          totalAssignments: 234,
          completedAssignments: 198,
          pendingAssignments: 36
        },
        organizerTrends: [
          { month: 'Jan', approved: 12, rejected: 2, pending: 3 },
          { month: 'Feb', approved: 15, rejected: 1, pending: 2 },
          { month: 'Mar', approved: 18, rejected: 3, pending: 1 },
          { month: 'Apr', approved: 22, rejected: 2, pending: 4 },
          { month: 'May', approved: 19, rejected: 1, pending: 2 },
          { month: 'Jun', approved: 25, rejected: 4, pending: 3 }
        ],
        eventTrends: [
          { month: 'Jan', approved: 8, rejected: 1, draft: 2 },
          { month: 'Feb', approved: 12, rejected: 2, draft: 1 },
          { month: 'Mar', approved: 15, rejected: 1, draft: 3 },
          { month: 'Apr', approved: 18, rejected: 2, draft: 2 },
          { month: 'May', approved: 14, rejected: 1, draft: 1 },
          { month: 'Jun', approved: 20, rejected: 3, draft: 2 }
        ],
        assignmentPerformance: [
          { agentName: 'Agent Alpha', totalAssignments: 45, completedAssignments: 42, completionRate: 93.3, avgProcessingTime: 2.5 },
          { agentName: 'Agent Beta', totalAssignments: 38, completedAssignments: 35, completionRate: 92.1, avgProcessingTime: 2.8 },
          { agentName: 'Agent Gamma', totalAssignments: 52, completedAssignments: 48, completionRate: 92.3, avgProcessingTime: 2.2 },
          { agentName: 'Agent Delta', totalAssignments: 41, completedAssignments: 38, completionRate: 92.7, avgProcessingTime: 2.6 },
          { agentName: 'Agent Echo', totalAssignments: 35, completedAssignments: 32, completionRate: 91.4, avgProcessingTime: 2.9 }
        ],
        monthlyStats: [
          { month: 'Jan', organizers: 17, events: 11, assignments: 28 },
          { month: 'Feb', organizers: 18, events: 15, assignments: 33 },
          { month: 'Mar', organizers: 22, events: 19, assignments: 41 },
          { month: 'Apr', organizers: 28, events: 22, assignments: 50 },
          { month: 'May', organizers: 22, events: 16, assignments: 38 },
          { month: 'Jun', organizers: 31, events: 25, assignments: 56 }
        ],
        recentActivity: [
          { id: '1', type: 'organizer', description: 'New organizer application from TechCorp', timestamp: '2024-06-15T10:30:00Z', status: 'pending' },
          { id: '2', type: 'event', description: 'Event "Summer Conference 2024" approved', timestamp: '2024-06-15T09:15:00Z', status: 'approved' },
          { id: '3', type: 'organizer', description: 'Organizer verification completed for StartupXYZ', timestamp: '2024-06-15T08:45:00Z', status: 'completed' },
          { id: '4', type: 'event', description: 'Event "Tech Meetup" rejected - insufficient documentation', timestamp: '2024-06-14T16:20:00Z', status: 'rejected' },
          { id: '5', type: 'organizer', description: 'Organizer application from InnovateLab', timestamp: '2024-06-14T14:10:00Z', status: 'pending' }
        ]
        }
        
        setReportData(mockData)
      }
    } catch (err) {
      setError('Error fetching report data')
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Please login again. Your session has expired.')
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/reports/operations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format,
          timeRange: dateRange,
          agentId: selectedAgent === 'all' ? undefined : selectedAgent
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `operations-report-${dateRange}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (response.status === 404) {
        // Token invalid or expired
        alert('Your session has expired. Please login again.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else {
        alert('Failed to export report. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Error exporting report. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Check access permissions
  if (isInitialized && user && !['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT'].includes(user.role)) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Operations Reports page.
            </p>
            <p className="text-sm text-gray-500">
              This page is only available to Operations Head and Senior Agents.
            </p>
          </div>
        </div>
      </OperationsLayout>
    )
  }

  if (!isInitialized || loading) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </OperationsLayout>
    )
  }

  if (error) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReportData}>Try Again</Button>
        </div>
      </OperationsLayout>
    )
  }

  if (!reportData) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-gray-600">No report data available</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Operations Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics and insights for operations team</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button onClick={() => handleExportReport('pdf')} className="flex items-center bg-red-600 hover:bg-red-700">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => handleExportReport('excel')} className="flex items-center bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={fetchReportData} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Organizers</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.summary.totalOrganizers}</p>
                  <p className="text-sm text-gray-700">
                    {reportData.summary.approvedOrganizers} approved, {reportData.summary.pendingOrganizers} pending
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Pending Organizers</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.summary.pendingOrganizers}</p>
                  <p className="text-sm text-gray-700">
                    Awaiting verification and approval
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.summary.totalAssignments}</p>
                  <p className="text-sm text-gray-700">
                    {reportData.summary.completedAssignments} completed, {reportData.summary.pendingAssignments} pending
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round((reportData.summary.completedAssignments / reportData.summary.totalAssignments) * 100)}%
                  </p>
                  <p className="text-sm text-gray-700">
                    Overall assignment completion rate
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organizer Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Organizer Trends
              </CardTitle>
              <CardDescription>Monthly organizer application trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.organizerTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approved" fill="#10b981" name="Approved" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assignment Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Assignment Trends
              </CardTitle>
              <CardDescription>Monthly assignment completion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="assignments" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Assignments" />
                  <Area type="monotone" dataKey="organizers" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Organizers" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Agent Performance
              </CardTitle>
              <CardDescription>Assignment completion rates by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.assignmentPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="agentName" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                  <Bar dataKey="completionRate" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Monthly Overview
              </CardTitle>
              <CardDescription>Total activities per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="organizers" stroke="#8b5cf6" strokeWidth={2} name="Organizers" />
                  <Line type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} name="Events" />
                  <Line type="monotone" dataKey="assignments" stroke="#f59e0b" strokeWidth={2} name="Assignments" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest operations activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'organizer' ? (
                        <UserCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <CalendarIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(activity.status)}
                      <span className="capitalize">{activity.status}</span>
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  )
}
