'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  User,
  Clock
} from 'lucide-react'

interface Organizer {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  organizerType: string
  verificationStatus: string
  businessName: string
  businessAddress: string
  businessPhone: string
  portfolio: string
  socialMedia: string
  createdAt: string
  verifiedAt?: string
  rejectedReason?: string
}

export default function AdminOrganizersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const { toast } = useToast()
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [organizerToReject, setOrganizerToReject] = useState<Organizer | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    // Check authorization
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(user.role)) {
      fetchOrganizers()
    }
  }, [isAuthenticated, user])

  const fetchOrganizers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getAdminOrganizers()
      
      if (response.success && response.data?.organizers) {
        // Map API response to Organizer interface
        const mappedOrganizers = response.data.organizers.map((org: any) => ({
          id: org.id,
          fullName: org.fullName,
          email: org.email,
          phoneNumber: org.phoneNumber || '',
          organizerType: org.organizerType || '',
          verificationStatus: org.verificationStatus || 'PENDING',
          businessName: org.businessName || '',
          businessAddress: org.businessAddress || '',
          businessPhone: org.businessPhone || '',
          portfolio: org.portfolio || '',
          socialMedia: org.socialMedia || '',
          createdAt: org.createdAt,
          verifiedAt: org.verifiedAt,
          rejectedReason: org.rejectedReason
        }))
        
        setOrganizers(mappedOrganizers)
      } else {
        setError('Failed to fetch organizers')
        setOrganizers([])
      }
    } catch (err: any) {
      setError('Failed to fetch organizers')
      console.error('Fetch organizers error:', err)
      toast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to fetch organizers'
      })
      setOrganizers([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (organizerId: string) => {
    try {
      setActionLoading(organizerId)
      setError(null)
      
      const response = await ApiService.approveOrganizer(organizerId)
      
      if (response.success) {
        // Update local state
        setOrganizers(prev => prev.map(org => 
          org.id === organizerId 
            ? { 
                ...org, 
                verificationStatus: 'APPROVED', 
                verifiedAt: new Date().toISOString(),
                rejectedReason: undefined
              }
            : org
        ))
        
        toast({
          type: 'success',
          title: 'Success',
          message: 'Organizer approved successfully'
        })
        
        // Refresh data to get latest from server
        await fetchOrganizers()
      } else {
        throw new Error(response.message || 'Failed to approve organizer')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to approve organizer'
      setError(errorMessage)
      toast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
      console.error('Approve organizer error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectDialog = (organizer: Organizer) => {
    setOrganizerToReject(organizer)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!organizerToReject || !rejectReason.trim()) {
      toast({
        type: 'error',
        title: 'Validation Error',
        message: 'Rejection reason is required'
      })
      return
    }

    try {
      setActionLoading(organizerToReject.id)
      setError(null)
      
      const response = await ApiService.rejectOrganizer(organizerToReject.id, rejectReason.trim())
      
      if (response.success) {
        // Update local state
        setOrganizers(prev => prev.map(org => 
          org.id === organizerToReject.id 
            ? { 
                ...org, 
                verificationStatus: 'REJECTED', 
                rejectedReason: rejectReason.trim(),
                verifiedAt: undefined
              }
            : org
        ))
        
        toast({
          type: 'success',
          title: 'Success',
          message: 'Organizer rejected successfully'
        })
        
        // Close dialog and reset
        setRejectDialogOpen(false)
        setOrganizerToReject(null)
        setRejectReason('')
        
        // Refresh data to get latest from server
        await fetchOrganizers()
      } else {
        throw new Error(response.message || 'Failed to reject organizer')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reject organizer'
      setError(errorMessage)
      toast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
      console.error('Reject organizer error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getOrganizerTypeLabel = (type: string) => {
    const typeConfig = {
      'INDIVIDUAL': 'Individual/Personal',
      'COMMUNITY': 'Komunitas/Organisasi',
      'SMALL_BUSINESS': 'Small Business/UMKM',
      'INSTITUTION': 'Institusi',
    }
    
    return typeConfig[type as keyof typeof typeConfig] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null // Will redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Management</h1>
          <p className="text-gray-600 mt-1">Review and approve organizer applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {organizers.filter(org => org.verificationStatus === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {organizers.filter(org => org.verificationStatus === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {organizers.filter(org => org.verificationStatus === 'REJECTED').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizers List */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : organizers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizers found</h3>
            <p className="text-gray-600">No organizer applications to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {organizers.map((organizer) => (
            <Card key={organizer.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {organizer.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{organizer.fullName}</h3>
                        <p className="text-sm text-gray-600">{organizer.email}</p>
                        <div className="mt-1 flex gap-2">
                          {getStatusBadge(organizer.verificationStatus)}
                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                            {getOrganizerTypeLabel(organizer.organizerType)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{organizer.phoneNumber}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2" />
                          <span>{organizer.businessName}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{organizer.businessAddress}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Applied: {formatDate(organizer.createdAt)}</span>
                        </div>
                        {organizer.verifiedAt && (
                          <div className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span>Verified: {formatDate(organizer.verifiedAt)}</span>
                          </div>
                        )}
                        {organizer.rejectedReason && (
                          <div className="flex items-center text-sm text-red-600">
                            <XCircle className="w-4 h-4 mr-2" />
                            <span>Reason: {organizer.rejectedReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {organizer.portfolio && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700">Portfolio:</p>
                        <a 
                          href={organizer.portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {organizer.portfolio}
                        </a>
                      </div>
                    )}

                    {organizer.socialMedia && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Social Media:</p>
                        <p className="text-sm text-gray-600">{organizer.socialMedia}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    {organizer.verificationStatus === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleApprove(organizer.id)}
                          disabled={actionLoading === organizer.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actionLoading === organizer.id ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => openRejectDialog(organizer)}
                          disabled={actionLoading === organizer.id}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/organizers/${organizer.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Organizer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this organizer application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {organizerToReject && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{organizerToReject.fullName}</p>
                <p className="text-sm text-gray-600">{organizerToReject.email}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the organizer via email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setOrganizerToReject(null)
                setRejectReason('')
              }}
              disabled={actionLoading === organizerToReject?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading === organizerToReject?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading === organizerToReject?.id ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Organizer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
