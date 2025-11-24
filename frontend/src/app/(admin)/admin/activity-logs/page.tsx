'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import {
    Search,
    Download,
    RefreshCw,
    Activity,
    User,
    Calendar,
    Filter,
    Eye,
    FileText
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ActivityLog {
    id: string
    action: string
    entityType: string | null
    entityId: string | null
    description: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    user: {
        id: string
        fullName: string
        email: string
        role: string
    }
}

export default function AdminActivityLogsPage() {
    const router = useRouter()
    const { user: currentUser, isAuthenticated, isInitialized } = useAuth()
    const { toast } = useToast()

    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [userIdFilter, setUserIdFilter] = useState<string>('')
    const [actionFilter, setActionFilter] = useState<string>('ALL')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    // Detail Dialog
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    // Available users for filter (would need to fetch from API)
    const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; fullName: string; email: string }>>([])

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
        if (isAuthenticated && ['ADMIN', 'SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(currentUser?.role || '')) {
            fetchLogs()
            fetchUsers()
        }
    }, [isAuthenticated, currentUser, page, userIdFilter, actionFilter, startDate, endDate, sortBy, sortOrder])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                setPage(1)
                fetchLogs()
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchUsers = async () => {
        try {
            const response = await ApiService.getAdminUsers({ limit: 100 })
            if (response.success && response.data?.users) {
                setAvailableUsers(response.data.users.map((u: any) => ({
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email
                })))
            }
        } catch (err) {
            console.error('Fetch users error:', err)
        }
    }

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)

            const params: any = {
                page,
                limit: 50,
                sortBy,
                sortOrder,
            }

            if (userIdFilter) params.userId = userIdFilter
            if (actionFilter !== 'ALL') params.action = actionFilter
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const response = await ApiService.getAdminActivityLogs(params)

            if (response.success && response.data) {
                let filteredLogs = response.data.logs || []

                // Client-side search if searchQuery exists
                if (searchQuery) {
                    const query = searchQuery.toLowerCase()
                    filteredLogs = filteredLogs.filter((log: ActivityLog) =>
                        log.action?.toLowerCase().includes(query) ||
                        log.description?.toLowerCase().includes(query) ||
                        log.user?.fullName?.toLowerCase().includes(query) ||
                        log.user?.email?.toLowerCase().includes(query) ||
                        log.entityType?.toLowerCase().includes(query)
                    )
                }

                setLogs(filteredLogs)
                setTotalPages(response.data.pagination?.pages || 1)
                setTotalCount(response.data.pagination?.total || 0)
            } else {
                throw new Error(response.message || 'Failed to fetch activity logs')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch activity logs')
            console.error('Fetch logs error:', err)
            toast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to fetch activity logs'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchLogs()
        setRefreshing(false)
    }

    const handleExport = () => {
        toast({
            type: 'info',
            title: 'Export',
            message: 'Export functionality will be implemented soon.'
        })
    }

    const handleViewDetails = (log: ActivityLog) => {
        setSelectedLog(log)
        setDetailDialogOpen(true)
    }

    const getActionBadgeColor = (action: string) => {
        const actionColors: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-800',
            'UPDATE': 'bg-blue-100 text-blue-800',
            'DELETE': 'bg-red-100 text-red-800',
            'APPROVE': 'bg-green-100 text-green-800',
            'REJECT': 'bg-red-100 text-red-800',
            'LOGIN': 'bg-purple-100 text-purple-800',
            'LOGOUT': 'bg-gray-100 text-gray-800',
            'VIEW': 'bg-gray-100 text-gray-800',
        }
        return actionColors[action] || 'bg-gray-100 text-gray-800'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                    <p className="text-gray-600 mt-1">Monitor and audit all user activities</p>
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
                        onClick={handleExport}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search by action, description, user..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="user">User</Label>
                            <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Users</SelectItem>
                                    {availableUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.fullName} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="action">Action</Label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                    <SelectItem value="APPROVE">Approve</SelectItem>
                                    <SelectItem value="REJECT">Reject</SelectItem>
                                    <SelectItem value="LOGIN">Login</SelectItem>
                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                    <SelectItem value="VIEW">View</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="sortBy">Sort By</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt">Date</SelectItem>
                                    <SelectItem value="action">Action</SelectItem>
                                    <SelectItem value="entityType">Entity Type</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="sortOrder">Order</Label>
                            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">Newest First</SelectItem>
                                    <SelectItem value="asc">Oldest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>
                        Showing {logs.length} of {totalCount} logs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity logs found</h3>
                            <p className="text-gray-600">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-sm text-gray-500">
                                                    {formatDateShort(log.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{log.user?.fullName || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{log.user?.email || '-'}</div>
                                                        <div className="text-xs text-gray-400">{log.user?.role || '-'}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {log.entityType && (
                                                            <span className="text-sm font-medium">{log.entityType}</span>
                                                        )}
                                                        {log.entityId && (
                                                            <div className="text-xs text-gray-500 font-mono">{log.entityId.substring(0, 8)}...</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-md">
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {log.description || '-'}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(log)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                                    <div className="text-sm text-gray-500">
                                        Page {page} of {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Activity Log Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about this activity log entry
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Date & Time</Label>
                                    <p className="text-sm font-medium">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Action</Label>
                                    <p className="text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">User</Label>
                                    <p className="text-sm font-medium">{selectedLog.user?.fullName || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{selectedLog.user?.email || '-'}</p>
                                    <p className="text-xs text-gray-400">{selectedLog.user?.role || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Entity Type</Label>
                                    <p className="text-sm font-medium">{selectedLog.entityType || '-'}</p>
                                </div>
                                {selectedLog.entityId && (
                                    <div>
                                        <Label className="text-xs text-gray-500">Entity ID</Label>
                                        <p className="text-sm font-mono">{selectedLog.entityId}</p>
                                    </div>
                                )}
                                {selectedLog.ipAddress && (
                                    <div>
                                        <Label className="text-xs text-gray-500">IP Address</Label>
                                        <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                                    </div>
                                )}
                            </div>
                            {selectedLog.description && (
                                <div>
                                    <Label className="text-xs text-gray-500">Description</Label>
                                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                                        {selectedLog.description}
                                    </p>
                                </div>
                            )}
                            {selectedLog.userAgent && (
                                <div>
                                    <Label className="text-xs text-gray-500">User Agent</Label>
                                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg break-all">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

