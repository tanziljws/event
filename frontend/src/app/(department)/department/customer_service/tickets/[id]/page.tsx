'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Tag,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  MoreHorizontal,
  Trash2,
  Edit3
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

interface CommentData {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    role: string
    department: string
    userPosition: string
  }
}

interface UserForMention {
  id: string
  fullName: string
  email: string
  role: string
  userPosition: string
  displayName: string
}

export default function TicketDetail() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Comments state
  const [comments, setComments] = useState<CommentData[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [mentionUsers, setMentionUsers] = useState<UserForMention[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

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
    if (isAuthenticated && user && ticketId) {
      fetchTicket()
      fetchComments()
      fetchMentionUsers()
    }
  }, [isAuthenticated, user, ticketId])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ApiService.getDepartmentTicket(ticketId)
      
      if (response.success) {
        setTicket(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch ticket')
      }
    } catch (err) {
      setError('Failed to fetch ticket details')
      console.error('Ticket detail error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      const response = await ApiService.getTicketComments(ticketId)
      
      if (response.success) {
        setComments(response.data.comments || [])
      } else {
        throw new Error(response.message || 'Failed to fetch comments')
      }
    } catch (err) {
      console.error('Comments error:', err)
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchMentionUsers = async () => {
    try {
      const response = await ApiService.getUsersForMentions()
      
      if (response.success) {
        setMentionUsers(response.data.users || [])
      }
    } catch (err) {
      console.error('Mention users error:', err)
    }
  }

  const handleCreateComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await ApiService.createComment(ticketId, {
        content: newComment.trim(),
        isInternal: isInternalNote
      })

      if (response.success) {
        setComments(prev => [...prev, response.data.comment])
        setNewComment('')
        setIsInternalNote(false)
      } else {
        throw new Error(response.message || 'Failed to create comment')
      }
    } catch (err) {
      console.error('Create comment error:', err)
      alert('Failed to create comment')
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return

    try {
      const response = await ApiService.updateComment(commentId, {
        content: editCommentContent.trim()
      })

      if (response.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? response.data.comment : comment
        ))
        setEditingComment(null)
        setEditCommentContent('')
      } else {
        throw new Error(response.message || 'Failed to update comment')
      }
    } catch (err) {
      console.error('Update comment error:', err)
      alert('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await ApiService.deleteComment(commentId)

      if (response.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      } else {
        throw new Error(response.message || 'Failed to delete comment')
      }
    } catch (err) {
      console.error('Delete comment error:', err)
      alert('Failed to delete comment')
    }
  }

  const startEditComment = (comment: CommentData) => {
    setEditingComment(comment.id)
    setEditCommentContent(comment.content)
  }

  const cancelEditComment = () => {
    setEditingComment(null)
    setEditCommentContent('')
  }

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'TECHNICAL_ISSUE': return 'Technical Issue'
      case 'PAYMENT_ISSUE': return 'Payment Issue'
      case 'CUSTOMER_SUPPORT': return 'Customer Support'
      case 'EVENT_MANAGEMENT': return 'Event Management'
      case 'ORGANIZER_SUPPORT': return 'Organizer Support'
      case 'FINANCE_QUERY': return 'Finance Query'
      case 'GENERAL_INQUIRY': return 'General Inquiry'
      default: return category
    }
  }

  const handleAssignToMe = async () => {
    if (!ticket) return
    
    try {
      setLoading(true)
      const response = await ApiService.assignDepartmentTicket(ticket.id)
      
      if (response.success) {
        // Refresh ticket data
        await fetchTicket()
        alert('Ticket assigned to you successfully!')
      } else {
        throw new Error(response.message || 'Failed to assign ticket')
      }
    } catch (err) {
      alert('Failed to assign ticket: ' + (err as Error).message)
      console.error('Assign ticket error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatus = async (newStatus: string) => {
    if (!ticket) return
    
    try {
      setLoading(true)
      const response = await ApiService.updateDepartmentTicket(ticket.id, {
        status: newStatus
      })
      
      if (response.success) {
        // Refresh ticket data
        await fetchTicket()
        alert(`Ticket status changed to ${newStatus}!`)
      } else {
        throw new Error(response.message || 'Failed to update ticket')
      }
    } catch (err) {
      alert('Failed to update ticket: ' + (err as Error).message)
      console.error('Update ticket error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDueDate = async () => {
    if (!ticket) return
    
    const newDate = prompt('Enter new due date (YYYY-MM-DD):', 
      ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '')
    
    if (!newDate) return
    
    try {
      setLoading(true)
      const response = await ApiService.updateDepartmentTicket(ticket.id, {
        dueDate: newDate
      })
      
      if (response.success) {
        // Refresh ticket data
        await fetchTicket()
        alert('Due date updated successfully!')
      } else {
        throw new Error(response.message || 'Failed to update ticket')
      }
    } catch (err) {
      alert('Failed to update ticket: ' + (err as Error).message)
      console.error('Update ticket error:', err)
    } finally {
      setLoading(false)
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

  if (!['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT', 'CS_AGENT'].includes(user.role)) {
    return null // Will redirect
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Ticket not found</p>
        </div>
      </div>
    )
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
              Back to Tickets
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Details</h1>
              <p className="text-gray-600 mt-1">Ticket ID: {ticket.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm rounded-full flex items-center ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Created on {formatDate(ticket.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Comments & Updates
                </CardTitle>
                <CardDescription>Add comments and track ticket progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Comment Form */}
                  <div className="border rounded-lg p-4">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Add a comment or update..."
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant={isInternalNote ? "primary" : "outline"}
                              onClick={() => setIsInternalNote(!isInternalNote)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Internal Note
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowMentions(!showMentions)}
                            >
                              <User className="h-4 w-4 mr-1" />
                              @Mention
                            </Button>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreateComment}
                            disabled={!newComment.trim()}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Post Comment
                          </Button>
                        </div>
                        
                        {/* Mention Users Dropdown */}
                        {showMentions && (
                          <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                            {mentionUsers.map((mentionUser) => (
                              <div
                                key={mentionUser.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                                onClick={() => {
                                  setNewComment(prev => prev + `@${mentionUser.fullName} `)
                                  setShowMentions(false)
                                }}
                              >
                                <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                  {mentionUser.fullName.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{mentionUser.fullName}</div>
                                  <div className="text-xs text-gray-500">{mentionUser.userPosition}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to add a comment!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {comment.user.fullName.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className={`rounded-lg p-3 ${
                              comment.isInternal 
                                ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                                : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">{comment.user.fullName}</span>
                                  <span className="text-xs text-gray-500">({comment.user.userPosition})</span>
                                  {comment.isInternal && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                      Internal Note
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {comment.user.id === user?.id && (
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => startEditComment(comment)}
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteComment(comment.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {editingComment === comment.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    value={editCommentContent}
                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => handleEditComment(comment.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditComment}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-gray-600">{getCategoryLabel(ticket.category)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-gray-600">{ticket.createdBy}</p>
                  </div>
                </div>

                {ticket.assignedTo && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-gray-600">{ticket.assignedTo}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">{formatDate(ticket.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDate(ticket.updatedAt)}</p>
                  </div>
                </div>

                {ticket.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-gray-600">{formatDate(ticket.dueDate)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={handleAssignToMe}
                  disabled={loading || ticket?.assignedTo === user?.email}
                >
                  {ticket?.assignedTo === user?.email ? 'Assigned to You' : 'Assign to Me'}
                </Button>
                
                <div className="space-y-1">
                  <Button 
                    className="w-full" 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleChangeStatus('IN_PROGRESS')}
                    disabled={loading || ticket?.status === 'IN_PROGRESS'}
                  >
                    Mark In Progress
                  </Button>
                  <Button 
                    className="w-full" 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleChangeStatus('RESOLVED')}
                    disabled={loading || ticket?.status === 'RESOLVED'}
                  >
                    Mark Resolved
                  </Button>
                </div>
                
                <Button 
                  className="w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => alert('Comment feature coming soon!')}
                  disabled={loading}
                >
                  Add Comment
                </Button>
                
                <Button 
                  className="w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={handleSetDueDate}
                  disabled={loading}
                >
                  Set Due Date
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
