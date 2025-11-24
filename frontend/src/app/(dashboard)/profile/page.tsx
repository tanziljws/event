'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User, Mail, Save, ArrowLeft, Shield, CheckCircle, XCircle, Clock,
  AlertCircle, Phone, MapPin, GraduationCap, Calendar, Activity,
  Edit2, Award, Settings, Ticket, Lock, Bell, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  lastEducation: z.string().min(2, 'Pendidikan terakhir minimal 2 karakter'),
})

type ProfileForm = z.infer<typeof profileSchema>

function ProfileContent() {
  const { user, updateProfile, switchRole, isLoading, isAuthenticated, isInitialized } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const router = useRouter()

  // Check if user is in temporary mode
  const metadata = user?.metadata && typeof user.metadata === 'object' && user.metadata !== null ? user.metadata as any : null
  const isInParticipantMode = metadata?.temporaryRole === 'PARTICIPANT'
  const isInOrganizerMode = metadata?.temporaryRole === 'ORGANIZER'
  const originalRole = metadata?.originalRole || user?.role

  // Can switch if:
  // 1. Participant with approved organizer request (can switch to organizer)
  // 2. Approved organizer (can switch to participant)
  const canSwitchToOrganizer = user?.role === 'PARTICIPANT' && user?.organizerType && user?.verificationStatus === 'APPROVED'
  const canSwitchToParticipant = user?.role === 'ORGANIZER' && user?.verificationStatus === 'APPROVED'
  const canSwitchRoles = canSwitchToOrganizer || canSwitchToParticipant || isInParticipantMode || isInOrganizerMode

  const handleSwitchRole = async () => {
    if (!canSwitchRoles) return
    
    setIsSwitchingRole(true)
    try {
      let targetRole: 'ORGANIZER' | 'PARTICIPANT'
      
      if (isInParticipantMode) {
        // Currently in participant mode, switch back to organizer
        targetRole = 'ORGANIZER'
      } else if (isInOrganizerMode) {
        // Currently in organizer mode (temporary), switch back to participant
        targetRole = 'PARTICIPANT'
      } else if (user?.role === 'PARTICIPANT' && canSwitchToOrganizer) {
        // Participant with approved organizer request, switch to organizer
        targetRole = 'ORGANIZER'
      } else if (user?.role === 'ORGANIZER' && canSwitchToParticipant) {
        // Approved organizer, switch to participant
        targetRole = 'PARTICIPANT'
      } else {
        return
      }
      
      await switchRole(targetRole)
    } catch (error) {
      console.error('Error switching role:', error)
    } finally {
      setIsSwitchingRole(false)
    }
  }

  // Strict user role protection
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  if (user.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      lastEducation: user?.lastEducation || '',
    },
  })

  React.useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        lastEducation: user.lastEducation || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileForm) => {
    const success = await updateProfile(data)
    if (success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700 transition-all">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center">
                <User className="h-6 w-6 text-white mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-white">Profil Saya</h1>
                  <p className="text-xs text-blue-100">Kelola informasi akun Anda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Profile Info (Sticky) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 animate-fade-in">
              {/* Profile Card */}
              <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-24 bg-blue-600"></div>
                <CardContent className="relative pt-0 pb-6">
                  <div className="flex flex-col items-center -mt-12">
                    {/* Avatar */}
                    <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center shadow-xl ring-4 ring-white hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl font-bold text-white">
                        {getInitials(user.fullName)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-gray-900 text-center">{user.fullName}</h2>
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>

                    {/* Role Badge */}
                    <div className="mt-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED') || isInOrganizerMode
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isInOrganizerMode 
                          ? '🎯 Organizer Mode' 
                          : isInParticipantMode 
                            ? '👤 Peserta Mode' 
                            : (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED' 
                              ? '🎯 Organizer' 
                              : (canSwitchToOrganizer ? '👤 Peserta (Organizer Approved)' : '👤 Peserta'))
                        }
                      </span>
                    </div>

                    {/* Switch Role Button */}
                    {canSwitchRoles && (
                      <div className="mt-3">
                        <Button
                          onClick={handleSwitchRole}
                          disabled={isSwitchingRole}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 mr-2 ${isSwitchingRole ? 'animate-spin' : ''}`} />
                          {isSwitchingRole 
                            ? 'Mengubah...' 
                            : isInParticipantMode 
                              ? 'Kembali ke Organizer' 
                              : isInOrganizerMode
                                ? 'Kembali ke Peserta'
                                : canSwitchToOrganizer
                                  ? 'Beralih ke Organizer'
                                  : 'Beralih ke Peserta'
                          }
                        </Button>
                      </div>
                    )}

                    {/* Verification Badge */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {user.emailVerified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Terverifikasi
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Belum Terverifikasi
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center text-xs text-gray-600 hover:text-blue-600 transition-colors">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="flex-1">Bergabung</span>
                      <span className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {user.lastActivity && (
                      <div className="flex items-center text-xs text-gray-600 hover:text-blue-600 transition-colors">
                        <Activity className="h-4 w-4 mr-2 text-green-500" />
                        <span className="flex-1">Aktif</span>
                        <span className="font-medium">
                          {new Date(user.lastActivity).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organizer Status Card */}
              {user.role === 'ORGANIZER' && (
                <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Status Organizer</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {user.verificationStatus === 'APPROVED' && (
                        <div className="animate-fade-in">
                          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <p className="text-sm font-semibold text-green-800">Disetujui</p>
                        </div>
                      )}
                      {user.verificationStatus === 'PENDING' && (
                        <div className="animate-fade-in">
                          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-2">
                            <Clock className="h-6 w-6 text-yellow-600 animate-pulse" />
                          </div>
                          <p className="text-sm font-semibold text-yellow-800">Menunggu</p>
                        </div>
                      )}
                      {user.verificationStatus === 'REJECTED' && (
                        <div className="animate-fade-in">
                          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                          </div>
                          <p className="text-sm font-semibold text-red-800">Ditolak</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Menu Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/my-registrations" className="flex items-center text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all">
                    <Ticket className="h-4 w-4 mr-2" />
                    Registrasi Saya
                  </Link>
                  <Link href="/my-certificates" className="flex items-center text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all">
                    <Award className="h-4 w-4 mr-2" />
                    Sertifikat Saya
                  </Link>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content - Tabs */}
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                <TabsTrigger
                  value="profile"
                  className="bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Event
                </TabsTrigger>
                <TabsTrigger
                  value="certificates"
                  className="bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Sertifikat
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="bg-white text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Pengaturan
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="animate-fade-in">
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Informasi Profil</CardTitle>
                        <CardDescription className="mt-1">
                          Perbarui informasi pribadi Anda
                        </CardDescription>
                      </div>
                      {!isEditing && (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600" />
                            Nama Lengkap
                          </label>
                          <Input
                            {...register('fullName')}
                            placeholder="John Doe"
                            error={errors.fullName?.message}
                            disabled={!isEditing}
                            required
                            className={`transition-all ${!isEditing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-blue-600" />
                            Email
                          </label>
                          <Input
                            value={user.email}
                            disabled
                            className="bg-gray-50 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-blue-600" />
                            Nomor Telepon
                          </label>
                          <Input
                            {...register('phoneNumber')}
                            type="tel"
                            placeholder="081234567890"
                            error={errors.phoneNumber?.message}
                            disabled={!isEditing}
                            required
                            className={`transition-all ${!isEditing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                            Pendidikan Terakhir
                          </label>
                          <Input
                            {...register('lastEducation')}
                            placeholder="S1 Teknik Informatika"
                            error={errors.lastEducation?.message}
                            disabled={!isEditing}
                            required
                            className={`transition-all ${!isEditing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          Alamat Lengkap
                        </label>
                        <Input
                          {...register('address')}
                          placeholder="Jl. Contoh No. 123, Jakarta"
                          error={errors.address?.message}
                          disabled={!isEditing}
                          required
                          className={`transition-all ${!isEditing ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-500'}`}
                        />
                      </div>

                      {isEditing && (
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="hover:bg-gray-100 transition-all"
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            loading={isLoading}
                            disabled={!isDirty || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Simpan
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="animate-fade-in">
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Event Saya</CardTitle>
                    <CardDescription>
                      Daftar event yang Anda ikuti
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada event yang diikuti</p>
                      <Link href="/events">
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                          Jelajahi Event
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certificates Tab */}
              <TabsContent value="certificates" className="animate-fade-in">
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Sertifikat Saya</CardTitle>
                    <CardDescription>
                      Sertifikat yang telah Anda dapatkan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada sertifikat</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Ikuti event untuk mendapatkan sertifikat
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="animate-fade-in">
                <div className="space-y-6">
                  {/* Security Settings */}
                  <Card className="border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-blue-600" />
                        Keamanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-sm">Ubah Password</p>
                          <p className="text-xs text-gray-500">Perbarui password akun Anda</p>
                        </div>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 transition-all">
                          Ubah
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-sm">Verifikasi Email</p>
                          <p className="text-xs text-gray-500">
                            {user.emailVerified ? 'Email sudah terverifikasi' : 'Verifikasi email Anda'}
                          </p>
                        </div>
                        {user.emailVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 transition-all">
                            Verifikasi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card className="border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-blue-600" />
                        Notifikasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Email Notifikasi</p>
                          <p className="text-xs text-gray-500">Terima notifikasi via email</p>
                        </div>
                        <input type="checkbox" className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Event Reminder</p>
                          <p className="text-xs text-gray-500">Pengingat event yang akan datang</p>
                        </div>
                        <input type="checkbox" className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Privacy */}
                  <Card className="border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-blue-600" />
                        Privasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-gray-600 space-y-2">
                        <p className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          Email tidak dapat diubah setelah registrasi
                        </p>
                        <p className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          Semua perubahan profil akan tercatat dalam sistem
                        </p>
                        <p className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          Data Anda dilindungi sesuai kebijakan privasi
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
