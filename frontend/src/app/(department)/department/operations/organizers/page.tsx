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
  UserCheck, 
  Search, 
  Filter,
  ThumbsUp,
  ThumbsDown,
  Eye,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

interface Organizer {
  id: string
  fullName: string
  email: string
  organizerType: string
  verificationStatus: string
  createdAt: string
  phoneNumber?: string
  individualProfile?: {
    nik?: string
    personalAddress?: string
    personalPhone?: string
  }
  communityProfile?: {
    communityName?: string
    communityType?: string
    businessAddress?: string
    businessPhone?: string
    contactPerson?: string
  }
  businessProfile?: {
    businessName?: string
    businessType?: string
    businessAddress?: string
    businessPhone?: string
    npwp?: string
  }
  institutionProfile?: {
    institutionName?: string
    institutionType?: string
    businessAddress?: string
    businessPhone?: string
    contactPerson?: string
  }
}

export default function OrganizersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING') // Default to PENDING only
  const [dateFilter, setDateFilter] = useState('TODAY') // Default to today
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }
      if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'].includes(user.role)) {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user && ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'].includes(user.role)) {
      fetchOrganizers()
    }
  }, [isAuthenticated, user])

  const fetchOrganizers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiService.getOrganizersForReview({ limit: 100 })
      
      if (response.success && response.data.organizers) {
        setOrganizers(response.data.organizers)
      } else {
        setError('Failed to fetch organizers')
      }
    } catch (err) {
      setError('Error fetching organizers')
      console.error('Error fetching organizers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrganizers()
    setRefreshing(false)
  }

  const handleApprove = async (organizerId: string) => {
    try {
      const response = await ApiService.approveOrganizer(organizerId)
      if (response.success) {
        await fetchOrganizers()
      }
    } catch (error) {
      console.error('Error approving organizer:', error)
    }
  }

  const handleReject = async (organizerId: string) => {
    try {
      const response = await ApiService.rejectOrganizer(organizerId, 'Rejected by Operations team')
      if (response.success) {
        await fetchOrganizers()
      }
    } catch (error) {
      console.error('Error rejecting organizer:', error)
    }
  }

  const handleViewDetails = (organizerId: string) => {
    router.push(`/department/operations/organizers/${organizerId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
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

  // Helper function to get business/organization name from profile
  const getBusinessName = (organizer: Organizer) => {
    switch (organizer.organizerType) {
      case 'INDIVIDUAL':
        return organizer.individualProfile?.nik || 'N/A'
      case 'COMMUNITY':
        return organizer.communityProfile?.communityName || 'N/A'
      case 'SMALL_BUSINESS':
        return organizer.businessProfile?.businessName || 'N/A'
      case 'INSTITUTION':
        return organizer.institutionProfile?.institutionName || 'N/A'
      default:
        return 'N/A'
    }
  }

  // Helper function to check if organizer matches date filter
  const matchesDateFilter = (organizer: Organizer) => {
    const organizerDate = new Date(organizer.createdAt)
    const now = new Date()
    
    switch (dateFilter) {
      case 'TODAY':
        return organizerDate.toDateString() === now.toDateString()
      case 'THIS_WEEK':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return organizerDate >= weekAgo
      case 'THIS_MONTH':
        return organizerDate.getMonth() === now.getMonth() && organizerDate.getFullYear() === now.getFullYear()
      case 'ALL':
        return true
      default:
        return true
    }
  }

  const filteredOrganizers = organizers.filter(organizer => {
    const businessName = getBusinessName(organizer)
    const matchesSearch = organizer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organizer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || organizer.verificationStatus === statusFilter
    const matchesDate = matchesDateFilter(organizer)
    
    return matchesSearch && matchesStatus && matchesDate
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
              <h1 className="text-3xl font-bold">Organizer Review</h1>
              <p className="text-gray-600">
                Review and verify organizer applications
                {statusFilter !== 'ALL' && (
                  <span className="ml-2">
                    • Showing: <span className="font-medium">{statusFilter}</span>
                  </span>
                )}
                {dateFilter !== 'ALL' && (
                  <span className="ml-2">
                    • Period: <span className="font-medium">{dateFilter.replace('_', ' ')}</span>
                  </span>
                )}
                <span className="ml-2">
                  • Found: <span className="font-medium">{filteredOrganizers.length}</span> organizers
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                    placeholder="Search organizers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="ALL">All Time</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizers List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredOrganizers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No organizers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrganizers.map((organizer) => (
              <Card key={organizer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{organizer.fullName}</h3>
                        <Badge className={getStatusColor(organizer.verificationStatus)}>
                          {organizer.verificationStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><span className="font-medium">Email:</span> {organizer.email}</p>
                          <p><span className="font-medium">{organizer.organizerType === 'INDIVIDUAL' ? 'NIK/KTP:' : organizer.organizerType === 'COMMUNITY' ? 'Community:' : organizer.organizerType === 'SMALL_BUSINESS' ? 'Business:' : 'Institution:'}</span> {getBusinessName(organizer)}</p>
                          <p><span className="font-medium">Type:</span> {organizer.organizerType}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Phone:</span> {organizer.phoneNumber || 'N/A'}</p>
                          <p><span className="font-medium">Address:</span> {
                            organizer.individualProfile?.personalAddress ||
                            organizer.communityProfile?.businessAddress ||
                            organizer.businessProfile?.businessAddress ||
                            organizer.institutionProfile?.businessAddress ||
                            'N/A'
                          }</p>
                          <p><span className="font-medium">Applied:</span> {formatDate(organizer.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(organizer.id)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      
                      {organizer.verificationStatus === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(organizer.id)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          {(user?.role === 'OPS_HEAD' || user?.role === 'SUPER_ADMIN') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(organizer.id)}
                              className="text-xs"
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
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