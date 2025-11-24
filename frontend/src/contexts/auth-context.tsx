'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { User, LoginForm, RegisterForm, RegisterData, UpdateProfileForm } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useError } from './error-context'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  sessionExpired: boolean
  login: (data: LoginForm) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  verifyEmail: (email: string, otp: string) => Promise<boolean>
  resendOtp: (email: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileForm) => Promise<boolean>
  switchRole: (targetRole: 'ORGANIZER' | 'PARTICIPANT') => Promise<boolean>
  refreshProfile: () => Promise<void>
  refreshToken: () => Promise<boolean>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { handleError } = useError()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isAuthenticated = !!user && !sessionExpired

  // Debug logging
  useEffect(() => {
    console.log('AuthContext state:', {
      user: user?.email,
      isAuthenticated,
      isLoading,
      isInitialized,
      sessionExpired,
      hasAccessToken: !!localStorage.getItem('accessToken'),
      hasRefreshToken: !!localStorage.getItem('refreshToken')
    })
  }, [user, isAuthenticated, isLoading, isInitialized, sessionExpired])

  // Token refresh mechanism
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await ApiService.refreshToken()
      if (response.success && response.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken)
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }, [])

  // Clear session and redirect to login
  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setSessionExpired(true)
    setIsLoading(false)
    setIsInitialized(true)

    toast({
      variant: 'destructive',
      title: 'Sesi Berakhir',
      description: 'Sesi Anda telah berakhir. Silakan login kembali.',
    })

    router.push('/login')
  }, [toast, router])

  // Setup token refresh interval
  const setupTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    refreshTimeoutRef.current = setTimeout(async () => {
      const success = await refreshToken()
      if (!success) {
        clearSession()
      } else {
        setupTokenRefresh() // Schedule next refresh
      }
    }, 14 * 60 * 1000) // 14 minutes
  }, [refreshToken, clearSession])

  // Initialize auth state - non-blocking, set initialized immediately
  useEffect(() => {
    const initAuth = async () => {
      // Safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn('Auth initialization timed out, forcing completion')
          setIsLoading(false)
          setIsInitialized(true)
        }
      }, 5000)

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // No token, user is not authenticated
          setSessionExpired(false)
          return
        }

        // Try to get profile
        try {
          const response = await ApiService.getProfile()
          if (response.success && response.data?.user) {
            setUser(response.data.user)
            setSessionExpired(false)
            setupTokenRefresh()
            return
          }
        } catch (error) {
          console.log('Initial profile fetch failed, trying refresh:', error)
        }

        // If profile fetch failed or returned no user, try refresh token
        try {
          const refreshSuccess = await refreshToken()
          if (refreshSuccess) {
            const retryResponse = await ApiService.getProfile()
            if (retryResponse.success && retryResponse.data?.user) {
              setUser(retryResponse.data.user)
              setSessionExpired(false)
              setupTokenRefresh()
              return
            }
          }
        } catch (error) {
          console.error('Token refresh failed during init:', error)
        }

        // If all attempts fail, clear session
        clearSession()
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        clearTimeout(safetyTimeout)
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    // Only run once on mount
    initAuth()

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [refreshToken, clearSession, setupTokenRefresh])

  const login = useCallback(async (data: LoginForm): Promise<boolean> => {
    try {
      setIsLoading(true)
      setSessionExpired(false)
      const response = await ApiService.login(data)

      if (response.success && response.data) {
        const { accessToken, user: userData } = response.data

        // Store access token (refresh token is handled by HttpOnly cookie)
        localStorage.setItem('accessToken', accessToken)

        // Set user and setup token refresh
        setUser(userData)
        setSessionExpired(false)
        setupTokenRefresh()

        toast({
          variant: 'success',
          title: 'Login Berhasil',
          description: `Selamat datang, ${userData.fullName}!`,
        })

        return true
      }
      return false
    } catch (error) {
      handleError(error, 'Login gagal. Periksa email dan password Anda.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError, setupTokenRefresh])

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('AuthContext: Starting registration...', data.email)

      let response;
      if (data.role === 'ORGANIZER') {
        // Register as organizer with new profile structure
        response = await ApiService.registerOrganizer({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          address: data.address,
          lastEducation: data.lastEducation,
          organizerType: data.organizerType || 'INDIVIDUAL',
          profileData: data.profileData || {}
        })
      } else {
        // Register as participant
        response = await ApiService.register(data)
      }

      if (response.success) {
        console.log('AuthContext: Registration successful')
        toast({
          variant: 'success',
          title: 'Registrasi Berhasil',
          description: data.role === 'ORGANIZER'
            ? 'Akun organizer berhasil dibuat. Silakan cek email untuk verifikasi OTP.'
            : 'Silakan cek email Anda untuk verifikasi OTP.',
        })
        return true
      }
      console.log('AuthContext: Registration failed - response not successful')
      return false
    } catch (error) {
      console.log('AuthContext: Registration error:', error)
      handleError(error, 'Registrasi gagal. Silakan coba lagi.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const verifyEmail = useCallback(async (email: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await ApiService.verifyEmail({ email, otp })

      if (response.success) {
        toast({
          variant: 'success',
          title: 'Email Terverifikasi',
          description: 'Akun Anda telah berhasil diverifikasi. Silakan login.',
        })
        return true
      }
      return false
    } catch (error) {
      handleError(error, 'Verifikasi OTP gagal. Periksa kode OTP Anda.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const resendOtp = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await ApiService.resendOtp(email)

      if (response.success) {
        toast({
          variant: 'success',
          title: 'OTP Dikirim Ulang',
          description: 'Kode OTP baru telah dikirim ke email Anda.',
        })
        return true
      }
      return false
    } catch (error) {
      handleError(error, 'Gagal mengirim ulang OTP. Silakan coba lagi.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }

      await ApiService.logout()
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setSessionExpired(false)

      toast({
        variant: 'default',
        title: 'Logout Berhasil',
        description: 'Anda telah berhasil logout.',
      })

      router.push('/login')
    }
  }, [toast, router])

  const updateProfile = useCallback(async (data: UpdateProfileForm): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await ApiService.updateProfile(data)

      if (response.success && response.data?.user) {
        setUser(response.data.user)
        toast({
          variant: 'success',
          title: 'Profil Diperbarui',
          description: 'Profil Anda telah berhasil diperbarui.',
        })
        return true
      }
      return false
    } catch (error) {
      handleError(error, 'Gagal memperbarui profil. Silakan coba lagi.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const switchRole = useCallback(async (targetRole: 'ORGANIZER' | 'PARTICIPANT'): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await ApiService.switchRole(targetRole)

      if (response.success && response.data?.user) {
        setUser(response.data.user)
        toast({
          variant: 'success',
          title: 'Mode Berhasil Diubah',
          description: `Anda sekarang dalam mode ${targetRole === 'PARTICIPANT' ? 'Peserta' : 'Organizer'}.`,
        })
        // Refresh page to update UI
        window.location.reload()
        return true
      }
      return false
    } catch (error) {
      handleError(error, 'Gagal mengubah mode. Silakan coba lagi.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast, handleError])

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await ApiService.getProfile()
      if (response.success && response.data?.user) {
        setUser(response.data.user)
      }
    } catch (error) {
      // If profile refresh fails, user might need to login again
      console.error('Profile refresh error:', error)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    sessionExpired,
    login,
    register,
    verifyEmail,
    resendOtp,
    logout,
    updateProfile,
    switchRole,
    refreshProfile,
    refreshToken,
    clearSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
