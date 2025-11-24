'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Clock, Loader2, Calendar, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react'
import { ApiService } from '@/lib/api'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function PaymentPendingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [isSyncing, setIsSyncing] = useState(false)

  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')

  // Initial payment fetch
  useEffect(() => {
    const fetchPayment = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
        
        if (paymentResponse.success && paymentResponse.payment) {
          const payment = paymentResponse.payment
          setPaymentData({
            orderId,
            statusCode,
            transactionStatus,
            payment
          })

          // Check initial status
          if (payment.status === 'PAID') {
            setPaymentStatus('success')
            // Trigger registration if needed
            if (!payment.registrationId) {
              try {
                await ApiService.triggerRegistration(payment.id)
              } catch (err) {
                console.error('Error triggering registration:', err)
              }
            }
          } else if (payment.status === 'FAILED' || payment.status === 'EXPIRED' || payment.status === 'CANCELLED') {
            setPaymentStatus('failed')
          } else {
            setPaymentStatus('pending')
          }
        }
      } catch (err) {
        console.error('Error fetching payment:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [orderId, statusCode, transactionStatus])

  // Manual sync function
  const handleSync = async () => {
    if (!orderId) return

    try {
      setIsSyncing(true)
      console.log('🔄 Manually syncing payment status...')
      
      // Sync with Midtrans
      const syncResponse = await ApiService.syncPaymentStatus(orderId)
      
      if (syncResponse.success) {
        console.log('✅ Payment status synced:', syncResponse.paymentStatus)
        
        // Get updated payment
        const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
        
        if (paymentResponse.success && paymentResponse.payment) {
          const payment = paymentResponse.payment
          
          setPaymentData(prev => ({
            ...prev,
            payment
          }))

          // Update status
          if (payment.status === 'PAID') {
            setPaymentStatus('success')
            // Trigger registration if needed
            if (!payment.registrationId) {
              try {
                const regResponse = await ApiService.triggerRegistration(payment.id)
                if (regResponse.success) {
                  console.log('✅ Registration triggered')
                }
              } catch (err) {
                console.error('Error triggering registration:', err)
              }
            }
            // Redirect to success page after 2 seconds
            setTimeout(() => {
              router.push(`/payment/success?order_id=${orderId}`)
            }, 2000)
          } else if (payment.status === 'FAILED' || payment.status === 'EXPIRED' || payment.status === 'CANCELLED') {
            setPaymentStatus('failed')
          } else {
            setPaymentStatus('pending')
          }
        }
      }
    } catch (err) {
      console.error('Error syncing payment:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-poll for pending payments every 5 seconds
  useEffect(() => {
    if (paymentStatus === 'pending' && orderId) {
      console.log('🔄 Starting auto-polling for payment status...')
      
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Auto-syncing payment status with Midtrans...')
          
          // Sync with Midtrans
          const syncResponse = await ApiService.syncPaymentStatus(orderId)
          
          if (syncResponse.success) {
            console.log('✅ Payment status synced:', syncResponse.paymentStatus)
            
            // Get updated payment
            const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
            
            if (paymentResponse.success && paymentResponse.payment) {
              const payment = paymentResponse.payment
              
              // If payment status changed to PAID, trigger registration and redirect
              if (payment.status === 'PAID') {
                console.log('✅ Payment status changed to PAID!')
                setPaymentStatus('success')
                setPaymentData(prev => ({
                  ...prev,
                  payment,
                  message: 'Pembayaran berhasil!'
                }))
                
                // Trigger registration if needed
                if (!payment.registrationId) {
                  try {
                    const regResponse = await ApiService.triggerRegistration(payment.id)
                    if (regResponse.success) {
                      console.log('✅ Registration triggered')
                    }
                  } catch (err) {
                    console.error('Error triggering registration:', err)
                  }
                }
                
                // Redirect to success page
                clearInterval(interval)
                setTimeout(() => {
                  router.push(`/payment/success?order_id=${orderId}`)
                }, 2000)
              } else if (payment.status === 'FAILED' || payment.status === 'EXPIRED' || payment.status === 'CANCELLED') {
                console.log('❌ Payment status changed to FAILED/EXPIRED')
                setPaymentStatus('failed')
                clearInterval(interval)
              }
            }
          }
        } catch (err) {
          console.error('Error polling payment status:', err)
        }
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [paymentStatus, orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show success state
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
              <p className="text-green-100">Mengarahkan ke halaman sukses...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Pending Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center text-white">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
              <Clock className="h-20 w-20 mx-auto relative" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Menunggu Pembayaran</h1>
            <p className="text-yellow-100">Pembayaran Anda sedang diproses</p>
            <p className="text-yellow-200 text-sm mt-2">Status akan diperbarui otomatis setiap 5 detik</p>
          </div>

          {/* Payment Details */}
          <div className="p-8 space-y-6">
            {orderId && (
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">{orderId}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Pembayaran Sedang Diproses</p>
                  <p className="text-sm text-yellow-700">
                    Pembayaran Anda sedang diproses oleh payment gateway. 
                    Silakan tunggu beberapa saat. Anda akan menerima notifikasi via email setelah pembayaran berhasil.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Sinkronkan Status
                  </>
                )}
              </button>
              {isAuthenticated && (
                <Link href="/my-registrations" className="flex-1">
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Cek Status Pendaftaran
                  </button>
                </Link>
              )}
              <Link href="/events" className="flex-1">
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Kembali ke Events
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

