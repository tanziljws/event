'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft, Home, User, Settings } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Akses Ditolak
          </CardTitle>
          <CardDescription className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAuthenticated && user && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Role Anda saat ini:
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user.role}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Pilihan yang tersedia:
            </h3>
            
            <div className="space-y-2">
              <Link href="/dashboard">
                <Button className="w-full justify-start" variant="outline">
                  <Home className="h-4 w-4 mr-3" />
                  Kembali ke Dashboard
                </Button>
              </Link>
              
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link href="/admin/dashboard">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-3" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              
              {isAuthenticated && user?.role === 'PARTICIPANT' && (
                <Link href="/my-registrations">
                  <Button className="w-full justify-start" variant="outline">
                    <User className="h-4 w-4 mr-3" />
                    Pendaftaran Saya
                  </Button>
                </Link>
              )}
              
              <Link href="/events">
                <Button className="w-full justify-start" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-3" />
                  Lihat Event
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
