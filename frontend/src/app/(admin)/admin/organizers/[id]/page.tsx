'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Building,
    User,
    Clock,
    Globe,
    FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

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

export default function OrganizerDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { user: currentUser, isAuthenticated, isInitialized } = useAuth()
    const { toast } = useToast()

    const [organizer, setOrganizer] = useState<Organizer | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        if (isInitialized) {
            if (!isAuthenticated || !currentUser) {
                router.push('/login')
                return
            }
            if (!['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(currentUser.role)) {
                router.push('/dashboard')
                return
            }
        }
    }, [isInitialized, isAuthenticated, currentUser, router])

    useEffect(() => {
        if (isAuthenticated && params.id) {
            fetchOrganizer(params.id as string)
        }
    }, [isAuthenticated, params.id])

    const fetchOrganizer = async (id: string) => {
        try {
            setLoading(true)
            const response = await ApiService.getAdminOrganizer(id)

            if (response.success && response.data?.organizer) {
                const orgData = response.data.organizer
                setOrganizer({
                    id: orgData.id,
                    fullName: orgData.fullName,
                    email: orgData.email,
                    phoneNumber: orgData.phoneNumber || '',
                    organizerType: orgData.organizerType || '',
                    verificationStatus: orgData.verificationStatus || 'PENDING',
                    businessName: orgData.businessName || '',
                    businessAddress: orgData.businessAddress || '',
                    businessPhone: orgData.businessPhone || '',
                    portfolio: orgData.portfolio || '',
                    socialMedia: orgData.socialMedia || '',
                    createdAt: orgData.createdAt,
                    verifiedAt: orgData.verifiedAt,
                    rejectedReason: orgData.rejectedReason
                })
            } else {
                throw new Error(response.message || 'Failed to fetch organizer')
            }
        } catch (err: any) {
            console.error('Fetch organizer error:', err)
            toast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to fetch organizer details'
            })
            router.push('/admin/organizers')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!organizer) return

        try {
            setActionLoading(true)
            const response = await ApiService.approveOrganizer(organizer.id)

            if (response.success) {
                toast({
                    type: 'success',
                    title: 'Success',
                    message: 'Organizer approved successfully'
                })
                await fetchOrganizer(organizer.id)
            } else {
                throw new Error(response.message || 'Failed to approve organizer')
            }
        } catch (err: any) {
            toast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to approve organizer'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!organizer || !rejectReason.trim()) {
            toast({
                type: 'error',
                title: 'Validation Error',
                message: 'Rejection reason is required'
            })
            return
        }

        try {
            setActionLoading(true)
            const response = await ApiService.rejectOrganizer(organizer.id, rejectReason.trim())

            if (response.success) {
                toast({
                    type: 'success',
                    title: 'Success',
                    message: 'Organizer rejected successfully'
                })
                setRejectDialogOpen(false)
                setRejectReason('')
                await fetchOrganizer(organizer.id)
            } else {
                throw new Error(response.message || 'Failed to reject organizer')
            }
        } catch (err: any) {
            toast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to reject organizer'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review', icon: Clock },
            'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Approved', icon: CheckCircle },
            'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: XCircle },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
        const Icon = config.icon

        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config.text}
            </Badge>
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
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (!isInitialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!organizer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <User className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Organizer Not Found</h2>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/organizers')}>
                    Back to Organizers
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/organizers')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Organizer Details</h1>
                        <p className="text-sm text-gray-500">View and manage organizer information</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {organizer.verificationStatus === 'PENDING' && (
                        <>
                            <Button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {actionLoading ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve
                            </Button>
                            <Button
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={actionLoading}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <div className="h-24 w-24 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                                <span className="text-3xl font-bold text-blue-600">
                                    {organizer.fullName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{organizer.fullName}</h2>
                            <p className="text-sm text-gray-500 mb-4">{organizer.email}</p>

                            <div className="flex flex-col gap-2 mb-6 w-full">
                                {getStatusBadge(organizer.verificationStatus)}
                                <Badge variant="outline" className="w-full justify-center">
                                    {getOrganizerTypeLabel(organizer.organizerType)}
                                </Badge>
                            </div>

                            <div className="w-full space-y-3 text-sm border-t pt-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Applied</span>
                                    <span className="font-medium">{formatDate(organizer.createdAt)}</span>
                                </div>
                                {organizer.verifiedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Verified</span>
                                        <span className="font-medium">{formatDate(organizer.verifiedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{organizer.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Phone Number</p>
                                        <p className="font-medium">{organizer.phoneNumber || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Organizer Type</p>
                                        <p className="font-medium">{getOrganizerTypeLabel(organizer.organizerType)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <div className="mt-1">
                                            {getStatusBadge(organizer.verificationStatus)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Business/Organization Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Business/Organization Name</p>
                                        <p className="font-medium">{organizer.businessName || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Business Phone</p>
                                        <p className="font-medium">{organizer.businessPhone || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 md:col-span-2">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">Business Address</p>
                                        <p className="font-medium">{organizer.businessAddress || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Portfolio & Social Media */}
                    {(organizer.portfolio || organizer.socialMedia) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Portfolio & Social Media</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {organizer.portfolio && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Portfolio</p>
                                            <a
                                                href={organizer.portfolio}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-medium break-all"
                                            >
                                                {organizer.portfolio}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {organizer.socialMedia && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Social Media</p>
                                            <p className="font-medium">{organizer.socialMedia}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Rejection Reason */}
                    {organizer.rejectedReason && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-900">Rejection Reason</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-800">{organizer.rejectedReason}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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
                        <div>
                            <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This reason will be sent to the organizer via email.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false)
                                setRejectReason('')
                            }}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || actionLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {actionLoading ? (
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

