'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiService } from '@/lib/api'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Key, Shield } from 'lucide-react'

interface PrivateEventManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  eventId: string
  eventTitle: string
  isPrivate: boolean
  currentPassword?: string
}

export function PrivateEventManagementModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventId, 
  eventTitle,
  isPrivate,
  currentPassword
}: PrivateEventManagementModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.trim().length < 4) {
      setError('Password must be at least 4 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update event with new private settings
      const response = await ApiService.updateEvent(eventId, {
        isPrivate: true,
        privatePassword: newPassword.trim()
      })
      
      if (response.success) {
        onSuccess()
        onClose()
      } else {
        setError(response.message || 'Failed to update event settings')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update event settings')
    } finally {
      setLoading(false)
    }
  }

  const handleMakePublic = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await ApiService.updateEvent(eventId, {
        isPrivate: false,
        privatePassword: null
      })
      
      if (response.success) {
        onSuccess()
        onClose()
      } else {
        setError(response.message || 'Failed to update event settings')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update event settings')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Private Event Management
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage password protection for your event
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800 font-medium">
                {eventTitle}
              </span>
            </div>
          </div>

          {isPrivate ? (
            // Current Private Event Management
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Lock className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">
                    Event is currently private
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  Participants need a password to access this event
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    New Event Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Password
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleMakePublic}
                  className="w-full text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Make Event Public
                </Button>
              </div>
            </div>
          ) : (
            // Make Event Private
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-800">
                    Event is currently public
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Anyone can view and register for this event
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Event Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password for private access"
                      className="pr-10"
                      disabled={loading}
                      minLength={4}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="pr-10"
                      disabled={loading}
                      minLength={4}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Making Private...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Make Private
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Private events require password for access. Share the password with intended participants.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
