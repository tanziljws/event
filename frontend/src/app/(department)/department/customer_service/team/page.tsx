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
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck
} from 'lucide-react'

interface TeamMember {
  id: string
  fullName: string
  email: string
  role: string
  position: string
  lastActivity: string
  employeeId: string
  managerId?: string
}

export default function CustomerServiceTeam() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch team members from API
      const response = await ApiService.getDepartmentMembers('CUSTOMER_SERVICE')

      if (response.success && response.data) {
        setTeamMembers(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch team members')
      }
    } catch (err) {
      setError('Failed to fetch team members')
      console.error('Team error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTeamMembers()
    }
  }, [isAuthenticated, user])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'CS_HEAD': return 'Head of Customer Service'
      case 'CS_AGENT': return 'Agent'
      default: return role
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'HEAD': return 'Head'
      case 'AGENT': return 'Agent'
      default: return position
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CS_HEAD': return 'bg-purple-100 text-purple-800'
      case 'CS_AGENT': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const handleAddMember = () => {
    router.push('/admin/departments')
  }

  const handleEditMember = (memberId: string) => {
    router.push(`/admin/departments?edit=${memberId}`)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return
    }

    try {
      const response = await ApiService.removeDepartmentMember('CUSTOMER_SERVICE', memberId)
      if (response.success) {
        await fetchTeamMembers()
      } else {
        alert('Failed to remove member: ' + response.message)
      }
    } catch (err) {
      alert('Failed to remove member')
      console.error('Remove member error:', err)
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Service Team</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their roles</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => router.push('/department/customer_service/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            {(user.role === 'SUPER_ADMIN' || user.role === 'CS_HEAD') && (
              <Button
                onClick={handleAddMember}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Heads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.role === 'CS_HEAD').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Agents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamMembers.filter(m => m.role.includes('AGENT')).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your customer service team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team members found</p>
                <Button
                  onClick={handleAddMember}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.fullName}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {member.employeeId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Last active: {formatDate(member.lastActivity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Position: {getPositionLabel(member.position)}
                        </p>
                      </div>
                      
                      {(user.role === 'SUPER_ADMIN' || user.role === 'CS_HEAD') && (
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => handleEditMember(member.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleRemoveMember(member.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
