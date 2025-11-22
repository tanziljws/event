import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { Shield, User, Lock } from 'lucide-react'

interface AuthLoadingProps {
  message?: string
  type?: 'auth' | 'profile' | 'session' | 'role'
  showIcon?: boolean
}

export const AuthLoading: React.FC<AuthLoadingProps> = ({
  message = 'Memverifikasi akses...',
  type = 'auth',
  showIcon = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'auth':
        return <Lock className="h-8 w-8 text-blue-600" />
      case 'profile':
        return <User className="h-8 w-8 text-green-600" />
      case 'session':
        return <Shield className="h-8 w-8 text-yellow-600" />
      case 'role':
        return <Shield className="h-8 w-8 text-purple-600" />
      default:
        return <Lock className="h-8 w-8 text-blue-600" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'auth':
        return 'Memverifikasi Identitas'
      case 'profile':
        return 'Memuat Profil'
      case 'session':
        return 'Memverifikasi Sesi'
      case 'role':
        return 'Memverifikasi Akses'
      default:
        return 'Memverifikasi'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'auth':
        return 'Sedang memverifikasi kredensial Anda...'
      case 'profile':
        return 'Sedang memuat informasi profil Anda...'
      case 'session':
        return 'Sedang memverifikasi sesi Anda...'
      case 'role':
        return 'Sedang memverifikasi izin akses Anda...'
      default:
        return 'Sedang memproses...'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {showIcon && getIcon()}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific loading components
export const AuthVerificationLoading: React.FC<{ message?: string }> = ({ message }) => (
  <AuthLoading message={message} type="auth" />
)

export const ProfileLoading: React.FC<{ message?: string }> = ({ message }) => (
  <AuthLoading message={message} type="profile" />
)

export const SessionVerificationLoading: React.FC<{ message?: string }> = ({ message }) => (
  <AuthLoading message={message} type="session" />
)

export const RoleVerificationLoading: React.FC<{ message?: string }> = ({ message }) => (
  <AuthLoading message={message} type="role" />
)
