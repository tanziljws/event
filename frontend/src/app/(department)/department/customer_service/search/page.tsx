'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface SearchFilters {
  query: string
  status: string
  priority: string
  category: string
  assignedTo: string
  dateFrom: string
  dateTo: string
  hasComments: boolean
}

interface SearchResult {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  assignedTo?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  commentCount: number
  lastComment?: {
    content: string
    user: string
    createdAt: string
  }
}

export default function SearchPage() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    dateFrom: '',
    dateTo: '',
    hasComments: false
  })
  const [showFilters, setShowFilters] = useState(false)

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

  const handleSearch = async () => {
    if (!filters.query.trim() && !filters.status && !filters.priority && !filters.category) {
      setError('Please enter a search query or select at least one filter')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Mock search results - replace with real API call
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Login issue with mobile app',
          description: 'Users cannot login to the mobile application',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          category: 'TECHNICAL_ISSUE',
          assignedTo: 'Alice Customer',
          createdBy: 'john.doe@example.com',
          createdAt: '2025-09-10T10:30:00Z',
          updatedAt: '2025-09-12T14:20:00Z',
          dueDate: '2025-09-15T17:00:00Z',
          commentCount: 5,
          lastComment: {
            content: 'Working on the authentication fix',
            user: 'Alice Customer',
            createdAt: '2025-09-12T14:20:00Z'
          }
        },
        {
          id: '2',
          title: 'Payment processing error',
          description: 'Credit card payments are failing',
          status: 'OPEN',
          priority: 'URGENT',
          category: 'PAYMENT_ISSUE',
          assignedTo: 'John Smith',
          createdBy: 'customer@example.com',
          createdAt: '2025-09-11T09:15:00Z',
          updatedAt: '2025-09-11T09:15:00Z',
          commentCount: 2,
          lastComment: {
            content: 'Investigating payment gateway connection',
            user: 'John Smith',
            createdAt: '2025-09-11T10:30:00Z'
          }
        },
        {
          id: '3',
          title: 'Event registration not working',
          description: 'Users cannot register for events',
          status: 'RESOLVED',
          priority: 'MEDIUM',
          category: 'EVENT_MANAGEMENT',
          assignedTo: 'Sarah Johnson',
          createdBy: 'organizer@example.com',
          createdAt: '2025-09-09T16:45:00Z',
          updatedAt: '2025-09-10T11:30:00Z',
          commentCount: 8,
          lastComment: {
            content: 'Fixed the registration form validation',
            user: 'Sarah Johnson',
            createdAt: '2025-09-10T11:30:00Z'
          }
        }
      ]

      // Filter results based on search criteria
      let filteredResults = mockResults

      if (filters.query) {
        const query = filters.query.toLowerCase()
        filteredResults = filteredResults.filter(result =>
          result.title.toLowerCase().includes(query) ||
          result.description.toLowerCase().includes(query) ||
          result.createdBy.toLowerCase().includes(query)
        )
      }

      if (filters.status) {
        filteredResults = filteredResults.filter(result => result.status === filters.status)
      }

      if (filters.priority) {
        filteredResults = filteredResults.filter(result => result.priority === filters.priority)
      }

      if (filters.category) {
        filteredResults = filteredResults.filter(result => result.category === filters.category)
      }

      if (filters.assignedTo) {
        filteredResults = filteredResults.filter(result => 
          result.assignedTo?.toLowerCase().includes(filters.assignedTo.toLowerCase())
        )
      }

      if (filters.hasComments) {
        filteredResults = filteredResults.filter(result => result.commentCount > 0)
      }

      setResults(filteredResults)
    } catch (err) {
      setError('Search failed')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      status: '',
      priority: '',
      category: '',
      assignedTo: '',
      dateFrom: '',
      dateTo: '',
      hasComments: false
    })
    setResults([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-600 bg-red-100'
      case 'IN_PROGRESS': return 'text-yellow-600 bg-yellow-100'
      case 'RESOLVED': return 'text-green-600 bg-green-100'
      case 'CLOSED': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
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
              onClick={() => router.push('/department/customer_service/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
              <p className="text-gray-600 mt-1">Search tickets and comments with advanced filters</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Tickets
            </CardTitle>
            <CardDescription>Find tickets using keywords, filters, and date ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Query */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search tickets, descriptions, or email addresses..."
                    value={filters.query}
                    onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
                        <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
                        <SelectItem value="CUSTOMER_SUPPORT">Customer Support</SelectItem>
                        <SelectItem value="EVENT_MANAGEMENT">Event Management</SelectItem>
                        <SelectItem value="ORGANIZER_SUPPORT">Organizer Support</SelectItem>
                        <SelectItem value="FINANCE_QUERY">Finance Query</SelectItem>
                        <SelectItem value="GENERAL_INQUIRY">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input
                      placeholder="Agent name..."
                      value={filters.assignedTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasComments"
                      checked={filters.hasComments}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasComments: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="hasComments">Has Comments</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-lg">{result.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                            {result.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(result.priority)}`}>
                            {result.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{result.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Created by: {result.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(result.createdAt)}</span>
                          </div>
                          {result.assignedTo && (
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>Assigned to: {result.assignedTo}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{result.commentCount} comments</span>
                          </div>
                        </div>

                        {result.lastComment && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Last comment by {result.lastComment.user}:</strong>
                            </p>
                            <p className="text-sm">{result.lastComment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(result.lastComment.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => router.push(`/department/customer_service/tickets/${result.id}`)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && results.length === 0 && filters.query && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
