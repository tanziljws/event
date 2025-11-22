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
import { User, Mail, Save, ArrowLeft, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
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
  const { user, updateProfile, isLoading, isAuthenticated, isInitialized } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  // Strict user role protection - admin should not access user profile
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        // Admin trying to access user profile, redirect to 404 for security
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Show loading while checking authentication and role
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated after loading, redirect to login
  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  // If admin, show loading while redirecting to 404
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

  // Reset form when user data changes
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>
                  Detail informasi akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{user.email}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-3">Role:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED' ? 'Organizer' : 'Peserta'}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-3">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.emailVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {user.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-3">Bergabung:</span>
                    <span className="font-medium">
                      {formatDateTime(user.createdAt)}
                    </span>
                  </div>

                  {user.lastActivity && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 mr-3">Aktivitas Terakhir:</span>
                      <span className="font-medium">
                        {formatDateTime(user.lastActivity)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organizer Verification Status */}
            {user.role === 'ORGANIZER' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <CardTitle>Status Verifikasi Organizer</CardTitle>
                      <CardDescription>
                        Informasi status verifikasi akun organizer Anda
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status Verifikasi:</span>
                      <div className="flex items-center">
                        {user.verificationStatus === 'APPROVED' && (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-medium">
                              Disetujui
                            </span>
                          </>
                        )}
                        {user.verificationStatus === 'PENDING' && (
                          <>
                            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 font-medium">
                              Menunggu Review
                            </span>
                          </>
                        )}
                        {user.verificationStatus === 'REJECTED' && (
                          <>
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 font-medium">
                              Ditolak
                            </span>
                          </>
                        )}
                        {!user.verificationStatus && (
                          <>
                            <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 font-medium">
                              Belum Diverifikasi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {user.verificationStatus === 'APPROVED' && user.verifiedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Disetujui pada:</span>
                        <span className="text-sm font-medium">
                          {formatDateTime(user.verifiedAt)}
                        </span>
                      </div>
                    )}

                    {user.verificationStatus === 'REJECTED' && user.rejectedReason && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-2">Alasan Penolakan:</p>
                            <p className="text-sm text-red-700">{user.rejectedReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.verificationStatus === 'PENDING' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-2">Sedang dalam Review</p>
                            <p className="text-sm text-yellow-700">
                              Permohonan Anda sedang ditinjau oleh tim kami. Anda akan mendapat notifikasi
                              setelah proses review selesai.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!user.verificationStatus && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 mb-2">Belum Diverifikasi</p>
                            <p className="text-sm text-blue-700">
                              Akun organizer Anda belum diverifikasi. Silakan lengkapi informasi bisnis
                              untuk memulai proses verifikasi.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Edit Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Edit Profil</CardTitle>
                    <CardDescription>
                      Perbarui informasi profil Anda
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profil
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      {...register('fullName')}
                      label="Nama Lengkap"
                      placeholder="John Doe"
                      error={errors.fullName?.message}
                      disabled={!isEditing}
                      required
                    />

                    <Input
                      {...register('phoneNumber')}
                      label="Nomor Telepon"
                      type="tel"
                      placeholder="081234567890"
                      error={errors.phoneNumber?.message}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <Input
                    {...register('address')}
                    label="Alamat"
                    placeholder="Jl. Contoh No. 123, Jakarta"
                    error={errors.address?.message}
                    disabled={!isEditing}
                    required
                  />

                  <Input
                    {...register('lastEducation')}
                    label="Pendidikan Terakhir"
                    placeholder="S1 Teknik Informatika"
                    error={errors.lastEducation?.message}
                    disabled={!isEditing}
                    required
                  />

                  {isEditing && (
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        loading={isLoading}
                        disabled={!isDirty || isLoading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informasi Keamanan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Email tidak dapat diubah setelah registrasi</p>
                <p>• Password dapat diubah melalui halaman reset password</p>
                <p>• Semua perubahan profil akan tercatat dalam sistem</p>
                <p>• Pastikan informasi yang diisi akurat dan terkini</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
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
