'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, RefreshCw, LogOut } from 'lucide-react'

interface SessionStatusProps {
  showWarning?: boolean
  warningThreshold?: number // minutes before expiry to show warning
}

export const SessionStatus: React.FC<SessionStatusProps> = ({
  showWarning = true,
  warningThreshold = 2, // 2 minutes before expiry
}) => {
  const { user, isAuthenticated, refreshToken, logout } = useAuth()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showWarningModal, setShowWarningModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTimeLeft(null)
      setShowWarningModal(false)
      return
    }

    // Calculate time left based on token expiry (15 minutes)
    const tokenExpiry = 15 * 60 * 1000 // 15 minutes in milliseconds
    const warningTime = warningThreshold * 60 * 1000 // warning threshold in milliseconds
    
    let interval: NodeJS.Timeout

    const updateTimeLeft = () => {
      // This is a simplified calculation - in a real app, you'd decode the JWT to get actual expiry
      const now = Date.now()
      const tokenCreated = localStorage.getItem('tokenCreated')
      
      if (tokenCreated) {
        const elapsed = now - parseInt(tokenCreated)
        const remaining = Math.max(0, tokenExpiry - elapsed)
        const minutesLeft = Math.ceil(remaining / (60 * 1000))
        
        setTimeLeft(minutesLeft)
        
        // Show warning if time is running out
        if (remaining <= warningTime && remaining > 0) {
          setShowWarningModal(true)
        } else if (remaining <= 0) {
          setShowWarningModal(false)
        }
      }
    }

    // Set initial time
    updateTimeLeft()
    
    // Update every minute
    interval = setInterval(updateTimeLeft, 60 * 1000)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isAuthenticated, user, warningThreshold])

  const handleRefreshToken = async () => {
    try {
      const success = await refreshToken()
      if (success) {
        // Store token creation time
        localStorage.setItem('tokenCreated', Date.now().toString())
        setShowWarningModal(false)
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (!isAuthenticated || !user || !timeLeft) {
    return null
  }

  return (
    <>
      {/* Warning Modal */}
      {showWarning && showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sesi Akan Berakhir
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sesi Anda akan berakhir dalam {timeLeft} menit
                  </p>
                </div>
              </div>
              
              <Alert className="mb-4">
                <AlertDescription>
                  Untuk melanjutkan menggunakan aplikasi, silakan perpanjang sesi Anda atau logout dan login kembali.
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleRefreshToken}
                  className="flex-1"
                  variant="primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Perpanjang Sesi
                </Button>
                <Button 
                  onClick={handleLogout}
                  className="flex-1"
                  variant="outline"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Session indicator component for header/navbar
export const SessionIndicator: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTimeLeft(null)
      return
    }

    const tokenExpiry = 15 * 60 * 1000 // 15 minutes
    const tokenCreated = localStorage.getItem('tokenCreated')
    
    if (tokenCreated) {
      const elapsed = Date.now() - parseInt(tokenCreated)
      const remaining = Math.max(0, tokenExpiry - elapsed)
      const minutesLeft = Math.ceil(remaining / (60 * 1000))
      setTimeLeft(minutesLeft)
    }

    const interval = setInterval(() => {
      if (tokenCreated) {
        const elapsed = Date.now() - parseInt(tokenCreated)
        const remaining = Math.max(0, tokenExpiry - elapsed)
        const minutesLeft = Math.ceil(remaining / (60 * 1000))
        setTimeLeft(minutesLeft)
      }
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  if (!isAuthenticated || !user || !timeLeft) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Clock className="h-4 w-4" />
      <span>Sesi: {timeLeft}m</span>
    </div>
  )
}
