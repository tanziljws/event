'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Shield,
  ShieldCheck
} from 'lucide-react'

interface AdminUser {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  address: string
  lastEducation: string
  role: 'ADMIN' | 'PARTICIPANT'
  emailVerified: boolean
  lastActivity: string | null
  createdAt: string
  _count: {
    eventRegistrations: number
    createdEvents: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      fetchUsers()
    }
  }, [page, search, roleFilter, isAuthenticated, user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getAdminUsers({
        page,
        limit: 12,
        search: search || undefined,
        role: roleFilter || undefined
      })
      
      if (response.success) {
        setUsers(response.data.users || [])
        setTotalPages(response.data.pagination?.pages || 1)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Users error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return 'Never'
    const date = new Date(lastActivity)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(lastActivity)
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage all users in your system</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="PARTICIPANT">Participant</option>
            </select>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUsers}>Try Again</Button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{user.fullName}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role === 'ADMIN' ? (
                        <Shield className="mr-1 h-3 w-3" />
                      ) : (
                        <User className="mr-1 h-3 w-3" />
                      )}
                      {user.role}
                    </Badge>
                    <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
                      {user.emailVerified ? (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <Shield className="mr-1 h-3 w-3" />
                      )}
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    {user.phoneNumber}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {user.address}
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {user.lastEducation}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-900">{user._count.eventRegistrations}</div>
                    <div className="text-gray-500">Registrations</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-900">{user._count.createdEvents}</div>
                    <div className="text-gray-500">Events Created</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Last active: {formatLastActivity(user.lastActivity)}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
