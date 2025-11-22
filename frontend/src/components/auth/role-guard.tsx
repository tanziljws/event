import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('ADMIN' | 'PARTICIPANT')[]
  fallback?: React.ReactNode
  showFallback?: boolean
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showFallback = true,
}) => {
  const { user, isAuthenticated } = useAuth()

  // If not authenticated, don't show anything (let ProtectedRoute handle it)
  if (!isAuthenticated || !user) {
    return null
  }

  // If user role is not in allowed roles
  if (!allowedRoles.includes(user.role as 'ADMIN' | 'PARTICIPANT')) {
    if (!showFallback) {
      return null
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Akses Ditolak
            </CardTitle>
            <CardDescription className="text-gray-600">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Halaman ini hanya dapat diakses oleh: {allowedRoles.join(' atau ')}
              </p>
              <p className="text-sm text-gray-500">
                Role Anda saat ini: <span className="font-medium">{user.role}</span>
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard">
                <Button className="w-full" variant="primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Dashboard
                </Button>
              </Link>
              
              {user.role === 'ADMIN' && (
                <Link href="/admin/dashboard">
                  <Button className="w-full" variant="outline">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user has permission, show children or custom fallback
  return <>{fallback || children}</>
}

// Higher-order component for role-based protection
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: ('ADMIN' | 'PARTICIPANT')[],
  options?: Omit<RoleGuardProps, 'children' | 'allowedRoles'>
) => {
  const WrappedComponent = (props: P) => (
    <RoleGuard allowedRoles={allowedRoles} {...options}>
      <Component {...props} />
    </RoleGuard>
  )
  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specific role guards
export const withAdminGuard = <P extends object>(Component: React.ComponentType<P>) => {
  return withRoleGuard(Component, ['ADMIN'])
}

export const withParticipantGuard = <P extends object>(Component: React.ComponentType<P>) => {
  return withRoleGuard(Component, ['PARTICIPANT'])
}
