'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentErrorPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [errorData, setErrorData] = useState<any>(null)

  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')
  const transactionStatus = searchParams.get('transaction_status')

  useEffect(() => {
    setLoading(false)
    if (orderId) {
      setErrorData({
        orderId,
        statusCode,
        transactionStatus
      })
    }
  }, [orderId, statusCode, transactionStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center text-white">
            <AlertCircle className="h-20 w-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Pembayaran Gagal</h1>
            <p className="text-red-100">Terjadi kesalahan saat memproses pembayaran</p>
          </div>

          {/* Error Details */}
          <div className="p-8 space-y-6">
            {orderId && (
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
            )}

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
                  <RefreshCw className="h-5 w-5 mr-2" />
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
      </div>
    </div>
  )
}

