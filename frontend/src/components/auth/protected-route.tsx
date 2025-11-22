import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AuthVerificationLoading, SessionVerificationLoading } from '@/components/ui/auth-loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string | string[]
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  redirectTo,
}) => {
  const { user, isLoading, isInitialized, isAuthenticated, sessionExpired } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('ProtectedRoute useEffect:', {
      isLoading,
      isInitialized,
      isAuthenticated,
      sessionExpired,
      user: user?.email,
      requireAuth,
      requireRole
    })

    // Don't do anything while loading or not initialized
    if (isLoading || !isInitialized) return

    // Check if session expired
    if (sessionExpired) {
      console.log('ProtectedRoute: Session expired, redirecting to login')
      router.replace('/login')
      return
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to login')
      router.replace(redirectTo || '/login')
      return
    }

    // Check role requirement
    if (requireRole) {
      const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole]
      if (!user?.role || !allowedRoles.includes(user.role)) {
        console.log('ProtectedRoute: Redirecting to unauthorized', { userRole: user?.role, allowedRoles })
        router.replace(redirectTo || '/unauthorized')
        return
      }
    }

    // Redirect authenticated users away from auth pages
    if (!requireAuth && isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to dashboard')
      router.replace(redirectTo || '/dashboard')
      return
    }
  }, [isAuthenticated, isLoading, isInitialized, sessionExpired, user, requireAuth, requireRole, redirectTo, router])

  // Show loading while checking auth
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Show session expired message
  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    )
  }

  // Don't show loading screens for redirects - let the redirect happen
  // The component will unmount anyway

  return <>{children}</>
}

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  )
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Higher-order component for admin routes
export const withAdminAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return withAuth(Component, {
    requireAuth: true,
    requireRole: 'ADMIN',
    redirectTo: '/unauthorized',
  })
}

// Higher-order component for participant routes
export const withParticipantAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return withAuth(Component, {
    requireAuth: true,
    requireRole: 'PARTICIPANT',
    redirectTo: '/unauthorized',
  })
}
