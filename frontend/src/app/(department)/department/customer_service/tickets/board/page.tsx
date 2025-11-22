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
  ArrowLeft,
  Plus,
  Eye,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'

interface TicketData {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
  assignedTo?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
}

export default function TicketBoard() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT', 'CS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTickets()
    }
  }, [isAuthenticated, user])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getDepartmentTickets()
      
      if (response.success && response.data) {
        setTickets(response.data.tickets || [])
      } else {
        throw new Error(response.message || 'Failed to fetch tickets')
      }
    } catch (err) {
      setError('Failed to fetch tickets')
      console.error('Tickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-200'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />
      case 'CLOSED': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'TECHNICAL_ISSUE': return 'Technical'
      case 'PAYMENT_ISSUE': return 'Payment'
      case 'CUSTOMER_SUPPORT': return 'Support'
      case 'EVENT_MANAGEMENT': return 'Event'
      case 'ORGANIZER_SUPPORT': return 'Organizer'
      case 'FINANCE_QUERY': return 'Finance'
      case 'GENERAL_INQUIRY': return 'General'
      default: return category
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  // Group tickets by status
  const groupedTickets = {
    OPEN: tickets.filter(t => t.status === 'OPEN'),
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS'),
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED'),
    CLOSED: tickets.filter(t => t.status === 'CLOSED')
  }

  const statusColumns = [
    { key: 'OPEN', title: 'Open', color: 'red' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'yellow' },
    { key: 'RESOLVED', title: 'Resolved', color: 'green' },
    { key: 'CLOSED', title: 'Closed', color: 'gray' }
  ]

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
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/department/customer_service/tickets')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Board</h1>
              <p className="text-gray-600 mt-1">Visual ticket management with drag & drop</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push('/department/customer_service/tickets/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map(({ key, title, color }) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {groupedTickets[key as keyof typeof groupedTickets].length}
                    </p>
                  </div>
                  <div className={`h-3 w-3 rounded-full bg-${color}-500`}></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {statusColumns.map(({ key, title, color }) => (
            <Card key={key} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    {getStatusIcon(key)}
                    <span className="ml-2">{title}</span>
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {groupedTickets[key as keyof typeof groupedTickets].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTickets[key as keyof typeof groupedTickets].map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/department/customer_service/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {ticket.title}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Add dropdown menu
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </div>

                    {ticket.assignedTo && (
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{ticket.assignedTo}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      {ticket.dueDate && (
                        <div className={`flex items-center space-x-1 ${
                          isOverdue(ticket.dueDate) ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(ticket.dueDate)}</span>
                        </div>
                      )}
                    </div>

                    {ticket.dueDate && isOverdue(ticket.dueDate) && (
                      <div className="mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        OVERDUE
                      </div>
                    )}
                  </div>
                ))}

                {groupedTickets[key as keyof typeof groupedTickets].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className={`h-12 w-12 mx-auto mb-2 rounded-full bg-${color}-100 flex items-center justify-center`}>
                      {getStatusIcon(key)}
                    </div>
                    <p className="text-sm">No {title.toLowerCase()} tickets</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
