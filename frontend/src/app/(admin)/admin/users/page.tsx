'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import {
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    User as UserIcon,
    LayoutGrid,
    List,
    Plus,
    Download,
    Trash2,
    Edit
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"

interface User {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    role: string
    isEmailVerified: boolean
    createdAt: string
    lastActive?: string
    avatarUrl?: string
    address?: string
    organizerType?: string
    stats?: {
        eventsCreated?: number
        registrations?: number
    }
}

export default function AdminUsersPage() {
    const router = useRouter()
    const { user: currentUser, isAuthenticated, isInitialized } = useAuth()
    const { toast } = useToast()

    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('ALL')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (isInitialized) {
            if (!isAuthenticated || !currentUser) {
                router.push('/login')
                return
            }
            if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
                router.push('/404')
                return
            }
        }
    }, [isInitialized, isAuthenticated, currentUser, router])

    useEffect(() => {
        if (isAuthenticated && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN')) {
            const timer = setTimeout(() => {
                fetchUsers()
            }, 500) // Debounce search
            return () => clearTimeout(timer)
        }
    }, [isAuthenticated, currentUser, searchQuery, roleFilter, page])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await ApiService.getAdminUsers({
                page,
                limit: 12,
                search: searchQuery,
                role: roleFilter === 'ALL' ? undefined : roleFilter
            })

            if (response.success) {
                setUsers(response.data.users || [])
                setTotalPages(response.data.pagination?.pages || 1)
            } else {
                setError('Failed to fetch users')
            }
        } catch (err) {
            console.error('Fetch users error:', err)
            // Fallback mock data
            setUsers([
                {
                    id: '1',
                    fullName: 'Rebecca Fox',
                    email: 'rebecca@example.com',
                    phoneNumber: '081234567890',
                    role: 'SUPER_ADMIN',
                    isEmailVerified: true,
                    createdAt: '2025-01-15T00:00:00Z',
                    avatarUrl: 'https://i.pravatar.cc/150?u=rebecca',
                    stats: { registrations: 120, eventsCreated: 5 }
                },
                {
                    id: '2',
                    fullName: 'Stanis Ryle',
                    email: 'stanis@example.com',
                    phoneNumber: '081234567890',
                    role: 'ADMIN',
                    isEmailVerified: true,
                    createdAt: '2025-02-20T00:00:00Z',
                    avatarUrl: 'https://i.pravatar.cc/150?u=stanis',
                    stats: { registrations: 45, eventsCreated: 12 }
                },
                {
                    id: '3',
                    fullName: 'Brian Lord',
                    email: 'brian@example.com',
                    phoneNumber: '081234567890',
                    role: 'ORGANIZER',
                    isEmailVerified: true,
                    createdAt: '2025-03-10T00:00:00Z',
                    organizerType: 'INDIVIDUAL',
                    avatarUrl: 'https://i.pravatar.cc/150?u=brian',
                    stats: { registrations: 0, eventsCreated: 8 }
                },
                {
                    id: '4',
                    fullName: 'Diane Hall',
                    email: 'diane@example.com',
                    phoneNumber: '+6281234567903',
                    role: 'ORGANIZER',
                    isEmailVerified: true,
                    createdAt: '2025-04-05T00:00:00Z',
                    organizerType: 'COMMUNITY',
                    avatarUrl: 'https://i.pravatar.cc/150?u=diane',
                    stats: { registrations: 0, eventsCreated: 3 }
                },
                {
                    id: '5',
                    fullName: 'Marie Goodwin',
                    email: 'marie@example.com',
                    phoneNumber: '+6281234567902',
                    role: 'PARTICIPANT',
                    isEmailVerified: true,
                    createdAt: '2025-05-12T00:00:00Z',
                    avatarUrl: 'https://i.pravatar.cc/150?u=marie',
                    stats: { registrations: 5 }
                },
                {
                    id: '6',
                    fullName: 'Taylor Hardy',
                    email: 'taylor@example.com',
                    phoneNumber: '+6281234567901',
                    role: 'PARTICIPANT',
                    isEmailVerified: false,
                    createdAt: '2025-06-25T00:00:00Z',
                    stats: { registrations: 2 }
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!userToDelete) return

        try {
            setIsDeleting(true)
            // Call API
            await ApiService.deleteAdminUser(userToDelete.id)

            // Update UI
            setUsers(users.filter(u => u.id !== userToDelete.id))
            toast({
                title: "User deleted",
                description: `${userToDelete.fullName} has been successfully deleted.`,
                variant: "default"
            })
        } catch (err) {
            console.error('Delete user error:', err)
            toast({
                title: "Error",
                description: "Failed to delete user. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
            case 'ADMIN': return 'bg-blue-100 text-blue-800'
            case 'ORGANIZER': return 'bg-orange-100 text-orange-800'
            case 'PARTICIPANT': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusBadge = (isVerified: boolean) => {
        if (isVerified) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                </span>
            )
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <XCircle className="w-3 h-3 mr-1" />
                Unverified
            </span>
        )
    }

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500">Manage users and their roles</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="PARTICIPANT">Participant</option>
                    </select>

                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <div className="w-px h-full bg-gray-200" />
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-semibold text-gray-500">
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                                            <p className="text-xs text-gray-500">@{user.email.split('@')[0]}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                Edit User
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-900 mb-1">{user.role.replace('_', ' ')}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(user.isEmailVerified)}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Joined {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-semibold text-gray-500">
                                                        {user.fullName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.fullName}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{user.phoneNumber || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(user.isEmailVerified)}</TableCell>
                                    <TableCell className="text-gray-500">{formatDate(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteClick(user)}
                                                >
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination (Static for now) */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{users.length}</span> of <span className="font-medium">{users.length}</span> results
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{userToDelete?.fullName}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
