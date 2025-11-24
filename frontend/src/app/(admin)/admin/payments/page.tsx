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
    Filter,
    Download,
    RefreshCw,
    DollarSign,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Calendar,
    CreditCard
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

interface Payment {
    id: string
    paymentReference: string
    amount: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
    updatedAt: string
    user: {
        id: string
        fullName: string
        email: string
    }
    registration?: {
        event?: {
            id: string
            title: string
        }
    }
}

interface PaymentStats {
    total: number
    totalAmount: number
    paid: number
    paidAmount: number
    pending: number
    pendingAmount: number
    failed: number
    failedAmount: number
    byMethod: Record<string, { count: number; amount: number }>
    byStatus: Record<string, { count: number; amount: number }>
}

export default function AdminPaymentsPage() {
    const router = useRouter()
    const { user: currentUser, isAuthenticated, isInitialized } = useAuth()
    const { toast } = useToast()

    const [payments, setPayments] = useState<Payment[]>([])
    const [stats, setStats] = useState<PaymentStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [methodFilter, setMethodFilter] = useState<string>('ALL')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        if (isInitialized) {
            if (!isAuthenticated || !currentUser) {
                router.push('/login')
                return
            }
            if (!['ADMIN', 'SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_AGENT'].includes(currentUser.role)) {
                router.push('/dashboard')
                return
            }
        }
    }, [isInitialized, isAuthenticated, currentUser, router])

    useEffect(() => {
        if (isAuthenticated && ['ADMIN', 'SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_AGENT'].includes(currentUser?.role || '')) {
            fetchPayments()
            fetchStats()
        }
    }, [isAuthenticated, currentUser, page, statusFilter, methodFilter, startDate, endDate])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                setPage(1)
                fetchPayments()
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchPayments = async () => {
        try {
            setLoading(true)
            setError(null)

            const params: any = {
                page,
                limit: 20,
            }

            if (searchQuery) params.search = searchQuery
            if (statusFilter !== 'ALL') params.status = statusFilter
            if (methodFilter !== 'ALL') params.paymentMethod = methodFilter
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const response = await ApiService.getAdminPayments(params)

            if (response.success && response.data) {
                setPayments(response.data.payments || [])
                setTotalPages(response.data.pagination?.pages || 1)
                setTotalCount(response.data.pagination?.total || 0)
            } else {
                throw new Error(response.message || 'Failed to fetch payments')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch payments')
            console.error('Fetch payments error:', err)
            toast({
                type: 'error',
                title: 'Error',
                message: err.message || 'Failed to fetch payments'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const params: any = {}
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const response = await ApiService.getAdminPaymentStats(params)

            if (response.success && response.data?.stats) {
                setStats(response.data.stats)
            }
        } catch (err) {
            console.error('Fetch stats error:', err)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([fetchPayments(), fetchStats()])
        setRefreshing(false)
    }

    const handleExport = () => {
        toast({
            type: 'info',
            title: 'Export',
            message: 'Export functionality will be implemented soon.'
        })
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'PAID': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            'FAILED': { color: 'bg-red-100 text-red-800', icon: XCircle },
            'CANCELLED': { color: 'bg-gray-100 text-gray-800', icon: XCircle },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numAmount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Monitoring</h1>
                    <p className="text-gray-600 mt-1">Monitor and manage all payment transactions</p>
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

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(stats.totalAmount)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(stats.paidAmount)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(stats.pendingAmount)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(stats.failedAmount)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search by reference, user name, or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="method">Payment Method</Label>
                            <Select value={methodFilter} onValueChange={setMethodFilter}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Methods</SelectItem>
                                    <SelectItem value="QR_CODE">QR Code</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    <SelectItem value="CRYPTO">Crypto</SelectItem>
                                    <SelectItem value="GATEWAY">Gateway</SelectItem>
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
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>
                        Showing {payments.length} of {totalCount} payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
                            <p className="text-gray-600">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {payment.paymentReference}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{payment.user.fullName}</div>
                                                        <div className="text-xs text-gray-500">{payment.user.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {payment.registration?.event?.title || '-'}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{payment.paymentMethod.replace('_', ' ')}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(payment.paymentStatus)}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {formatDate(payment.createdAt)}
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

            {/* Payment Method & Status Breakdown */}
            {stats && (Object.keys(stats.byMethod).length > 0 || Object.keys(stats.byStatus).length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>By Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.byMethod).map(([method, data]) => (
                                    <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{method.replace('_', ' ')}</p>
                                            <p className="text-sm text-gray-500">{data.count} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(data.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>By Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.byStatus).map(([status, data]) => (
                                    <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{status}</p>
                                            <p className="text-sm text-gray-500">{data.count} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(data.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

