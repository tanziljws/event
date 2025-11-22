'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ApiService } from '@/lib/api'
import { 
  Users, 
  Building2, 
  UserCheck, 
  UserPlus,
  Settings,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Save
} from 'lucide-react'

interface DepartmentStructure {
  [key: string]: {
    head: {
      id: string
      fullName: string
      email: string
      userPosition: string
    } | null
    agents: Array<{
      id: string
      fullName: string
      email: string
      userPosition: string
      managerId: string | null
    }>
  }
}

interface AvailableUser {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  createdAt: string
}

export default function AdminDepartments() {
  const [structure, setStructure] = useState<DepartmentStructure | null>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Management states
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [editingMember, setEditingMember] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Create new staff states
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newStaffData, setNewStaffData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    lastEducation: ''
  })

  // Add department states
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    headId: ''
  })
  const [addingDepartment, setAddingDepartment] = useState(false)
  
  // Edit department states
  const [editingDepartment, setEditingDepartment] = useState<any>(null)
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false)
  const [editDepartmentData, setEditDepartmentData] = useState({
    name: '',
    description: '',
    headId: ''
  })
  
  // View details states
  const [viewingDepartment, setViewingDepartment] = useState<any>(null)
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false)
  
  // Delete department states
  const [deletingDepartment, setDeletingDepartment] = useState<string | null>(null)

  const fetchDepartmentStructure = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getDepartmentStructure()
      
      if (response.success) {
        setStructure(response.data)
      } else {
        setError('Gagal memuat struktur departemen')
      }
    } catch (err) {
      setError('Gagal memuat struktur departemen')
      console.error('Department structure error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await ApiService.getDepartments()
      if (response.success) {
        setDepartments(response.data)
      }
    } catch (error) {
      console.error('Departments error:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDepartmentStructure()
    setRefreshing(false)
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await ApiService.getAvailableUsers()
      if (response.success) {
        setAvailableUsers(response.data)
      }
    } catch (error) {
      console.error('Available users error:', error)
    }
  }

  const handleAddMember = async () => {
    try {
      if (!selectedDepartment || !selectedRole || !selectedPosition) {
        alert('Please fill in all required fields')
        return
      }

      if (isCreatingNew) {
        // Create new staff
        if (!newStaffData.fullName || !newStaffData.email) {
          alert('Please fill in name and email for new staff')
          return
        }

        const response = await ApiService.createNewStaff(selectedDepartment, {
          ...newStaffData,
          role: selectedRole,
          userPosition: selectedPosition,
          managerId: selectedManager === 'none' ? undefined : selectedManager
        })

        if (response.success) {
          alert('New staff created and added successfully!')
          setShowAddMemberDialog(false)
          resetAddMemberForm()
          fetchDepartmentStructure()
          fetchAvailableUsers()
        } else {
          alert(response.message || 'Failed to create new staff')
        }
      } else {
        // Add existing user
        if (!selectedUser) {
          alert('Please select a user')
          return
        }

        const response = await ApiService.addDepartmentMember(selectedDepartment, {
          userId: selectedUser,
          role: selectedRole,
          userPosition: selectedPosition,
          managerId: selectedManager === 'none' ? undefined : selectedManager
        })

        if (response.success) {
          alert('Member added successfully!')
          setShowAddMemberDialog(false)
          resetAddMemberForm()
          fetchDepartmentStructure()
          fetchAvailableUsers()
        } else {
          alert(response.message || 'Failed to add member')
        }
      }
    } catch (error: any) {
      console.error('Add member error:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to add member. Please try again.')
      }
    }
  }

  const handleRemoveMember = async (department: string, userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from ${department}?`)) {
      return
    }

    try {
      const response = await ApiService.removeDepartmentMember(department, userId)
      if (response.success) {
        alert('Member removed successfully!')
        fetchDepartmentStructure()
        fetchAvailableUsers()
      } else {
        alert(response.message || 'Failed to remove member')
      }
    } catch (error: any) {
      console.error('Remove member error:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to remove member. Please try again.')
      }
    }
  }

  const handleEditMember = async () => {
    try {
      if (!editingMember || !selectedRole || !selectedPosition) {
        alert('Please fill in all required fields')
        return
      }

      const response = await ApiService.updateDepartmentMember(editingMember.department, editingMember.id, {
        role: selectedRole,
        userPosition: selectedPosition,
        managerId: selectedManager === 'none' ? undefined : selectedManager
      })

      if (response.success) {
        alert('Member updated successfully!')
        setShowEditDialog(false)
        setEditingMember(null)
        resetEditForm()
        fetchDepartmentStructure()
      } else {
        alert(response.message || 'Failed to update member')
      }
    } catch (error: any) {
      console.error('Update member error:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to update member. Please try again.')
      }
    }
  }

  const resetAddMemberForm = () => {
    setSelectedDepartment('')
    setSelectedUser('')
    setSelectedRole('')
    setSelectedPosition('')
    setSelectedManager('')
    setIsCreatingNew(false)
    setNewStaffData({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      lastEducation: ''
    })
  }

  const resetEditForm = () => {
    setSelectedRole('')
    setSelectedPosition('')
    setSelectedManager('')
  }

  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      alert('Please enter department name')
      return
    }

    // Check if department name already exists
    const existingDepartment = departments.find(d => d.name.toLowerCase() === newDepartment.name.toLowerCase())
    if (existingDepartment) {
      alert(`Department "${newDepartment.name}" already exists. Please choose a different name.`)
      return
    }

    try {
      setAddingDepartment(true)
      // Prepare data for API call
      const departmentData = {
        name: newDepartment.name,
        description: newDepartment.description || undefined,
        headId: newDepartment.headId || undefined
      }
      
      const response = await ApiService.addDepartment(departmentData)
      
      if (response.success) {
        alert('Department created successfully!')
        setNewDepartment({ name: '', description: '', headId: '' })
        // Refresh department structure
        await fetchDepartmentStructure()
        await fetchDepartments()
        await fetchAvailableUsers()
      } else {
        alert(response.message || 'Failed to create department')
      }
    } catch (error: any) {
      console.error('Add department error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to create department. Please try again.')
      }
    } finally {
      setAddingDepartment(false)
    }
  }

  const handleViewDetails = (departmentName: string) => {
    const department = structure?.[departmentName as keyof typeof structure]
    if (department) {
      setViewingDepartment({
        name: departmentName,
        ...department
      })
      setShowViewDetailsDialog(true)
    }
  }

  const handleEditDepartment = (departmentName: string) => {
    const department = structure?.[departmentName as keyof typeof structure]
    if (department) {
      // Find the department ID from the departments list
      const deptData = findDepartmentByStructureName(departmentName)
      
      if (!deptData) {
        alert(`Department not found: ${departmentName}`)
        return
      }
      
      setEditingDepartment({
        name: departmentName,
        id: deptData.id,
        ...department
      })
      setEditDepartmentData({
        name: deptData.name, // Use the actual database name
        description: deptData.description || '',
        headId: department.head?.id || 'none'
      })
      setShowEditDepartmentDialog(true)
    }
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editDepartmentData.name) {
      alert('Please enter department name')
      return
    }

    try {
      setAddingDepartment(true)
      const response = await ApiService.updateDepartment(editingDepartment.id, {
        name: editDepartmentData.name,
        description: editDepartmentData.description || undefined,
        headId: editDepartmentData.headId === 'none' ? undefined : editDepartmentData.headId
      })
      
      if (response.success) {
        alert('Department updated successfully!')
        setShowEditDepartmentDialog(false)
        setEditingDepartment(null)
        setEditDepartmentData({ name: '', description: '', headId: '' })
        // Refresh department structure
        await fetchDepartmentStructure()
        await fetchDepartments()
        await fetchAvailableUsers()
      } else {
        alert(response.message || 'Failed to update department')
      }
    } catch (error: any) {
      console.error('Update department error:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to update department. Please try again.')
      }
    } finally {
      setAddingDepartment(false)
    }
  }

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the ${departmentName} department? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingDepartment(departmentName)
      
      // Find the department ID from the departments list
      const department = findDepartmentByStructureName(departmentName)
      
      if (!department) {
        alert(`Department not found: ${departmentName}`)
        return
      }
      
      const response = await ApiService.deleteDepartment(department.id)
      
      if (response.success) {
        alert('Department deleted successfully!')
        // Refresh department structure
        await fetchDepartmentStructure()
        await fetchDepartments()
        await fetchAvailableUsers()
      } else {
        alert(response.message || 'Failed to delete department')
      }
    } catch (error: any) {
      console.error('Delete department error:', error)
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bad request. Please check your input.'
        alert(`Error: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.')
      } else {
        alert('Failed to delete department. Please try again.')
      }
    } finally {
      setDeletingDepartment(null)
    }
  }

  const openEditDialog = (member: any, department: string) => {
    setEditingMember({ ...member, department })
    setSelectedRole(member.role)
    setSelectedPosition(member.userPosition)
    setSelectedManager(member.managerId || 'none')
    setShowEditDialog(true)
  }

  const getRoleOptions = (department: string) => {
    // Map department names to their role prefixes
    const departmentRoleMap = {
      'CUSTOMER_SERVICE': 'CS',
      'Customer Service': 'CS',
      'Operations': 'OPS',
      'FINANCE A': 'FINANCE',
      'Marketing & Communications': 'MARKETING',
      'Quality Assurance': 'QA',
      'IT Support': 'IT',
      'FIANNACE A': 'FINANCE',
      'FIANNACE ASDA': 'FINANCE'
    }
    
    const prefix = departmentRoleMap[department as keyof typeof departmentRoleMap] || 'GENERAL'
    
    return [
      { value: `${prefix}_HEAD`, label: 'Head' },
      { value: `${prefix}_AGENT`, label: 'Agent' }
    ]
  }

  const getPositionOptions = (role: string) => {
    const positionMap = {
      // Customer Service
      'CS_HEAD': ['Head of Customer Service'],
      'CS_AGENT': ['Customer Service Staff'],
      
      // Operations
      'OPS_HEAD': ['Head of Operations'],
      'OPS_AGENT': ['Operations Staff'],
      
      // Finance
      'FINANCE_HEAD': ['Head of Finance'],
      'FINANCE_AGENT': ['Finance Staff'],
      
      // Marketing
      'MARKETING_HEAD': ['Head of Marketing'],
      'MARKETING_AGENT': ['Marketing Staff'],
      
      // Quality Assurance
      'QA_HEAD': ['Head of Quality Assurance'],
      'QA_AGENT': ['QA Staff'],
      
      // IT Support
      'IT_HEAD': ['Head of IT Support'],
      'IT_AGENT': ['IT Staff'],
      
      // General fallback
      'GENERAL_HEAD': ['Department Head'],
      'GENERAL_AGENT': ['Agent']
    }
    return positionMap[role as keyof typeof positionMap] || ['Agent']
  }

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'HEAD':
        return 'bg-red-100 text-red-800'
      case 'SENIOR_AGENT':
        return 'bg-blue-100 text-blue-800'
      case 'AGENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'HEAD':
        return 'Head'
      case 'AGENT':
        return 'Agent'
      default:
        return position
    }
  }

  // Helper function to map structure keys to database names
  const mapStructureToDbName = (structureName: string): string => {
    const structureToDbMapping = {
      'MARKETING_&_COMMUNICATIONS': 'Marketing & Communications',
      'QUALITY_ASSURANCE': 'Quality Assurance',
      'IT_SUPPORT': 'IT Support',
      'FIANNACE_A': 'FIANNACE A',
      'FIANNACE_ASDA': 'FIANNACE ASDA',
      'FINANCE_A': 'FINANCE A',
      'OPERATIONS': 'Operations',
      'CUSTOMER_SERVICE': 'CUSTOMER_SERVICE'
    }
    
    return structureToDbMapping[structureName as keyof typeof structureToDbMapping] || structureName
  }

  // Helper function to find department by structure name
  const findDepartmentByStructureName = (structureName: string) => {
    return departments.find(d => {
      // Direct match
      if (d.name === structureName) return true
      
      // Use mapping
      return d.name === mapStructureToDbName(structureName)
    })
  }

  useEffect(() => {
    fetchDepartmentStructure()
    fetchDepartments()
    fetchAvailableUsers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchDepartmentStructure}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  if (!structure) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-gray-600">Kelola struktur organisasi dan tim departemen</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/teams'}
            className="flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Teams Management
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-gray-900">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Add New Department</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Create a new department and assign a head if needed
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-gray-900">
                <div>
                  <Label htmlFor="dept-name" className="text-gray-900">Department Name</Label>
                  <Input
                    id="dept-name"
                    placeholder="Enter department name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="bg-white text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="dept-description" className="text-gray-900">Description</Label>
                  <Input
                    id="dept-description"
                    placeholder="Enter department description"
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    className="bg-white text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="dept-head" className="text-gray-900">Department Head (Optional)</Label>
                  <Select value={newDepartment.headId} onValueChange={(value) => setNewDepartment({...newDepartment, headId: value})}>
                    <SelectTrigger className="bg-white text-gray-900 border border-gray-300">
                      <SelectValue placeholder="Select department head" className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-gray-900 hover:bg-gray-100">
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewDepartment({name: '', description: '', headId: ''})}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddDepartment}
                    disabled={addingDepartment || !newDepartment.name}
                  >
                    {addingDepartment ? 'Adding...' : 'Add Department'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(structure).length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(structure).reduce((total, dept) => 
                total + (dept.head ? 1 : 0) + dept.agents.length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All department members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Heads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(structure).filter(dept => dept.head).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Assigned heads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Manage teams and department assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => window.location.href = '/admin/teams'}
              className="w-full justify-start"
              variant="outline"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Smart Team Assignment
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/users'}
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/analytics'}
              className="w-full justify-start"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Department Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department List */}
      <div className="space-y-6">
        {Object.entries(structure).map(([deptName, department], index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold capitalize">
                    {deptName.replace('_', ' ')} Department
                  </CardTitle>
                  <CardDescription>
                    {(department.head ? 1 : 0) + department.agents.length} total members
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(deptName)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditDepartment(deptName)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteDepartment(deptName)}
                    disabled={deletingDepartment === deptName}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingDepartment === deptName ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(deptName || 'CUSTOMER_SERVICE')
                      setShowAddMemberDialog(true)
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Department Head */}
                {department.head ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-900">{department.head.fullName}</h4>
                          <p className="text-sm text-red-700">{department.head.email}</p>
                        </div>
                      </div>
                      <Badge className={getPositionBadgeColor(department.head.userPosition)}>
                        {getPositionLabel(department.head.userPosition)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600">No Head Assigned</h4>
                        <p className="text-sm text-gray-500">Assign a department head</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Department Agents */}
                {department.agents.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700">Team Members ({department.agents.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {department.agents.map((agent: any) => (
                        <div key={agent.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-900">{agent.fullName}</h6>
                                <p className="text-xs text-gray-600">{agent.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPositionBadgeColor(agent.userPosition)}>
                                {getPositionLabel(agent.userPosition)}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(agent, deptName)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMember(deptName, agent.id, agent.fullName)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {department.agents.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">No team members</p>
                    <p className="text-sm text-gray-400">Add members to this department</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(structure).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Departments Found</h3>
            <p className="text-gray-500 mb-4">Create your first department to get started</p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Department
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl text-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">Add Member to Department</DialogTitle>
            <DialogDescription className="text-lg text-gray-600 mt-2">
              Assign a user to a department with specific role and position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6 text-gray-900 bg-white">
            <div className="space-y-3">
              <Label htmlFor="department" className="text-base font-semibold text-gray-800 block">Department *</Label>
              <Select value={selectedDepartment || ''} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select department" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle between existing user and create new */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant={!isCreatingNew ? "primary" : "outline"}
                  onClick={() => setIsCreatingNew(false)}
                  className="px-6 py-2"
                >
                  Use Existing User
                </Button>
                <Button
                  type="button"
                  variant={isCreatingNew ? "primary" : "outline"}
                  onClick={() => setIsCreatingNew(true)}
                  className="px-6 py-2"
                >
                  Create New Staff
                </Button>
              </div>

              {!isCreatingNew ? (
                <div className="space-y-3">
                  <Label htmlFor="user" className="text-base font-semibold text-gray-800 block">User *</Label>
                  <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                      <SelectValue placeholder="Select user" className="text-gray-900" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="fullName" className="text-base font-semibold text-gray-800 block">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newStaffData.fullName}
                        onChange={(e) => setNewStaffData({...newStaffData, fullName: e.target.value})}
                        placeholder="Enter full name"
                        className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-semibold text-gray-800 block">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaffData.email}
                        onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                        placeholder="Enter email address"
                        className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="phoneNumber" className="text-base font-semibold text-gray-800 block">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={newStaffData.phoneNumber}
                        onChange={(e) => setNewStaffData({...newStaffData, phoneNumber: e.target.value})}
                        placeholder="Enter phone number"
                        className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastEducation" className="text-base font-semibold text-gray-800 block">Last Education</Label>
                      <Input
                        id="lastEducation"
                        value={newStaffData.lastEducation}
                        onChange={(e) => setNewStaffData({...newStaffData, lastEducation: e.target.value})}
                        placeholder="Enter last education"
                        className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-base font-semibold text-gray-800 block">Address</Label>
                    <Input
                      id="address"
                      value={newStaffData.address}
                      onChange={(e) => setNewStaffData({...newStaffData, address: e.target.value})}
                      placeholder="Enter address"
                      className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="role" className="text-base font-semibold text-gray-800 block">Role *</Label>
              <Select value={selectedRole || ''} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select role" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  {getRoleOptions(selectedDepartment).map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="position" className="text-base font-semibold text-gray-800 block">Position *</Label>
              <Select value={selectedPosition || ''} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select position" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  {getPositionOptions(selectedRole).map((position) => (
                    <SelectItem key={position} value={position} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="manager" className="text-base font-semibold text-gray-800 block">Manager (Optional)</Label>
              <Select value={selectedManager || ''} onValueChange={setSelectedManager}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select manager" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  <SelectItem value="none" className="text-base py-3 text-gray-900 hover:bg-blue-50">No Manager</SelectItem>
                  {/* Add manager options based on department */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowAddMemberDialog(false)}
                className="px-8 py-3 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 text-base font-semibold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember}
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-base font-semibold"
              >
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl text-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Member Role</DialogTitle>
            <DialogDescription className="text-lg text-gray-600 mt-2">
              Update the role and position of this department member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6 text-gray-900">
            <div className="space-y-3">
              <Label htmlFor="edit-role" className="text-base font-semibold text-gray-800 block">Role *</Label>
              <Select value={selectedRole || ''} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select role" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  {editingMember && getRoleOptions(editingMember.department).map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-position" className="text-base font-semibold text-gray-800 block">Position *</Label>
              <Select value={selectedPosition || ''} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select position" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  {getPositionOptions(selectedRole).map((position) => (
                    <SelectItem key={position} value={position} className="text-base py-3 text-gray-900 hover:bg-blue-50">
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="edit-manager" className="text-base font-semibold text-gray-800 block">Manager (Optional)</Label>
              <Select value={selectedManager || ''} onValueChange={setSelectedManager}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base bg-white text-gray-900">
                  <SelectValue placeholder="Select manager" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                  <SelectItem value="none" className="text-base py-3 text-gray-900 hover:bg-blue-50">No Manager</SelectItem>
                  {/* Add manager options based on department */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="px-8 py-3 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 text-base font-semibold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditMember}
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-base font-semibold"
              >
                Update Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDetailsDialog} onOpenChange={setShowViewDetailsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl text-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Department Details: {viewingDepartment?.name?.replace('_', ' ')}
            </DialogTitle>
            <DialogDescription className="text-lg text-gray-600 mt-2">
              Complete information about this department and its members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6 text-gray-900">
            {viewingDepartment && (
              <>
                {/* Department Head */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Department Head</h3>
                  {viewingDepartment.head ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 text-lg">{viewingDepartment.head.fullName}</h4>
                          <p className="text-red-700">{viewingDepartment.head.email}</p>
                          <p className="text-sm text-red-600">{viewingDepartment.head.userPosition}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                          Head
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-600">No Head Assigned</h4>
                          <p className="text-sm text-gray-500">This department doesn't have a head yet</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Team Members ({viewingDepartment.agents?.length || 0})
                  </h3>
                  {viewingDepartment.agents && viewingDepartment.agents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingDepartment.agents.map((agent: any, index: number) => (
                        <div key={agent.id || index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{agent.fullName}</h5>
                              <p className="text-sm text-gray-600">{agent.email}</p>
                              <p className="text-xs text-gray-500">{agent.userPosition}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                              {getPositionLabel(agent.userPosition)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">No team members</p>
                      <p className="text-sm text-gray-400">This department has no members yet</p>
                    </div>
                  )}
                </div>

                {/* Department Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Department Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {viewingDepartment.head ? 1 : 0}
                      </div>
                      <p className="text-sm text-blue-700">Department Head</p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {viewingDepartment.agents?.length || 0}
                      </div>
                      <p className="text-sm text-green-700">Team Members</p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(viewingDepartment.head ? 1 : 0) + (viewingDepartment.agents?.length || 0)}
                      </div>
                      <p className="text-sm text-purple-700">Total Staff</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDepartmentDialog} onOpenChange={setShowEditDepartmentDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl text-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Department</DialogTitle>
            <DialogDescription className="text-lg text-gray-600 mt-2">
              Update department information and assign a new head if needed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 text-gray-900">
            <div>
              <Label htmlFor="edit-dept-name" className="text-gray-900">Department Name *</Label>
              <Input
                id="edit-dept-name"
                placeholder="Enter department name"
                value={editDepartmentData.name}
                onChange={(e) => setEditDepartmentData({...editDepartmentData, name: e.target.value})}
                className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-description" className="text-gray-900">Description</Label>
              <Input
                id="edit-dept-description"
                placeholder="Enter department description"
                value={editDepartmentData.description}
                onChange={(e) => setEditDepartmentData({...editDepartmentData, description: e.target.value})}
                className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-head" className="text-gray-900">Department Head</Label>
              <Select 
                value={editDepartmentData.headId} 
                onValueChange={(value) => setEditDepartmentData({...editDepartmentData, headId: value})}
              >
                <SelectTrigger className="h-12 text-base text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white">
                  <SelectValue placeholder="Select department head" className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="none" className="text-gray-900 hover:bg-gray-100">No Head</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-gray-900 hover:bg-gray-100">
                      {user.fullName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDepartmentDialog(false)}
                className="px-8 py-3 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 text-base font-semibold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateDepartment}
                disabled={addingDepartment || !editDepartmentData.name}
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-base font-semibold"
              >
                {addingDepartment ? 'Updating...' : 'Update Department'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
