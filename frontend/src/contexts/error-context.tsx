'use client'

import React, { createContext, useContext, useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ErrorContextType {
  handleError: (error: unknown, fallbackMessage?: string) => void
  clearError: () => void
  error: string | null
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      let errorMessage = fallbackMessage || 'Terjadi kesalahan yang tidak diketahui'

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorWithMessage = error as { message: string }
        errorMessage = errorWithMessage.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    },
    [toast]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <ErrorContext.Provider value={{ handleError, clearError, error }}>
      {children}
    </ErrorContext.Provider>
  )
}

export const useError = () => {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}
