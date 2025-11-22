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
  DollarSign, 
  Ticket, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calculator,
  CreditCard,
  Users
} from 'lucide-react'

interface DepartmentStats {
  totalMembers: number
  activeMembers: number
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  overdueTickets: number
  completionRate: number
  overdueRate: number
  totalRevenue: number
  pendingPayments: number
  completedSettlements: number
  totalUsers?: number
  totalOrganizers?: number
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

export default function FinanceDashboard() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DepartmentStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    overdueTickets: 0,
    completionRate: 0,
    overdueRate: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedSettlements: 0,
    totalUsers: 0,
    totalOrganizers: 0
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real data from API
      const response = await ApiService.getDepartmentDashboard('FINANCE')

      if (response.success && response.data) {
        const { metrics, teamMembers: apiTeamMembers, recentActivities } = response.data

        // Map API metrics to local state
        setStats({
          totalMembers: metrics.teamSize || 0,
          activeMembers: metrics.teamSize || 0, // Assuming all team members are active
          totalTickets: 0, // Will be added when ticket system is implemented
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          overdueTickets: 0,
          completionRate: 0,
          overdueRate: 0,
          totalRevenue: 0, // Will be added when payment system is implemented
          pendingPayments: 0,
          completedSettlements: 0,
          totalUsers: metrics.totalUsers || 0, // Mapped
          totalOrganizers: metrics.totalOrganizers || 0 // Mapped
        })

        // Map API team members to local state
        const mappedTeamMembers = apiTeamMembers.map((member: any) => ({
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          role: member.role,
          position: member.userPosition,
          lastActivity: member.lastActivity,
          openTickets: 0, // Will be added when ticket system is implemented
          inProgressTickets: 0,
          completedThisWeek: 0
        }))

        setTeamMembers(mappedTeamMembers)
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_SENIOR_AGENT', 'FINANCE_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
      
      // Fetch dashboard data
      fetchDashboardData()
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'FINANCE_HEAD': return 'Head'
      case 'FINANCE_SENIOR_AGENT': return 'Senior Agent'
      case 'FINANCE_AGENT': return 'Agent'
      default: return role
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEAD': return 'bg-purple-100 text-purple-800'
      case 'SENIOR_AGENT': return 'bg-blue-100 text-blue-800'
      case 'AGENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (!['SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_SENIOR_AGENT', 'FINANCE_AGENT'].includes(user.role)) {
    return null // Will redirect
  }

  return (
    <ProtectedRoute requireRole={['SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_SENIOR_AGENT', 'FINANCE_AGENT']}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage financial operations and payment processing</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => router.push('/department/finance/tickets')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Ticket className="mr-2 h-4 w-4" />
            View Tickets
          </Button>
          <Button
            onClick={() => router.push('/department/finance/team')}
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Team
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Users</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalUsers || 0}</p>
                <p className="text-xs text-green-700 mt-1">
                  {stats.totalOrganizers || 0} organizers
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Team Size</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalMembers}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {stats.activeMembers} active members
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Department</p>
                <p className="text-2xl font-bold text-yellow-900">FIN</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Finance
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completionRate}%</p>
                <p className="text-xs text-purple-700 mt-1">
                  {stats.resolvedTickets} of {stats.totalTickets} tickets
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>Individual team member workload and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
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
              <BarChart3 className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/department/finance/tickets?status=open')}
                className="w-full justify-start"
                variant="outline"
              >
                <Ticket className="mr-2 h-4 w-4" />
                View Open Tickets
              </Button>
              <Button
                onClick={() => router.push('/department/finance/payments')}
                className="w-full justify-start"
                variant="outline"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payments
              </Button>
              <Button
                onClick={() => router.push('/department/finance/settlements')}
                className="w-full justify-start"
                variant="outline"
              >
                <Calculator className="mr-2 h-4 w-4" />
                View Settlements
              </Button>
              <Button
                onClick={() => router.push('/department/finance/team')}
                className="w-full justify-start"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Team Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates and changes in the department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Settlement #FIN-001 completed</p>
                <p className="text-xs text-green-700">by Jennifer Lee • 30 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Ticket className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">New payment ticket #FIN-002 created</p>
                <p className="text-xs text-blue-700">by Michael Brown • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Payment #FIN-003 requires review</p>
                <p className="text-xs text-yellow-700">assigned to Sarah Davis • 4 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </ProtectedRoute>
  )
}
