'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle, Calendar, MapPin, Clock, Download, ArrowRight } from 'lucide-react'
import { ApiService } from '@/lib/api'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failed' | 'checking'>('checking')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Get query parameters from Midtrans redirect
  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')

  useEffect(() => {
    if (!orderId) {
      setError('Order ID tidak ditemukan')
      setLoading(false)
      return
    }

    // Verify payment status and trigger registration if needed
    const verifyPayment = async () => {
      try {
        setLoading(true)
        
        if (!orderId) {
          setError('Order ID tidak ditemukan')
          setLoading(false)
          return
        }

        // Check transaction_status from URL first (from Midtrans redirect)
        // If transaction_status is 'capture' or 'settlement', payment is successful
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
          console.log('✅ Transaction status from URL indicates success:', transactionStatus)
          
          // First, sync with Midtrans to update our database
          try {
            console.log('🔄 Syncing payment status with Midtrans...')
            const syncResponse = await ApiService.syncPaymentStatus(orderId)
            
            if (syncResponse.success) {
              console.log('✅ Payment status synced:', syncResponse.paymentStatus)
            }
          } catch (syncError) {
            console.error('⚠️ Error syncing payment status:', syncError)
            // Continue anyway - we'll get payment from database
          }
        }

        // Get payment by order ID
        const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
        
        if (!paymentResponse.success || !paymentResponse.payment) {
          setError('Pembayaran tidak ditemukan')
          setPaymentStatus('failed')
          setLoading(false)
          return
        }

        const payment = paymentResponse.payment

        // Check payment status - prioritize transaction_status from URL if available
        if (transactionStatus === 'capture' || transactionStatus === 'settlement' || payment.status === 'PAID') {
          setPaymentStatus('success')
          setPaymentData({
            orderId,
            statusCode,
            transactionStatus,
            payment,
            message: 'Pembayaran berhasil!'
          })

          // Check if registration already exists
          if (!payment.registrationId) {
            console.log('🔄 Registration belum ada, memicu registrasi...')
            try {
              // Trigger registration manually (for localhost/development when webhook doesn't work)
              const registrationResponse = await ApiService.triggerRegistration(payment.id)
              
              if (registrationResponse.success) {
                console.log('✅ Registrasi berhasil dibuat:', registrationResponse.registration?.id)
                // Update payment data with registration info
                setPaymentData(prev => ({
                  ...prev,
                  payment: {
                    ...prev.payment,
                    registrationId: registrationResponse.registration?.id
                  }
                }))
              } else {
                console.warn('⚠️ Gagal membuat registrasi:', registrationResponse.message)
                // Don't show error to user - registration might already exist or will be created by webhook
              }
            } catch (regError: any) {
              console.error('❌ Error triggering registration:', regError)
              // Don't show error to user - registration might already exist or will be created by webhook
            }
          } else {
            console.log('✅ Registration sudah ada:', payment.registrationId)
          }
        } else if (payment.status === 'PENDING' || transactionStatus === 'pending') {
          setPaymentStatus('pending')
          setPaymentData({
            orderId,
            statusCode,
            transactionStatus,
            payment,
            message: 'Pembayaran sedang diproses'
          })
        } else {
          setPaymentStatus('failed')
          setPaymentData({
            orderId,
            statusCode,
            transactionStatus,
            payment,
            message: 'Pembayaran gagal atau dibatalkan'
          })
        }
      } catch (err: any) {
        console.error('Error verifying payment:', err)
        setError(err.message || 'Terjadi kesalahan saat memverifikasi pembayaran')
        setPaymentStatus('failed')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [orderId, statusCode, transactionStatus])

  // Auto-poll for pending payments every 5 seconds
  useEffect(() => {
    if (paymentStatus === 'pending' && orderId) {
      console.log('🔄 Starting auto-polling for payment status...')
      
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Syncing payment status with Midtrans...')
          
          // First, sync with Midtrans to get latest status
          try {
            const syncResponse = await ApiService.syncPaymentStatus(orderId)
            if (syncResponse.success) {
              console.log('✅ Payment status synced:', syncResponse.paymentStatus)
              
              // Get updated payment
              const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
              
              if (paymentResponse.success && paymentResponse.payment) {
                const payment = paymentResponse.payment
                
                // If payment status changed to PAID, trigger registration
                if (payment.status === 'PAID') {
                  console.log('✅ Payment status changed to PAID!')
                  setPaymentStatus('success')
                  setPaymentData(prev => ({
                    ...prev,
                    payment,
                    message: 'Pembayaran berhasil!'
                  }))

                  // Trigger registration if not exists
                  if (!payment.registrationId) {
                    try {
                      console.log('🔄 Triggering registration...')
                      const registrationResponse = await ApiService.triggerRegistration(payment.id)
                      if (registrationResponse.success) {
                        console.log('✅ Registrasi berhasil dibuat:', registrationResponse.registration?.id)
                        setPaymentData(prev => ({
                          ...prev,
                          payment: {
                            ...prev.payment,
                            registrationId: registrationResponse.registration?.id
                          }
                        }))
                      }
                    } catch (regError) {
                      console.error('❌ Error triggering registration:', regError)
                    }
                  }
                } else if (payment.status === 'FAILED' || payment.status === 'EXPIRED') {
                  console.log('❌ Payment status changed to FAILED/EXPIRED')
                  setPaymentStatus('failed')
                  setPaymentData(prev => ({
                    ...prev,
                    payment,
                    message: 'Pembayaran gagal atau dibatalkan'
                  }))
                }
              }
            }
          } catch (syncError) {
            console.error('❌ Error syncing with Midtrans:', syncError)
            // Fallback to just checking local payment status
            const paymentResponse = await ApiService.getPaymentByOrderId(orderId)
            if (paymentResponse.success && paymentResponse.payment) {
              const payment = paymentResponse.payment
              if (payment.status === 'PAID') {
                setPaymentStatus('success')
                setPaymentData(prev => ({
                  ...prev,
                  payment,
                  message: 'Pembayaran berhasil!'
                }))
              }
            }
          }
        } catch (err) {
          console.error('Error polling payment status:', err)
        }
      }, 5000) // Poll every 5 seconds

      return () => {
        console.log('🛑 Stopping auto-polling...')
        clearInterval(interval)
      }
    }
  }, [paymentStatus, orderId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memverifikasi pembayaran...</p>
        </div>
      </div>
    )
  }

  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/events">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Kembali ke Events
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {paymentStatus === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                <CheckCircle className="h-20 w-20 mx-auto relative" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
              <p className="text-green-100">Terima kasih telah melakukan pembayaran</p>
            </div>

              {/* Payment Details */}
              <div className="p-8 space-y-6">
                {paymentData?.payment?.event && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{paymentData.payment.event.title}</p>
                          {paymentData.payment.event.eventDate && (
                            <p className="text-sm text-gray-600">
                              {new Date(paymentData.payment.event.eventDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {paymentData.payment.event.eventTime && ` • ${paymentData.payment.event.eventTime}`}
                            </p>
                          )}
                          {paymentData.payment.event.location && (
                            <p className="text-sm text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 inline mr-1" />
                              {paymentData.payment.event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Order ID</span>
                      <span className="font-mono text-sm font-semibold text-gray-900">{orderId}</span>
                    </div>
                    
                    {paymentData?.payment?.amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jumlah</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(paymentData.payment.amount)}
                        </span>
                      </div>
                    )}
                    
                    {statusCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status Code</span>
                        <span className="font-semibold text-green-600">{statusCode}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Berhasil
                      </span>
                    </div>

                    {paymentData?.payment?.registrationId && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600">Registrasi</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          Terdaftar
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Pembayaran Diverifikasi</p>
                    <p className="text-sm text-blue-700">
                      Pembayaran Anda telah berhasil diverifikasi. Registrasi event akan diproses secara otomatis.
                      Anda akan menerima email konfirmasi beserta invoice dalam beberapa saat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {isAuthenticated && (
                  <Link href="/my-registrations" className="flex-1">
                    <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Lihat Pendaftaran Saya
                    </button>
                  </Link>
                )}
                <Link href="/events" className="flex-1">
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Jelajahi Event Lain
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Pending Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center text-white">
              <Clock className="h-20 w-20 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Menunggu Pembayaran</h1>
              <p className="text-yellow-100">Pembayaran Anda sedang diproses</p>
            </div>

            {/* Payment Details */}
            <div className="p-8 space-y-6">
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
                {isAuthenticated && (
                  <Link href="/my-registrations" className="flex-1">
                    <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
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
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Failed Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center text-white">
              <AlertCircle className="h-20 w-20 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Pembayaran Gagal</h1>
              <p className="text-red-100">Pembayaran tidak dapat diproses</p>
            </div>

            {/* Payment Details */}
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">{orderId}</span>
                  </div>
                  
                  {transactionStatus && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                        {transactionStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Pembayaran Gagal</p>
                    <p className="text-sm text-red-700">
                      Pembayaran Anda tidak dapat diproses. Silakan coba lagi atau hubungi customer service jika masalah berlanjut.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/events" className="flex-1">
                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Coba Lagi
                  </button>
                </Link>
                <Link href="/contact" className="flex-1">
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                    Hubungi Support
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

