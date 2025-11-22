'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Eye,
  UserPlus
} from 'lucide-react'

interface Team {
  id: string
  name: string
  description: string
  categories: string[]
  memberCount: number
  activeTickets: number
}

interface TeamMember {
  id: string
  fullName: string
  email: string
  role: string
  userPosition: string
  lastActivity: string
}

interface TeamAnalytics {
  team: {
    id: string
    name: string
    description: string
    categories: string[]
  }
  metrics: {
    totalTickets: number
    resolvedTickets: number
    openTickets: number
    inProgressTickets: number
    resolutionRate: number
  }
  priorityBreakdown: Record<string, number>
  memberPerformance: Array<{
    id: string
    name: string
    role: string
    totalTickets: number
    resolvedTickets: number
    resolutionRate: number
  }>
}

export default function TeamsManagement() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'analytics'>('overview')
  
  // Add member dialog state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [addingMember, setAddingMember] = useState(false)

  // Add team configuration dialog state
  const [isAddConfigOpen, setIsAddConfigOpen] = useState(false)
  const [newConfig, setNewConfig] = useState({
    teamId: '',
    teamName: '',
    description: '',
    categories: [] as string[]
  })
  const [departments, setDepartments] = useState<any[]>([])
  const [availableCategories] = useState([
    'TECHNICAL_ISSUE',
    'PAYMENT_ISSUE', 
    'GENERAL_INQUIRY',
    'EVENT_MANAGEMENT',
    'MARKETING_INQUIRY',
    'BRAND_MANAGEMENT',
    'PROMOTIONAL_SUPPORT',
    'CUSTOMER_SUPPORT',
    'ORGANIZER_SUPPORT',
    'FINANCE_QUERY',
    'HR_SUPPORT',
    'EMPLOYEE_QUERY',
    'PAYROLL_ISSUE'
  ])
  const [addingConfig, setAddingConfig] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTeams()
      fetchDepartments()
    }
  }, [isAuthenticated, user])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getTeams()
      
      if (response.success) {
        setTeams(response.data)
      } else {
        setError(response.message || 'Failed to fetch teams')
      }
    } catch (err) {
      setError('Failed to fetch teams')
      console.error('Teams error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await ApiService.getDepartments()
      
      if (response.success) {
        setDepartments(response.data)
      } else {
        console.error('Failed to fetch departments:', response.message)
      }
    } catch (err) {
      console.error('Departments error:', err)
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await ApiService.getTeamMembers(teamId)
      
      if (response.success) {
        setTeamMembers(response.data)
      } else {
        setError(response.message || 'Failed to fetch team members')
      }
    } catch (err) {
      setError('Failed to fetch team members')
      console.error('Team members error:', err)
    }
  }

  const fetchTeamAnalytics = async (teamId: string) => {
    try {
      const response = await ApiService.getTeamAnalytics(teamId)
      
      if (response.success) {
        setTeamAnalytics(response.data)
      } else {
        setError(response.message || 'Failed to fetch team analytics')
      }
    } catch (err) {
      setError('Failed to fetch team analytics')
      console.error('Team analytics error:', err)
    }
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    setActiveTab('overview')
    fetchTeamMembers(team.id)
    fetchTeamAnalytics(team.id)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PAYMENT_ISSUE':
      case 'FINANCE_QUERY':
        return 'text-red-600 bg-red-100'
      case 'TECHNICAL_ISSUE':
        return 'text-blue-600 bg-blue-100'
      case 'CUSTOMER_SUPPORT':
      case 'GENERAL_INQUIRY':
      case 'EVENT_MANAGEMENT':
      case 'ORGANIZER_SUPPORT':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CS_HEAD':
        return 'text-purple-600 bg-purple-100'
      case 'CS_SENIOR_AGENT':
        return 'text-orange-600 bg-orange-100'
      case 'CS_AGENT':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await ApiService.getAvailableUsers()
      if (response.success) {
        setAvailableUsers(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err)
    }
  }

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) return

    try {
      setAddingMember(true)
      const response = await ApiService.addTeamMember(selectedTeam.id, selectedUserId, selectedRole)
      
      if (response.success) {
        // Refresh team members
        await fetchTeamMembers(selectedTeam.id)
        setIsAddMemberOpen(false)
        setSelectedUserId('')
        setSelectedRole('MEMBER')
      } else {
        setError(response.message || 'Failed to add member')
      }
    } catch (err) {
      setError('Failed to add member')
      console.error('Add member error:', err)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return

    try {
      const response = await ApiService.removeTeamMember(selectedTeam.id, userId)
      
      if (response.success) {
        // Refresh team members
        await fetchTeamMembers(selectedTeam.id)
      } else {
        setError(response.message || 'Failed to remove member')
      }
    } catch (err) {
      setError('Failed to remove member')
      console.error('Remove member error:', err)
    }
  }

  const handleAddConfiguration = async () => {
    if (!newConfig.teamId || !newConfig.teamName || !newConfig.description || newConfig.categories.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setAddingConfig(true)
      const response = await ApiService.createTeamConfiguration(newConfig)
      
      if (response.success) {
        // Refresh teams list
        await fetchTeams()
        setIsAddConfigOpen(false)
        setNewConfig({
          teamId: '',
          teamName: '',
          description: '',
          categories: []
        })
      } else {
        setError(response.message || 'Failed to create team configuration')
      }
    } catch (err) {
      setError('Failed to create team configuration')
      console.error('Add configuration error:', err)
    } finally {
      setAddingConfig(false)
    }
  }

  const toggleCategory = (category: string) => {
    setNewConfig(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleDepartmentSelect = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId)
    if (department) {
      setNewConfig(prev => ({
        ...prev,
        teamId: department.name.toUpperCase().replace(/\s+/g, '_'),
        teamName: `Team ${department.name} - Support`,
        description: department.description || `Support team for ${department.name} department`
      }))
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

  if (user.role !== 'SUPER_ADMIN') {
    return null // Will redirect
  }

  return (
    <ProtectedRoute requireRole={['SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-1">Smart category-based team assignment and management</p>
          </div>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
          >
            Back to Admin Dashboard
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={fetchTeams} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Teams
                    </CardTitle>
                    <CardDescription>Category-based team assignments</CardDescription>
                  </div>
                  <Dialog open={isAddConfigOpen} onOpenChange={setIsAddConfigOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Add Team Config
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">Add Team Configuration</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Create a new team configuration with categories for auto-assignment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 text-gray-900">
                        <div>
                          <Label htmlFor="department" className="text-gray-900">Select Department</Label>
                          <Select onValueChange={handleDepartmentSelect}>
                            <SelectTrigger className="bg-white text-gray-900">
                              <SelectValue placeholder="Choose a department" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id} className="text-gray-900">
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="teamId" className="text-gray-900">Team ID (Auto-generated)</Label>
                          <Input
                            id="teamId"
                            value={newConfig.teamId}
                            onChange={(e) => setNewConfig(prev => ({ ...prev, teamId: e.target.value }))}
                            placeholder="e.g., SALES_SUPPORT"
                            readOnly
                            className="bg-gray-50 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="teamName" className="text-gray-900">Team Name (Auto-generated)</Label>
                          <Input
                            id="teamName"
                            value={newConfig.teamName}
                            onChange={(e) => setNewConfig(prev => ({ ...prev, teamName: e.target.value }))}
                            placeholder="e.g., Team Sales - Business Development"
                            readOnly
                            className="bg-gray-50 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-gray-900">Description (Auto-generated)</Label>
                          <Input
                            id="description"
                            value={newConfig.description}
                            onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of team responsibilities"
                            readOnly
                            className="bg-gray-50 text-gray-900"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900">Categories</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                            {availableCategories.map((category) => (
                              <label key={category} className="flex items-center space-x-2 text-gray-900">
                                <input
                                  type="checkbox"
                                  checked={newConfig.categories.includes(category)}
                                  onChange={() => toggleCategory(category)}
                                  className="rounded"
                                />
                                <span className="text-sm text-gray-900">{category}</span>
                              </label>
                            ))}
                          </div>
                          {newConfig.categories.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Selected: {newConfig.categories.join(', ')}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddConfigOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddConfiguration} 
                            disabled={addingConfig}
                          >
                            {addingConfig ? 'Creating...' : 'Create Team Config'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => handleTeamSelect(team)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{team.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{team.memberCount} members</span>
                          <span className="text-sm text-gray-500">{team.activeTickets} active</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {team.categories.map((category) => (
                          <span
                            key={category}
                            className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}
                          >
                            {category.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Details */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>{selectedTeam.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setActiveTab('overview')}
                        variant={activeTab === 'overview' ? 'primary' : 'outline'}
                        size="sm"
                      >
                        Overview
                      </Button>
                      <Button
                        onClick={() => setActiveTab('members')}
                        variant={activeTab === 'members' ? 'primary' : 'outline'}
                        size="sm"
                      >
                        Members
                      </Button>
                      <Button
                        onClick={() => setActiveTab('analytics')}
                        variant={activeTab === 'analytics' ? 'primary' : 'outline'}
                        size="sm"
                      >
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
                          <div className="text-sm text-gray-500">Total Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedTeam.activeTickets}</div>
                          <div className="text-sm text-gray-500">Active Tickets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedTeam.categories.length}</div>
                          <div className="text-sm text-gray-500">Categories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {teamAnalytics ? `${teamAnalytics.metrics.resolutionRate}%` : '0%'}
                          </div>
                          <div className="text-sm text-gray-500">Resolution Rate</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'members' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Team Members</h3>
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => {
                                fetchAvailableUsers()
                                setIsAddMemberOpen(true)
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900">Add Member to Team</DialogTitle>
                              <DialogDescription className="text-gray-600">
                                Select a user to add to {selectedTeam?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 text-gray-900">
                              <div>
                                <Label htmlFor="user-select" className="text-gray-900">Select User</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                  <SelectTrigger className="bg-white text-gray-900">
                                    <SelectValue placeholder="Choose a user" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    {availableUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id} className="text-gray-900">
                                        {user.fullName} ({user.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="role-select" className="text-gray-900">Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                  <SelectTrigger className="bg-white text-gray-900">
                                    <SelectValue placeholder="Choose a role" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="MEMBER" className="text-gray-900">Member</SelectItem>
                                    <SelectItem value="LEAD" className="text-gray-900">Lead</SelectItem>
                                    <SelectItem value="ADMIN" className="text-gray-900">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsAddMemberOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAddMember}
                                  disabled={addingMember || !selectedUserId}
                                >
                                  {addingMember ? 'Adding...' : 'Add Member'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                {member.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{member.fullName}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                                {member.role.replace('_', ' ')}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && teamAnalytics && (
                    <div className="space-y-6">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{teamAnalytics.metrics.totalTickets}</div>
                          <div className="text-sm text-gray-500">Total Tickets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{teamAnalytics.metrics.resolvedTickets}</div>
                          <div className="text-sm text-gray-500">Resolved</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{teamAnalytics.metrics.openTickets}</div>
                          <div className="text-sm text-gray-500">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{teamAnalytics.metrics.resolutionRate}%</div>
                          <div className="text-sm text-gray-500">Resolution Rate</div>
                        </div>
                      </div>

                      {/* Member Performance */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Member Performance</h3>
                        <div className="space-y-3">
                          {teamAnalytics.memberPerformance.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-gray-500">{member.role.replace('_', ' ')}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold">{member.totalTickets}</div>
                                  <div className="text-xs text-gray-500">Total</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{member.resolvedTickets}</div>
                                  <div className="text-xs text-gray-500">Resolved</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-purple-600">{member.resolutionRate}%</div>
                                  <div className="text-xs text-gray-500">Rate</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team</h3>
                  <p className="text-gray-500">Choose a team from the list to view details and analytics</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
