'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/protected-route'
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
  Settings, 
  Ticket, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Wrench,
  Calendar,
  Users,
  UserCheck,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Zap,
  Target,
  RefreshCw,
  History,
  Bell,
  Shield,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  MapPin,
  Mail,
  Phone,
  PieChart as PieChartIcon
} from 'lucide-react'

interface DepartmentStats {
  totalUsers: number
  totalOrganizers: number
  pendingOrganizers: number
  approvedOrganizers: number
  rejectedOrganizers: number
  totalMembers?: number
  activeMembers?: number
}

interface TeamMember {
  id: string
  fullName: string
  email: string
  role: string
  position: string
  lastActivity: string
  openTickets: number
  inProgressTickets: number
  completedThisWeek: number
}

interface AssignmentAgent {
  id: string
  fullName: string
  email: string
  role: string
  workload: number
  capacity: number
  utilization: number
  isAvailable: boolean
}

interface QueueStatus {
  totalQueued: number
  stats: Array<{
    status: string
    priority: string
    _count: number
  }>
}

interface AssignmentData {
  agents: AssignmentAgent[]
  queueStatus: QueueStatus
  totalCapacity: number
  totalWorkload: number
  utilizationRate: number
  recentAssignments: {
    events: Array<{
      id: string
      title: string
      assignedTo: string
      assignedBy: string
      assignedAt: string
      status: string
      assigner: {
        fullName: string
        email: string
      }
    }>
    organizers: Array<{
      id: string
      fullName: string
      businessName: string
      assignedTo: string
      assignedBy: string
      assignedAt: string
      verificationStatus: string
      assigner: {
        fullName: string
        email: string
      }
    }>
  }
}

interface PendingOrganizer {
  id: string
  fullName: string
  email: string
  businessName: string
  organizerType: string
  createdAt: string
}

interface QueueAnalytics {
  timeRange: string
  queueStats: {
    totalQueued: number
    totalProcessed: number
    totalFailed: number
    currentlyQueued: number
    processingRate: number
    failureRate: number
    averageWaitTime: number
    priorityBreakdown: Array<{
      priority: string
      count: number
    }>
  }
}


interface NotificationStats {
  totalConnections: number
  activeConnections: number
  rooms: Array<{
    name: string
    connections: number
  }>
}

interface AgentAnalytics {
  agentId: string
  agentName: string
  performance: {
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
  trends: {
    assignmentsThisWeek: number
    assignmentsLastWeek: number
    avgProcessingTimeThisWeek: number
    avgProcessingTimeLastWeek: number
  }
}

export default function OperationsDashboard() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DepartmentStats>({
    totalUsers: 0,
    totalOrganizers: 0,
    pendingOrganizers: 0,
    approvedOrganizers: 0,
    rejectedOrganizers: 0,
    totalMembers: 0,
    activeMembers: 0
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingOrganizers, setPendingOrganizers] = useState<PendingOrganizer[]>([])
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null)
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null)
  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [workloadDetails, setWorkloadDetails] = useState<any>(null)
  const [workloadLoading, setWorkloadLoading] = useState(false)
  const [selectedOrganizer, setSelectedOrganizer] = useState<any>(null)
  const [organizerDetailsOpen, setOrganizerDetailsOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingOrganizerId, setRejectingOrganizerId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Prepare API calls based on user role
      const apiCalls = [
        ApiService.getOperationsDashboard(),
        ApiService.getOrganizersForReview({ status: 'PENDING', limit: 5 }),
        ApiService.getNotificationStats()
      ]

      // Only fetch agent analytics for OPS_HEAD and OPS_SENIOR_AGENT
      if (user?.role === 'OPS_HEAD' || user?.role === 'OPS_SENIOR_AGENT') {
        apiCalls.push(ApiService.getAllAgentsAnalytics('7d'))
      } else {
        apiCalls.push(Promise.resolve({ success: false, data: null, message: 'Not authorized' }))
      }

      // Fetch multiple data sources in parallel
      const [
        departmentResponse, 
        organizersResponse,
        notificationStatsResponse,
        agentAnalyticsResponse
      ] = await Promise.all(apiCalls)

      // Process department data
      if (departmentResponse.success && departmentResponse.data) {
        const { metrics, teamMembers: apiTeamMembers, assignmentData: apiAssignmentData } = departmentResponse.data

        // Map API metrics to local state
        setStats({
          totalUsers: metrics.totalUsers || 0,
          totalOrganizers: metrics.totalOrganizers || 0,
          pendingOrganizers: organizersResponse.success ? organizersResponse.data.organizers?.length || 0 : 0,
          approvedOrganizers: metrics.approvedOrganizers || 0,
          rejectedOrganizers: metrics.rejectedOrganizers || 0,
          totalMembers: metrics.teamSize || 0,
          activeMembers: metrics.teamSize || 0
        })

        // Map API team members to local state
        const mappedTeamMembers = apiTeamMembers.map((member: any) => ({
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          role: member.role,
          position: member.userPosition || member.role,
          lastActivity: member.lastActivity || new Date().toISOString(),
          openTickets: 0, // Placeholder - would need actual ticket data
          inProgressTickets: 0, // Placeholder - would need actual ticket data
          completedThisWeek: 0 // Placeholder - would need actual ticket data
        }))

        setTeamMembers(mappedTeamMembers)

        // Set assignment data
        if (apiAssignmentData) {
          setAssignmentData(apiAssignmentData)
        }
      }

      // Process pending organizers
      if (organizersResponse.success && organizersResponse.data.organizers) {
        const mappedOrganizers = organizersResponse.data.organizers.map((organizer: any) => ({
          id: organizer.id,
          fullName: organizer.fullName,
          email: organizer.email,
          businessName: organizer.businessName,
          organizerType: organizer.organizerType,
          createdAt: organizer.createdAt
        }))
        setPendingOrganizers(mappedOrganizers)
      }


      // Process notification stats
      if (notificationStatsResponse.success && notificationStatsResponse.data) {
        setNotificationStats(notificationStatsResponse.data)
      }

      // Process agent analytics
      if (agentAnalyticsResponse.success && agentAnalyticsResponse.data) {
        setAgentAnalytics(agentAnalyticsResponse.data)
      }

    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  // Handler for viewing organizer details
  const handleViewOrganizerDetails = async (organizerId: string) => {
    try {
      const response = await ApiService.getOrganizerDetails(organizerId)
      if (response.success) {
        setSelectedOrganizer(response.data)
        setOrganizerDetailsOpen(true)
      }
    } catch (error) {
      console.error('Error fetching organizer details:', error)
    }
  }

  // Handler for approving organizer
  const handleApproveOrganizer = async (organizerId: string) => {
    try {
      const response = await ApiService.approveOrganizer(organizerId)
      if (response.success) {
        await fetchDashboardData() // Refresh data
        // Show success message
      }
    } catch (error) {
      console.error('Error approving organizer:', error)
    }
  }

  // Handler for rejecting organizer
  const handleRejectOrganizer = (organizerId: string) => {
    setRejectingOrganizerId(organizerId)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  // Handler for submitting rejection
  const handleSubmitRejection = async () => {
    if (!rejectingOrganizerId || !rejectReason.trim()) return

    try {
      const response = await ApiService.rejectOrganizer(rejectingOrganizerId, rejectReason)
      if (response.success) {
        await fetchDashboardData() // Refresh data
        setRejectDialogOpen(false)
        setRejectingOrganizerId(null)
        setRejectReason('')
        // Show success message
      }
    } catch (error) {
      console.error('Error rejecting organizer:', error)
    }
  }

  // Handler for exporting assignments
  const handleExportAssignments = async () => {
    try {
      setExporting(true)
      console.log('Starting export...')
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/operations/export/assignments`
      const token = localStorage.getItem('accessToken')
      
      console.log('API URL:', apiUrl)
      console.log('Token exists:', !!token)
      
      // Call API directly with fetch to get Excel response
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const excelBuffer = await response.arrayBuffer()
        console.log('Excel content length:', excelBuffer.byteLength)
        
        // Create and download Excel file
        const blob = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-assignments-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        // Show success message (you can add a toast notification here)
        console.log('Export successful!')
        alert('Export successful! Excel file with color coding downloaded.')
      } else {
        const errorText = await response.text()
        console.error('Export failed:', response.status, errorText)
        alert(`Export failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error exporting assignments:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(false)
    }
  }


  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user?.role)) {
        router.push('/dashboard')
        return
      }
      
      // Fetch dashboard data
      fetchDashboardData()
    }
  }, [isInitialized, isAuthenticated, user, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fetchWorkloadDetails = async (agentId: string) => {
    try {
      setWorkloadLoading(true)
      setSelectedAgentId(agentId)
      const response = await ApiService.getAgentWorkloadDetails(agentId)
      if (response.success) {
        setWorkloadDetails(response.data)
      }
    } catch (error) {
      console.error('Error fetching workload details:', error)
    } finally {
      setWorkloadLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OPS_HEAD': return 'Head of Operations'
      case 'OPS_SENIOR_AGENT': return 'Senior Agent'
      case 'OPS_AGENT': return 'Operations Agent'
      case 'SUPER_ADMIN': return 'Super Admin'
      default: return role
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPS_HEAD': return 'bg-red-100 text-red-800'
      case 'OPS_SENIOR_AGENT': return 'bg-blue-100 text-blue-800'
      case 'OPS_AGENT': return 'bg-green-100 text-green-800'
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
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


  const handleOrganizerVerification = async (organizerId: string, action: 'approve' | 'reject') => {
    try {
      const response = await ApiService.verifyOrganizer(organizerId, action, action === 'reject' ? 'Rejected by Operations team' : undefined)
      if (response.success) {
        // Refresh data
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Organizer verification error:', error)
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

  if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user?.role)) {
    return null // Will redirect
  }

  return (
    <ProtectedRoute requireRole={['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']}>
      <OperationsLayout>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage organizer verification and operational oversight</p>
        </div>
        <div className="flex space-x-3">
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Export Assignments - Only for Agents */}
          {user?.role === 'OPS_AGENT' && (
            <Button
              onClick={handleExportAssignments}
              disabled={exporting}
              variant="outline"
              className="flex items-center"
            >
              {exporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Export Excel with Colors
                </>
              )}
            </Button>
          )}

          {/* Analytics - Only Senior Agent and Head can access */}
          {(user?.role === 'OPS_SENIOR_AGENT' || user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
            <Button
              onClick={() => router.push('/department/operations/analytics')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          )}
          
          {/* User Management - Only Head can access */}
          {user?.role === 'OPS_HEAD' && (
            <Button
              onClick={() => router.push('/department/operations/users')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Show different stats based on user role */}
        {user?.role === 'OPS_HEAD' ? (
          <>
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Total Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Registered organizers
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
                    <p className="text-sm font-medium text-gray-600">Approved Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.approvedOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Verified organizers
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : user?.role === 'OPS_AGENT' ? (
          <>
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">My Pending Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Awaiting my review
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
                    <p className="text-sm font-medium text-gray-600">My Approved Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.approvedOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Approved by me
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
                    <p className="text-sm font-medium text-gray-600">My Rejected Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.rejectedOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Rejected by me
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <ThumbsDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Total Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Registered organizers
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Pending Organizers</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.pendingOrganizers || 0}</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Awaiting verification
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Approved Organizers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.approvedOrganizers || 0}</p>
                    <p className="text-sm text-gray-700">
                      Verified organizers
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers || 0}</p>
                <p className="text-sm text-gray-700">
                  {stats.activeMembers || 0} active members
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizer Status Distribution Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" />
              Organizer Status Distribution
            </CardTitle>
            <CardDescription>Current status breakdown of all organizers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approved', value: stats.approvedOrganizers, color: '#10B981' },
                      { name: 'Pending', value: stats.pendingOrganizers, color: '#F59E0B' },
                      { name: 'Rejected', value: stats.rejectedOrganizers, color: '#EF4444' }
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
                      { name: 'Approved', value: stats.approvedOrganizers, color: '#10B981' },
                      { name: 'Pending', value: stats.pendingOrganizers, color: '#F59E0B' },
                      { name: 'Rejected', value: stats.rejectedOrganizers, color: '#EF4444' }
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
                  { day: 'Mon', processed: 12, pending: 8 },
                  { day: 'Tue', processed: 15, pending: 6 },
                  { day: 'Wed', processed: 18, pending: 4 },
                  { day: 'Thu', processed: 14, pending: 7 },
                  { day: 'Fri', processed: 20, pending: 3 },
                  { day: 'Sat', processed: 8, pending: 5 },
                  { day: 'Sun', processed: 6, pending: 2 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="processed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Dashboard - Only for Head and Senior Agent */}
      {assignmentData && (user?.role === 'OPS_HEAD' || user?.role === 'OPS_SENIOR_AGENT') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Assignment Overview with Chart */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-700">
                <BarChart3 className="mr-2 h-5 w-5" />
                Assignment Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-indigo-900">{assignmentData.totalCapacity}</div>
                    <div className="text-xs text-indigo-600">Total Capacity</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-indigo-900">{assignmentData.totalWorkload}</div>
                    <div className="text-xs text-indigo-600">Current Workload</div>
                  </div>
                </div>
                
                {/* Utilization Chart */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-600">Utilization Rate</span>
                    <span className="text-lg font-bold text-indigo-900">{assignmentData.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        assignmentData.utilizationRate > 80 ? 'bg-red-500' : 
                        assignmentData.utilizationRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(assignmentData.utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Queue Status */}
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-indigo-900">{assignmentData.queueStatus.totalQueued}</div>
                  <div className="text-xs text-indigo-600">Queue Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Workload Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Agent Workload Distribution
              </CardTitle>
              <CardDescription>Current workload distribution across agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assignmentData.agents.map(agent => ({
                      name: agent.fullName.split(' ')[0], // First name only
                      workload: agent.workload,
                      capacity: agent.capacity,
                      utilization: agent.utilization
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'utilization' ? `${value}%` : value,
                          name === 'workload' ? 'Current Workload' :
                          name === 'capacity' ? 'Capacity' : 'Utilization %'
                        ]}
                      />
                      <Bar dataKey="workload" fill="#3B82F6" name="Current Workload" />
                      <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent List */}
                <div className="space-y-2">
                  {assignmentData.agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {agent.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{agent.fullName}</h4>
                          <p className="text-xs text-gray-600">{getRoleLabel(agent.role)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {agent.workload}/{agent.capacity}
                          </div>
                          <div className="text-xs text-gray-600">
                            {agent.utilization.toFixed(1)}%
                          </div>
                        </div>
                        <div className={`w-12 h-2 bg-gray-200 rounded-full`}>
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              agent.utilization > 80 ? 'bg-red-500' : 
                              agent.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(agent.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchWorkloadDetails(agent.id)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <Users className="mr-2 h-5 w-5" />
                              {workloadDetails?.agent?.fullName} - Workload Details
                            </DialogTitle>
                            <DialogDescription>
                              Detailed breakdown of current assignments and workload
                            </DialogDescription>
                          </DialogHeader>
                          {workloadLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2">Loading details...</span>
                            </div>
                          ) : workloadDetails ? (
                            <div className="space-y-6">
                              {/* Agent Info */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Agent Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-medium">{workloadDetails.agent.fullName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium">{workloadDetails.agent.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Role</p>
                                    <p className="font-medium">{getRoleLabel(workloadDetails.agent.role)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Last Activity</p>
                                    <p className="font-medium">{formatDate(workloadDetails.agent.lastActivity)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Workload Summary */}
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3">Workload Summary</h3>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{workloadDetails.workload.events}</div>
                                    <div className="text-sm text-gray-600">Events</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{workloadDetails.workload.organizers}</div>
                                    <div className="text-sm text-gray-600">Organizers</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{workloadDetails.workload.total}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{workloadDetails.utilization.toFixed(1)}%</div>
                                    <div className="text-sm text-gray-600">Utilization</div>
                                  </div>
                                </div>
                              </div>

                              {/* Events Details */}
                              {workloadDetails.details.events.length > 0 && (
                                <div>
                                  <h3 className="font-semibold text-lg mb-3">Assigned Events ({workloadDetails.details.events.length})</h3>
                                  <div className="space-y-3">
                                    {workloadDetails.details.events.map((event: any) => (
                                      <div key={event.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                              {event.eventDate && (
                                                <div className="flex items-center">
                                                  <Calendar className="h-4 w-4 mr-1" />
                                                  {new Date(event.eventDate).toLocaleDateString()}
                                                </div>
                                              )}
                                              {event.location && (
                                                <div className="flex items-center">
                                                  <MapPin className="h-4 w-4 mr-1" />
                                                  {event.location}
                                                </div>
                                              )}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                              Created by: {event.creator?.fullName || 'Unknown'}
                                            </div>
                                          </div>
                                          <div className="text-right text-sm text-gray-500">
                                            <div>Assigned: {formatDate(event.assignedAt)}</div>
                                            <div>Created: {formatDate(event.createdAt)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Organizers Details */}
                              {workloadDetails.details.organizers.length > 0 && (
                                <div>
                                  <h3 className="font-semibold text-lg mb-3">Assigned Organizers ({workloadDetails.details.organizers.length})</h3>
                                  <div className="space-y-3">
                                    {workloadDetails.details.organizers.map((organizer: any) => (
                                      <div key={organizer.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{organizer.fullName}</h4>
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                              <div className="flex items-center">
                                                <Mail className="h-4 w-4 mr-1" />
                                                {organizer.email}
                                              </div>
                                              {organizer.phoneNumber && (
                                                <div className="flex items-center">
                                                  <Phone className="h-4 w-4 mr-1" />
                                                  {organizer.phoneNumber}
                                                </div>
                                              )}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                              Business: {organizer.businessName || 'N/A'} | Type: {organizer.organizerType || 'N/A'}
                                            </div>
                                          </div>
                                          <div className="text-right text-sm text-gray-500">
                                            <div>Assigned: {formatDate(organizer.assignedAt)}</div>
                                            <div>Created: {formatDate(organizer.createdAt)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {workloadDetails.details.events.length === 0 && workloadDetails.details.organizers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                  <p>No current assignments</p>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Real-time Activity
              </CardTitle>
              <CardDescription>Assignment activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity Chart */}
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { time: '00:00', organizers: 1 },
                      { time: '04:00', organizers: 0 },
                      { time: '08:00', organizers: 3 },
                      { time: '12:00', organizers: 4 },
                      { time: '16:00', organizers: 2 },
                      { time: '20:00', organizers: 1 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="organizers" stroke="#10B981" strokeWidth={2} name="Organizers" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
                  {assignmentData.recentAssignments.organizers?.slice(0, 3).map((organizer) => (
                    <div key={organizer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">{organizer.fullName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(organizer.assignedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {assignmentData.recentAssignments.organizers?.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">No recent organizer activity</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OPS_AGENT Own Workload Section */}
      {user?.role === 'OPS_AGENT' && assignmentData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-700">
                <UserCheck className="mr-2 h-5 w-5" />
                My Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">Current Tasks</span>
                  <span className="text-lg font-bold text-green-900">
                    {assignmentData.agents.find(agent => agent.id === user?.id)?.workload || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">Capacity</span>
                  <span className="text-lg font-bold text-green-900">
                    {assignmentData.agents.find(agent => agent.id === user?.id)?.capacity || 20}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">Utilization</span>
                  <span className="text-lg font-bold text-green-900">
                    {assignmentData.agents.find(agent => agent.id === user?.id)?.utilization.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (assignmentData.agents.find(agent => agent.id === user?.id)?.utilization || 0) > 80 ? 'bg-red-500' : 
                      (assignmentData.agents.find(agent => agent.id === user?.id)?.utilization || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(assignmentData.agents.find(agent => agent.id === user?.id)?.utilization || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                My Recent Assignments
              </CardTitle>
              <CardDescription>Your recent assignment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Show organizers for agents, events for heads/seniors */}
                {user?.role === 'OPS_AGENT' ? (
                  // Agent view - show organizers with detailed info
                  assignmentData.recentAssignments.organizers?.slice(0, 5).map((organizer) => (
                    <div key={organizer.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-sm font-semibold text-gray-900">{organizer.fullName}</p>
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Organizer</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs text-gray-500">by {organizer.assigner?.fullName || 'System'}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(organizer.assignedAt).toLocaleDateString()} {new Date(organizer.assignedAt).toLocaleTimeString()}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              organizer.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              organizer.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              organizer.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {organizer.verificationStatus === 'APPROVED' ? '✓ Approved' :
                               organizer.verificationStatus === 'PENDING' ? '⏳ Pending' :
                               organizer.verificationStatus === 'REJECTED' ? '✗ Rejected' :
                               organizer.verificationStatus}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrganizerDetails(organizer.id)}
                              className="text-xs h-7"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            
                            {organizer.verificationStatus === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveOrganizer(organizer.id)}
                                  className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectOrganizer(organizer.id)}
                                  className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Head/Senior view - show organizers (events are now free)
                  assignmentData.recentAssignments.organizers
                    ?.slice(0, 3)
                    .map((organizer) => (
                      <div key={organizer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{organizer.fullName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Organizer</span>
                            <span className="text-xs text-gray-500">by {organizer.assigner?.fullName || 'System'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(organizer.assignedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(organizer.assignedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                )}
                
                {/* No assignments message */}
                {assignmentData.recentAssignments.organizers?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent organizer assignments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Performance Analytics */}
      {(user?.role === 'OPS_SENIOR_AGENT' || user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && agentAnalytics.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Agent Performance Analytics (7 days)
              </CardTitle>
              <CardDescription>Individual agent performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Comparison Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentAnalytics.map(agent => ({
                      name: agent.agentName.split(' ')[0],
                      completionRate: agent.performance.completionRate,
                      qualityScore: agent.performance.qualityScore * 10, // Scale to 100
                      avgProcessingTime: agent.performance.averageProcessingTime
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'avgProcessingTime' ? `${value}m` : 
                          name === 'qualityScore' ? `${(value as number)/10}/10` : `${value}%`,
                          name === 'completionRate' ? 'Completion Rate' :
                          name === 'qualityScore' ? 'Quality Score' : 'Avg Processing Time'
                        ]}
                      />
                      <Bar dataKey="completionRate" fill="#10B981" name="Completion Rate" />
                      <Bar dataKey="qualityScore" fill="#3B82F6" name="Quality Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agentAnalytics.map((agent) => (
                    <div key={agent.agentId} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{agent.agentName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          agent.workload.utilization > 80 ? 'bg-red-100 text-red-800' :
                          agent.workload.utilization > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {agent.workload.utilization.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completion Rate</span>
                          <span className="font-medium">{agent.performance.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Processing Time</span>
                          <span className="font-medium">{agent.performance.averageProcessingTime.toFixed(1)}m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quality Score</span>
                          <span className="font-medium">{agent.performance.qualityScore.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-medium">{agent.trends.assignmentsThisWeek} assignments</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Workload: {agent.workload.currentWorkload}/{agent.workload.capacity}</span>
                          <span>Reassignments: {agent.performance.reassignments}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Operations Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Operations Team
            </CardTitle>
            <CardDescription>Operations team members and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.filter(member => member.role !== 'OPS_HEAD').map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {member.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.fullName}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(member.position)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Last active: {formatDate(member.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-orange-500" />
                          {member.openTickets + member.inProgressTickets} active
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {member.completedThisWeek} this week
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common operations tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Verify Organizers - All Operations roles can access */}
              <Button
                onClick={() => router.push('/department/operations/organizers')}
                className="w-full justify-start"
                variant="outline"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Organizers
              </Button>
              
              {/* View Analytics - Only Senior Agent and Head can access */}
              {(user?.role === 'OPS_SENIOR_AGENT' || user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
                <Button
                  onClick={() => router.push('/department/operations/analytics')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              )}
              

              {/* Manage Users - Only Head can access */}
              {user?.role === 'OPS_HEAD' && (
                <Button
                  onClick={() => router.push('/department/operations/users')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              )}

              {/* Real-time Notifications - Senior Agent and Head can access */}
              {(user?.role === 'OPS_SENIOR_AGENT' || user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Real-time Status</span>
                    <Bell className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Active Connections:</span>
                      <span className="font-medium">{notificationStats?.activeConnections || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Connections:</span>
                      <span className="font-medium">{notificationStats?.totalConnections || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Rooms:</span>
                      <span className="font-medium">{notificationStats?.rooms?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Organizers - Only show for agents, not OPS_HEAD */}
      {user?.role !== 'OPS_HEAD' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                Pending Organizers
              </CardTitle>
              <CardDescription>Organizers awaiting verification</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrganizers.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending organizers</p>
              ) : (
                pendingOrganizers.map((organizer) => (
                  <div key={organizer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{organizer.fullName}</h4>
                      <p className="text-xs text-gray-600">{organizer.businessName}</p>
                      <p className="text-xs text-gray-500">{organizer.organizerType} • {formatDate(organizer.createdAt)}</p>
                    </div>
                    <div className="flex space-x-1">
                      {/* Approve - All Operations roles can approve */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOrganizerVerification(organizer.id, 'approve')}
                        className="h-8 w-8 p-0"
                      >
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                      </Button>
                      
                      {/* Reject - Only Senior Agent and Head can reject */}
                      {(user?.role === 'OPS_SENIOR_AGENT' || user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOrganizerVerification(organizer.id, 'reject')}
                          className="h-8 w-8 p-0"
                        >
                          <ThumbsDown className="h-3 w-3 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Organizer Details Dialog */}
      <Dialog open={organizerDetailsOpen} onOpenChange={setOrganizerDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organizer Details</DialogTitle>
            <DialogDescription>
              Complete information about the organizer
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrganizer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedOrganizer.fullName}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrganizer.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrganizer.phoneNumber || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrganizer.address || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Business Name:</span> {selectedOrganizer.businessName || 'N/A'}</p>
                    <p><span className="font-medium">Business Address:</span> {selectedOrganizer.businessAddress || 'N/A'}</p>
                    <p><span className="font-medium">Business Phone:</span> {selectedOrganizer.businessPhone || 'N/A'}</p>
                    <p><span className="font-medium">Organizer Type:</span> {selectedOrganizer.organizerType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Portfolio & Social Media */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Portfolio & Social Media</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Portfolio:</span> {selectedOrganizer.portfolio || 'N/A'}</p>
                  <p><span className="font-medium">Social Media:</span> {selectedOrganizer.socialMedia || 'N/A'}</p>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Status Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Verification Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      selectedOrganizer.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      selectedOrganizer.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrganizer.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrganizer.verificationStatus}
                    </span>
                  </p>
                  {selectedOrganizer.rejectedReason && (
                    <p><span className="font-medium">Rejection Reason:</span> 
                      <span className="ml-2 text-red-600">{selectedOrganizer.rejectedReason}</span>
                    </p>
                  )}
                  <p><span className="font-medium">Created At:</span> {new Date(selectedOrganizer.createdAt).toLocaleString()}</p>
                  {selectedOrganizer.verifiedAt && (
                    <p><span className="font-medium">Verified At:</span> {new Date(selectedOrganizer.verifiedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setOrganizerDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedOrganizer.verificationStatus === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => handleApproveOrganizer(selectedOrganizer.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectOrganizer(selectedOrganizer.id)}
                      variant="destructive"
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Organizer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this organizer application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRejection}
              disabled={!rejectReason.trim()}
              variant="destructive"
            >
              Reject Organizer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        </div>
      </OperationsLayout>
    </ProtectedRoute>
  )
}