'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { 
  Users, 
  Search, 
  Filter,
  UserPlus,
  RefreshCw,
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  Eye
} from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: string
  department: string
  userPosition?: string
  employeeId?: string
  emailVerified: boolean
  lastActivity?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export default function UsersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'OPS_HEAD'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && ['SUPER_ADMIN', 'OPS_HEAD'].includes(user.role)) {
      fetchUsers()
    }
  }, [isAuthenticated, user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch operations team members only
      const response = await ApiService.getOperationsTeam()
      
      if (response.success && response.data) {
        const operationsUsers = response.data.users || []
        setUsers(operationsUsers)
      } else {
        setError('Failed to fetch operations team')
      }
    } catch (err) {
      setError('Error fetching operations team')
      console.error('Error fetching operations team:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OPS_HEAD': return 'bg-red-100 text-red-800'
      case 'OPS_SENIOR_AGENT': return 'bg-blue-100 text-blue-800'
      case 'OPS_AGENT': return 'bg-green-100 text-green-800'
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
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
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-gray-600">Manage operations team members</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agents</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'OPS_AGENT').length}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Senior Agents</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'OPS_SENIOR_AGENT').length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ALL">All Roles</option>
                  <option value="OPS_HEAD">Head of Operations</option>
                  <option value="OPS_SENIOR_AGENT">Senior Agent</option>
                  <option value="OPS_AGENT">Operations Agent</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No users found</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-lg font-semibold text-blue-600">
                          {user.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{user.fullName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.userPosition && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {user.userPosition}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-600">
                      <p>Employee ID: {user.employeeId || 'N/A'}</p>
                      <p>Created: {formatDate(user.createdAt)}</p>
                      {user.lastActivity && (
                        <p>Last activity: {formatDate(user.lastActivity)}</p>
                      )}
                      <div className="flex items-center justify-end mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/department/operations/agent/${user.id}/dashboard`)}
                          className="text-xs h-7"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </OperationsLayout>
  )
}