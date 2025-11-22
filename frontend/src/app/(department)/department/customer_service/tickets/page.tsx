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
  Ticket, 
  Plus, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit
} from 'lucide-react'

interface TicketData {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'TECHNICAL' | 'BILLING' | 'GENERAL' | 'FEATURE_REQUEST'
  assignedTo?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
}

export default function CustomerServiceTickets() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for now - will be replaced with real API
  const mockTickets: TicketData[] = [
    {
      id: 'CS-001',
      title: 'User cannot login to account',
      description: 'Customer reports being unable to login despite correct credentials',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'TECHNICAL',
      assignedTo: 'alice.customer@company.com',
      createdBy: 'user@example.com',
      createdAt: '2025-01-11T10:00:00Z',
      updatedAt: '2025-01-11T10:00:00Z',
      dueDate: '2025-01-13T10:00:00Z'
    },
    {
      id: 'CS-002',
      title: 'Payment processing issue',
      description: 'Event registration payment is not going through',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      category: 'BILLING',
      assignedTo: 'bob.support@company.com',
      createdBy: 'organizer@example.com',
      createdAt: '2025-01-10T14:30:00Z',
      updatedAt: '2025-01-11T09:15:00Z',
      dueDate: '2025-01-12T14:30:00Z'
    },
    {
      id: 'CS-003',
      title: 'Request for new feature',
      description: 'Customer wants to add bulk event creation feature',
      status: 'RESOLVED',
      priority: 'LOW',
      category: 'FEATURE_REQUEST',
      assignedTo: 'alice.customer@company.com',
      createdBy: 'organizer@example.com',
      createdAt: '2025-01-08T16:45:00Z',
      updatedAt: '2025-01-10T11:20:00Z'
    },
    {
      id: 'CS-004',
      title: 'Account verification problem',
      description: 'Email verification link is not working',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'TECHNICAL',
      assignedTo: 'sarah.johnson@company.com',
      createdBy: 'user@example.com',
      createdAt: '2025-01-09T11:20:00Z',
      updatedAt: '2025-01-09T11:20:00Z',
      dueDate: '2025-01-11T11:20:00Z'
    }
  ]

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch tickets from API
      const response = await ApiService.getDepartmentTickets({
        status: filter === 'ALL' ? undefined : filter,
        page: 1,
        limit: 50
      })

      if (response.success && response.data) {
        const apiTickets = response.data.tickets.map((ticket: any) => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          assignedTo: ticket.assignedTo || 'Unassigned',
          createdBy: ticket.createdBy,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          dueDate: ticket.dueDate
        }))
        setTickets(apiTickets)
      } else {
        // Fallback to mock data if API fails
        setTickets(mockTickets)
      }
    } catch (err) {
      setError('Failed to fetch tickets')
      console.error('Tickets error:', err)
      // Fallback to mock data
      setTickets(mockTickets)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTickets()
    }
  }, [isAuthenticated, user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'TECHNICAL': return 'Technical'
      case 'BILLING': return 'Billing'
      case 'GENERAL': return 'General'
      case 'FEATURE_REQUEST': return 'Feature Request'
      default: return category
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'ALL' || 
      (filter === 'OVERDUE' ? (ticket.dueDate && isOverdue(ticket.dueDate)) : ticket.status === filter)
    
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getTicketStats = () => {
    const total = tickets.length
    const open = tickets.filter(t => t.status === 'OPEN').length
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length
    const overdue = tickets.filter(t => t.dueDate && isOverdue(t.dueDate)).length

    return { total, open, inProgress, resolved, overdue }
  }

  const stats = getTicketStats()

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

  if (!['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT', 'CS_AGENT'].includes(user.role)) {
    return null // Will redirect
  }

  return (
    <ProtectedRoute requireRole={['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT', 'CS_AGENT']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Service Tickets</h1>
            <p className="text-gray-600 mt-1">Manage and track customer support tickets</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => router.push('/department/customer_service/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/department/customer_service/tickets/board')}
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              Board View
            </Button>
            <Button
              onClick={() => router.push('/department/customer_service/tickets/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ticket className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilter('ALL')}
                  variant={filter === 'ALL' ? 'primary' : 'outline'}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilter('OPEN')}
                  variant={filter === 'OPEN' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Open
                </Button>
                <Button
                  onClick={() => setFilter('IN_PROGRESS')}
                  variant={filter === 'IN_PROGRESS' ? 'primary' : 'outline'}
                  size="sm"
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => setFilter('RESOLVED')}
                  variant={filter === 'RESOLVED' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Resolved
                </Button>
                <Button
                  onClick={() => setFilter('OVERDUE')}
                  variant={filter === 'OVERDUE' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Overdue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            <CardDescription>
              Manage and track customer support tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tickets found</p>
                <Button
                  onClick={() => router.push('/department/customer_service/tickets/create')}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        {ticket.dueDate && isOverdue(ticket.dueDate) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>ID: {ticket.id}</span>
                        <span>Category: {getCategoryLabel(ticket.category)}</span>
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        {ticket.dueDate && (
                          <span>Due: {formatDate(ticket.dueDate)}</span>
                        )}
                        {ticket.assignedTo && (
                          <span>Assigned to: {ticket.assignedTo}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/department/customer_service/tickets/${ticket.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
