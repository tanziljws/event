'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { OperationsLayout } from '@/components/layout/operations-layout'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  FileText,
  Download,
  Eye
} from 'lucide-react'

interface OrganizerDetails {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  address: string
  lastEducation: string
  organizerType: string
  verificationStatus: string
  createdAt: string
  verifiedAt?: string
  rejectedReason?: string
  portfolio?: string
  socialMedia?: string
  individualProfile?: {
    nik?: string
    personalAddress?: string
    personalPhone?: string
    portfolio?: string[]
    socialMedia?: any
    documents?: string[]
  }
  communityProfile?: {
    communityName?: string
    communityType?: string
    businessAddress?: string
    businessPhone?: string
    contactPerson?: string
    legalDocument?: string
    website?: string
    socialMedia?: any
    documents?: string[]
  }
  businessProfile?: {
    businessName?: string
    businessType?: string
    businessAddress?: string
    businessPhone?: string
    npwp?: string
    legalDocument?: string
    logo?: string
    socialMedia?: any
    portfolio?: string[]
    documents?: string[]
  }
  institutionProfile?: {
    institutionName?: string
    institutionType?: string
    businessAddress?: string
    businessPhone?: string
    contactPerson?: string
    akta?: string
    siup?: string
    website?: string
    socialMedia?: any
    documents?: string[]
  }
}

export default function OrganizerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [organizer, setOrganizer] = useState<OrganizerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const organizerId = params.id as string

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
    if (isAuthenticated && user && organizerId) {
      fetchOrganizerDetails()
    }
  }, [isAuthenticated, user, organizerId])

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getOrganizerDetails(organizerId)
      if (response.success) {
        setOrganizer(response.data)
      } else {
        setError(response.message || 'Failed to fetch organizer details')
      }
    } catch (error) {
      console.error('Error fetching organizer details:', error)
      setError('Failed to fetch organizer details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      const response = await ApiService.approveOrganizer(organizerId)
      if (response.success) {
        await fetchOrganizerDetails()
      }
    } catch (error) {
      console.error('Error approving organizer:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      setActionLoading(true)
      const response = await ApiService.rejectOrganizer(organizerId, reason)
      if (response.success) {
        await fetchOrganizerDetails()
      }
    } catch (error) {
      console.error('Error rejecting organizer:', error)
    } finally {
      setActionLoading(false)
    }
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isInitialized || loading) {
    return (
      <OperationsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </OperationsLayout>
    )
  }

  if (error) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </OperationsLayout>
    )
  }

  if (!organizer) {
    return (
      <OperationsLayout>
        <div className="text-center">
          <p className="text-gray-600">Organizer not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </OperationsLayout>
    )
  }

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Details</h1>
              <p className="text-gray-600 mt-1">Review organizer information and verification status</p>
            </div>
          </div>
          
          {organizer.verificationStatus === 'PENDING' && (
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                variant="destructive"
                size="sm"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* Organizer Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold">{organizer.fullName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <p>{organizer.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <p>{organizer.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <p>{organizer.address || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Last Education</label>
                <p>{organizer.lastEducation || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Organizer Type</label>
                <Badge className="ml-2">{organizer.organizerType}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {organizer.organizerType === 'INDIVIDUAL' ? 'NIK/KTP' : 
                   organizer.organizerType === 'COMMUNITY' ? 'Community Name' :
                   organizer.organizerType === 'SMALL_BUSINESS' ? 'Business Name' : 'Institution Name'}
                </label>
                <p className="font-semibold">
                  {organizer.organizerType === 'INDIVIDUAL' ? organizer.individualProfile?.nik || 'Not provided' :
                   organizer.organizerType === 'COMMUNITY' ? organizer.communityProfile?.communityName || 'Not provided' :
                   organizer.organizerType === 'SMALL_BUSINESS' ? organizer.businessProfile?.businessName || 'Not provided' :
                   organizer.institutionProfile?.institutionName || 'Not provided'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {organizer.organizerType === 'INDIVIDUAL' ? 'Personal Address' :
                   organizer.organizerType === 'COMMUNITY' ? 'Sekretariat Address' :
                   organizer.organizerType === 'SMALL_BUSINESS' ? 'Business Address' : 'Institution Address'}
                </label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <p>
                    {organizer.individualProfile?.personalAddress ||
                     organizer.communityProfile?.businessAddress ||
                     organizer.businessProfile?.businessAddress ||
                     organizer.institutionProfile?.businessAddress ||
                     'Not provided'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {organizer.organizerType === 'INDIVIDUAL' ? 'Personal Phone' :
                   organizer.organizerType === 'COMMUNITY' ? 'PIC Phone' :
                   organizer.organizerType === 'SMALL_BUSINESS' ? 'Business Phone' : 'Institution Phone'}
                </label>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <p>
                    {organizer.individualProfile?.personalPhone ||
                     organizer.communityProfile?.businessPhone ||
                     organizer.businessProfile?.businessPhone ||
                     organizer.institutionProfile?.businessPhone ||
                     'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Status & Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Verification Status</label>
                <Badge className={`ml-2 ${getStatusColor(organizer.verificationStatus)}`}>
                  {organizer.verificationStatus}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <p>{formatDate(organizer.createdAt)}</p>
                </div>
              </div>
              
              {organizer.verifiedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Verified Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{formatDate(organizer.verifiedAt)}</p>
                  </div>
                </div>
              )}
              
              {organizer.rejectedReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                  <p className="text-red-600 bg-red-50 p-2 rounded">{organizer.rejectedReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portfolio & Social Media */}
        {(organizer.portfolio || organizer.socialMedia || 
          organizer.individualProfile?.portfolio?.length || 
          organizer.businessProfile?.portfolio?.length) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="mr-2 h-5 w-5" />
                Portfolio & Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organizer.portfolio && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Portfolio</label>
                  <div className="mt-1">
                    <a 
                      href={organizer.portfolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {organizer.portfolio}
                    </a>
                  </div>
                </div>
              )}
              
              {organizer.individualProfile?.portfolio && organizer.individualProfile.portfolio.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Portfolio Links</label>
                  <div className="mt-1 space-y-2">
                    {organizer.individualProfile.portfolio.map((url, index) => (
                      <div key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {organizer.businessProfile?.portfolio && organizer.businessProfile.portfolio.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Portfolio Links</label>
                  <div className="mt-1 space-y-2">
                    {organizer.businessProfile.portfolio.map((url, index) => (
                      <div key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {organizer.socialMedia && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Social Media</label>
                  <div className="mt-1">
                    <a 
                      href={organizer.socialMedia} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {organizer.socialMedia}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uploaded Documents */}
        {(organizer.individualProfile?.documents?.length || 
          organizer.communityProfile?.documents?.length || 
          organizer.businessProfile?.documents?.length || 
          organizer.institutionProfile?.documents?.length) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Uploaded Documents
              </CardTitle>
              <CardDescription>
                Legal documents and certificates submitted by the organizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Individual Profile Documents */}
                {organizer.individualProfile?.documents && organizer.individualProfile.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Individual Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizer.individualProfile.documents.map((docUrl, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center flex-1">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Document {index + 1}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{docUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={docUrl}
                              download
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Profile Documents */}
                {organizer.communityProfile?.documents && organizer.communityProfile.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Community Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizer.communityProfile.documents.map((docUrl, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center flex-1">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Document {index + 1}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{docUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={docUrl}
                              download
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Profile Documents */}
                {organizer.businessProfile?.documents && organizer.businessProfile.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Business Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizer.businessProfile.documents.map((docUrl, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center flex-1">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Document {index + 1}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{docUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={docUrl}
                              download
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Institution Profile Documents */}
                {organizer.institutionProfile?.documents && organizer.institutionProfile.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Institution Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizer.institutionProfile.documents.map((docUrl, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center flex-1">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Document {index + 1}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{docUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={docUrl}
                              download
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OperationsLayout>
  )
}
