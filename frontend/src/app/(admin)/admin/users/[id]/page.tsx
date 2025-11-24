'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    Shield,
    Briefcase,
    Calendar,
    CheckCircle,
    XCircle,
    Building,
    Globe,
    Lock
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

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
    businessName?: string
    businessAddress?: string
    businessPhone?: string
    portfolio?: string
    socialMedia?: string
}

export default function EditUserPage() {
    const router = useRouter()
    const params = useParams()
    const { user: currentUser, isAuthenticated, isInitialized } = useAuth()
    const { toast } = useToast()

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('general')
    
    // Reset Password Dialog
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resettingPassword, setResettingPassword] = useState(false)
    
    // Suspend State
    const [isSuspended, setIsSuspended] = useState(false)
    const [suspending, setSuspending] = useState(false)
    
    // Activity Logs
    const [activityLogs, setActivityLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        role: '',
        isEmailVerified: false,
        organizerType: '',
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        portfolio: '',
        socialMedia: ''
    })

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
        if (isAuthenticated && params.id) {
            fetchUser(params.id as string)
        }
    }, [isAuthenticated, params.id])
    
    useEffect(() => {
        if (activeTab === 'activity' && user) {
            fetchActivityLogs()
        }
    }, [activeTab, user])

    const fetchUser = async (id: string) => {
        try {
            setLoading(true)
            const response = await ApiService.getAdminUser(id)

            if (response.success && response.data.user) {
                const userData = response.data.user
                setUser(userData)
                setFormData({
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address || '',
                    role: userData.role || 'PARTICIPANT',
                    isEmailVerified: userData.isEmailVerified || false,
                    organizerType: userData.organizerType || '',
                    businessName: userData.businessName || '',
                    businessAddress: userData.businessAddress || '',
                    businessPhone: userData.businessPhone || '',
                    portfolio: userData.portfolio || '',
                    socialMedia: userData.socialMedia || ''
                })
                
                // Check if user is suspended (verificationStatus === 'REJECTED' with reason 'SUSPENDED_BY_ADMIN')
                const isSuspendedUser = userData.verificationStatus === 'REJECTED' && 
                    (userData.rejectedReason?.includes('SUSPENDED') || userData.rejectedReason?.includes('SUSPEND'))
                setIsSuspended(isSuspendedUser)
            } else {
                // Fallback mock data for demo/development if API fails or returns empty
                const mockUser: User = {
                    id: id,
                    fullName: 'Rebecca Fox',
                    email: 'rebecca@example.com',
                    phoneNumber: '081234567890',
                    role: 'SUPER_ADMIN',
                    isEmailVerified: true,
                    createdAt: '2025-01-15T00:00:00Z',
                    avatarUrl: 'https://i.pravatar.cc/150?u=rebecca',
                    address: 'Jakarta, Indonesia',
                    lastActive: '2025-11-23T10:00:00Z'
                }
                setUser(mockUser)
                setFormData({
                    fullName: mockUser.fullName,
                    email: mockUser.email,
                    phoneNumber: mockUser.phoneNumber,
                    address: mockUser.address || '',
                    role: mockUser.role,
                    isEmailVerified: mockUser.isEmailVerified,
                    organizerType: '',
                    businessName: '',
                    businessAddress: '',
                    businessPhone: '',
                    portfolio: '',
                    socialMedia: ''
                })
            }
        } catch (err: any) {
            console.error('Fetch user error:', err)
            toast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to fetch user details."
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!user) return

        try {
            setSaving(true)
            await ApiService.updateAdminUser(user.id, formData)

            toast({
                type: "success",
                title: "Success",
                message: "User profile updated successfully."
            })

            // Refresh user data
            fetchUser(user.id)
        } catch (err: any) {
            console.error('Update user error:', err)
            toast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to update user profile."
            })
        } finally {
            setSaving(false)
        }
    }
    
    const handleResetPassword = async () => {
        if (!user || !newPassword || !confirmPassword) {
            toast({
                type: "error",
                title: "Validation Error",
                message: "Please fill in both password fields."
            })
            return
        }
        
        if (newPassword !== confirmPassword) {
            toast({
                type: "error",
                title: "Validation Error",
                message: "Passwords do not match."
            })
            return
        }
        
        if (newPassword.length < 8) {
            toast({
                type: "error",
                title: "Validation Error",
                message: "Password must be at least 8 characters."
            })
            return
        }
        
        try {
            setResettingPassword(true)
            const response = await ApiService.resetUserPassword(user.id, newPassword)
            
            if (response.success) {
                toast({
                    type: "success",
                    title: "Success",
                    message: "Password reset successfully."
                })
                setResetPasswordDialogOpen(false)
                setNewPassword('')
                setConfirmPassword('')
            } else {
                throw new Error(response.message || 'Failed to reset password')
            }
        } catch (err: any) {
            console.error('Reset password error:', err)
            toast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to reset password."
            })
        } finally {
            setResettingPassword(false)
        }
    }
    
    const handleSuspendToggle = async () => {
        if (!user) return
        
        try {
            setSuspending(true)
            const newSuspendedState = !isSuspended
            const response = await ApiService.suspendUser(user.id, newSuspendedState)
            
            if (response.success) {
                setIsSuspended(newSuspendedState)
                toast({
                    type: "success",
                    title: "Success",
                    message: newSuspendedState ? "User suspended successfully." : "User unsuspended successfully."
                })
                // Refresh user data
                fetchUser(user.id)
            } else {
                throw new Error(response.message || 'Failed to update suspend status')
            }
        } catch (err: any) {
            console.error('Suspend toggle error:', err)
            toast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to update suspend status."
            })
        } finally {
            setSuspending(false)
        }
    }
    
    const handleChangeRole = async (newRole: string) => {
        if (!user) return
        
        try {
            setSaving(true)
            const response = await ApiService.changeUserRole(user.id, newRole)
            
            if (response.success) {
                setFormData({ ...formData, role: newRole })
                toast({
                    type: "success",
                    title: "Success",
                    message: "User role updated successfully."
                })
                // Refresh user data
                fetchUser(user.id)
            } else {
                throw new Error(response.message || 'Failed to change role')
            }
        } catch (err: any) {
            console.error('Change role error:', err)
            toast({
                type: "error",
                title: "Error",
                message: err.message || "Failed to change user role."
            })
        } finally {
            setSaving(false)
        }
    }
    
    const fetchActivityLogs = async () => {
        if (!user) return
        
        try {
            setLoadingLogs(true)
            const response = await ApiService.getUserActivity(user.id, 50)
            
            if (response.success && response.data?.logs) {
                setActivityLogs(response.data.logs)
            }
        } catch (err) {
            console.error('Fetch activity logs error:', err)
            toast({
                type: "error",
                title: "Error",
                message: "Failed to fetch activity logs."
            })
        } finally {
            setLoadingLogs(false)
        }
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

    if (!isInitialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <UserIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">User Not Found</h2>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
                    Back to Users
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                        <p className="text-sm text-gray-500">Manage user profile and settings</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/users')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-gray-400">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                            <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                            <div className="flex gap-2 mb-6">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                    {user.role.replace('_', ' ')}
                                </span>
                                {user.isEmailVerified ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Unverified
                                    </span>
                                )}
                            </div>

                            <Separator className="my-4" />

                            <div className="w-full space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Last Active</span>
                                    <span className="font-medium">{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Verified</Label>
                                    <p className="text-xs text-gray-500">Is this user's email verified?</p>
                                </div>
                                <Switch
                                    checked={formData.isEmailVerified}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isEmailVerified: checked })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Suspend Account</Label>
                                    <p className="text-xs text-gray-500">Suspend or unsuspend this user account</p>
                                </div>
                                <Switch
                                    checked={isSuspended}
                                    onCheckedChange={handleSuspendToggle}
                                    disabled={suspending}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Forms */}
                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="general">General Info</TabsTrigger>
                            <TabsTrigger value="security">Security & Role</TabsTrigger>
                            <TabsTrigger value="organizer" disabled={formData.role !== 'ORGANIZER'}>Organizer Info</TabsTrigger>
                            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Information</CardTitle>
                                    <CardDescription>Update user's personal details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="fullName"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="pl-10 bg-gray-50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="phone"
                                                    value={formData.phoneNumber}
                                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="address"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security & Role</CardTitle>
                                    <CardDescription>Manage user role and security settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">User Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={handleChangeRole}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="ORGANIZER">Organizer</SelectItem>
                                                <SelectItem value="PARTICIPANT">Participant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">
                                            Changing the role will affect the user's permissions and access levels.
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">Password</h3>
                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-full border">
                                                    <Lock className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Reset Password</p>
                                                    <p className="text-xs text-gray-500">Set a new password for this user.</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setResetPasswordDialogOpen(true)}
                                            >
                                                Reset Password
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="organizer">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organizer Information</CardTitle>
                                    <CardDescription>Details for organizer profile.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="organizerType">Organizer Type</Label>
                                            <Select
                                                value={formData.organizerType}
                                                onValueChange={(value) => setFormData({ ...formData, organizerType: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                                    <SelectItem value="COMMUNITY">Community</SelectItem>
                                                    <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
                                                    <SelectItem value="INSTITUTION">Institution</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="businessName">Business/Community Name</Label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="businessName"
                                                    value={formData.businessName}
                                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="portfolio">Portfolio URL</Label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="portfolio"
                                                    value={formData.portfolio}
                                                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="activity">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Logs</CardTitle>
                                    <CardDescription>View user activity and actions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingLogs ? (
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner size="lg" />
                                        </div>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No activity logs found for this user.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activityLogs.map((log: any, index: number) => (
                                                <div key={log.id || index} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-medium text-gray-900">{log.action || 'Unknown Action'}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {log.entityType && `• ${log.entityType}`}
                                                                </span>
                                                            </div>
                                                            {log.description && (
                                                                <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                                                                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            
            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {user?.fullName}. The user will need to use this password to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                minLength={8}
                            />
                            <p className="text-xs text-gray-500">Password must be at least 8 characters.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                minLength={8}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResetPasswordDialogOpen(false)
                                setNewPassword('')
                                setConfirmPassword('')
                            }}
                            disabled={resettingPassword}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={resettingPassword || !newPassword || !confirmPassword}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {resettingPassword ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
