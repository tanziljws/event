'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { CreditCard, Smartphone, Building, Bitcoin, QrCode, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ApiService } from '@/lib/api'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  eventPrice: number
  registrationId?: string // Optional - for old flow
  paymentId?: string // New - for payment order flow
  paymentUrl?: string // New - Midtrans payment URL
  onPaymentSuccess: () => void
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  type: 'gateway' | 'manual' | 'crypto'
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'gateway',
    name: 'Payment Gateway',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'GoPay, DANA, OVO, Bank Transfer',
    type: 'gateway'
  },
  {
    id: 'qr',
    name: 'QR Code',
    icon: <QrCode className="h-5 w-5" />,
    description: 'Scan QR Code untuk pembayaran',
    type: 'manual'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: <Building className="h-5 w-5" />,
    description: 'Transfer ke rekening bank',
    type: 'manual'
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: <Bitcoin className="h-5 w-5" />,
    description: 'USDT, BTC, ETH',
    type: 'crypto'
  }
]

export function PaymentModal({ 
  isOpen, 
  onClose, 
  eventTitle, 
  eventPrice, 
  registrationId,
  paymentId,
  paymentUrl,
  onPaymentSuccess 
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed' | 'cancelled'>('pending')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [cancellingPayment, setCancellingPayment] = useState(false)
  const paymentCheckIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Base URL for file access
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://backend-nasa.up.railway.app'

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('')
      setPaymentData(null)
      setPaymentStatus('pending')
      
      // If paymentUrl is provided (Midtrans), set status to processing
      if (paymentUrl) {
        setPaymentStatus('processing')
        setPaymentData({ paymentUrl })
        // Start checking payment status
        checkPaymentStatusInterval()
      }
    } else {
      // Clean up interval when modal closes
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current)
        paymentCheckIntervalRef.current = null
      }
    }

    return () => {
      // Cleanup on unmount
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current)
      }
    }
  }, [isOpen, paymentUrl])

  // Check payment status periodically
  const checkPaymentStatusInterval = () => {
    if (!paymentId) return
    
    paymentCheckIntervalRef.current = setInterval(async () => {
      try {
        setCheckingPayment(true)
        const response = await ApiService.checkPaymentStatus(paymentId)
        if (response.success && response.data) {
          const payment = response.data.payment || response.data
          if (payment.paymentStatus === 'PAID') {
            setPaymentStatus('success')
            if (paymentCheckIntervalRef.current) {
              clearInterval(paymentCheckIntervalRef.current)
              paymentCheckIntervalRef.current = null
            }
            setTimeout(() => {
              onPaymentSuccess()
              onClose()
            }, 2000)
          } else if (payment.paymentStatus === 'FAILED') {
            setPaymentStatus('failed')
            if (paymentCheckIntervalRef.current) {
              clearInterval(paymentCheckIntervalRef.current)
              paymentCheckIntervalRef.current = null
            }
          } else if (payment.paymentStatus === 'EXPIRED' || payment.paymentStatus === 'CANCELLED') {
            setPaymentStatus('cancelled')
            if (paymentCheckIntervalRef.current) {
              clearInterval(paymentCheckIntervalRef.current)
              paymentCheckIntervalRef.current = null
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      } finally {
        setCheckingPayment(false)
      }
    }, 3000) // Check every 3 seconds

    // Clear interval after 5 minutes
    setTimeout(() => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current)
        paymentCheckIntervalRef.current = null
      }
    }, 300000)
  }

  // Handle modal close with payment cancellation
  const handleClose = async () => {
    // If payment is processing and has paymentId, cancel it
    if (paymentStatus === 'processing' && paymentId) {
      try {
        setCancellingPayment(true)
        await ApiService.cancelPayment(paymentId)
        setPaymentStatus('cancelled')
        // Wait a bit before closing to show cancelled status
        setTimeout(() => {
          onClose()
        }, 1500)
      } catch (error) {
        console.error('Error cancelling payment:', error)
        // Close anyway even if cancel fails
        onClose()
      } finally {
        setCancellingPayment(false)
      }
    } else {
      // Just close if not processing
      onClose()
    }
  }

  const handlePaymentMethodSelect = async (methodId: string) => {
    try {
      setLoading(true)
      setSelectedMethod(methodId)
      
      // Create payment based on selected method
      let response
      if (methodId === 'gateway') {
        response = await ApiService.createGatewayPayment(registrationId, {
          amount: eventPrice,
          gateway: 'duitku',
          paymentMethod: 'all'
        })
      } else {
        response = await ApiService.createPayment(registrationId, eventPrice, methodId.toUpperCase())
      }

      if (response.success) {
        setPaymentData(response.data)
        setPaymentStatus('processing')
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = () => {
    setPaymentStatus('success')
    setTimeout(() => {
      onPaymentSuccess()
      onClose()
    }, 2000)
  }

  const handleCryptoVerification = async (txHash: string) => {
    try {
      setLoading(true)
      
      // Verify TX hash with backend
      const response = await ApiService.verifyCryptoPaymentByTxHash(registrationId, txHash)
      
      if (response.success) {
        setPaymentStatus('success')
        setTimeout(() => {
          onPaymentSuccess()
          onClose()
        }, 2000)
      } else {
        throw new Error(response.message || 'Verifikasi gagal')
      }
    } catch (error) {
      console.error('Crypto verification error:', error)
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const renderPaymentContent = () => {
    if (paymentStatus === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Pembayaran Berhasil!</h3>
          <p className="text-gray-600">Registrasi event berhasil diselesaikan.</p>
        </div>
      )
    }

    if (paymentStatus === 'cancelled') {
      return (
        <div className="text-center py-8">
          <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Pembayaran Dibatalkan</h3>
          <p className="text-gray-600 mb-4">Pembayaran telah dibatalkan. Anda dapat mencoba lagi nanti.</p>
        </div>
      )
    }

    if (paymentStatus === 'failed') {
      return (
        <div className="text-center py-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Pembayaran Gagal</h3>
          <p className="text-gray-600 mb-4">Terjadi kesalahan saat memproses pembayaran.</p>
          <Button onClick={() => setPaymentStatus('pending')} variant="outline">
            Coba Lagi
          </Button>
        </div>
      )
    }

    if (paymentStatus === 'processing' && paymentData) {
      return (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <Clock className="h-16 w-16 text-blue-600 mx-auto relative" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Menunggu Pembayaran</h3>
            <p className="text-gray-600 text-sm">Silakan selesaikan pembayaran sesuai instruksi di bawah ini.</p>
          </div>

          {selectedMethod === 'gateway' && paymentData.paymentUrl && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Instruksi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Klik tombol di bawah untuk melanjutkan ke halaman pembayaran.
                  </p>
                  <Button 
                    onClick={() => window.open(paymentData.paymentUrl, '_blank')}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Lanjutkan Pembayaran
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedMethod === 'qr' && paymentData.qrCodeUrl && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">QR Code Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <img 
                    src={`${baseUrl}${paymentData.qrCodeUrl}`} 
                    alt="QR Code Payment"
                    className="mx-auto mb-4 max-w-48"
                  />
                  <p className="text-sm text-gray-600">
                    Scan QR Code di atas untuk melakukan pembayaran
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedMethod === 'bank' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transfer Bank</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank:</span>
                      <span className="text-sm font-medium">BCA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">No. Rekening:</span>
                      <span className="text-sm font-medium">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Atas Nama:</span>
                      <span className="text-sm font-medium">Event Management</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Jumlah:</span>
                      <span className="text-sm font-medium">{formatPrice(eventPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedMethod === 'crypto' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cryptocurrency Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Instruksi Pembayaran Crypto:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Kirim <strong>USDT</strong> ke alamat: <code className="bg-yellow-100 px-1 rounded">0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</code></li>
                        <li>• Jumlah: <strong>{formatPrice(eventPrice)}</strong> USDT</li>
                        <li>• Network: <strong>Ethereum (ERC-20)</strong></li>
                        <li>• Setelah transfer, masukkan TX Hash untuk verifikasi</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Transaction Hash (TX Hash):
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                          const txHash = e.target.value
                          if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
                            // Auto-verify TX hash
                            handleCryptoVerification(txHash)
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Masukkan TX Hash dari transaksi Anda (dimulai dengan 0x, panjang 66 karakter)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!paymentUrl && (
          <div className="flex space-x-3">
            <Button onClick={handlePaymentComplete} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Saya Sudah Bayar
            </Button>
            <Button onClick={() => setPaymentStatus('pending')} variant="outline">
              Ganti Metode
            </Button>
          </div>
          )}
          
          {paymentUrl && paymentId && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Status Pembayaran
                  </p>
                  <p className="text-sm text-blue-700 mb-2">
                    {checkingPayment ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></span>
                        Memeriksa...
                      </span>
                    ) : (
                      'Menunggu pembayaran'
                    )}
              </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                Pembayaran akan diverifikasi otomatis. Jika sudah membayar, tunggu beberapa saat untuk konfirmasi.
              </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold mb-2">Pilih Metode Pembayaran</h3>
          <p className="text-gray-600">
            Total yang harus dibayar: <span className="font-semibold">{formatPrice(eventPrice)}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {paymentMethods.map((method) => (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-colors ${
                selectedMethod === method.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handlePaymentMethodSelect(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{method.name}</h4>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Pembayaran Event" size="lg">
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{eventTitle}</h2>
          <p className="text-sm text-gray-600">Selesaikan pembayaran untuk menyelesaikan registrasi</p>
        </div>

        {loading || cancellingPayment ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 mt-4">
              {cancellingPayment ? 'Membatalkan pembayaran...' : 'Memproses...'}
            </p>
          </div>
        ) : (
          renderPaymentContent()
        )}

        {paymentStatus === 'pending' && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              onClick={handleClose} 
              variant="outline"
              className="min-w-[100px]"
            >
              Batal
            </Button>
          </div>
        )}

        {paymentStatus === 'processing' && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              onClick={handleClose} 
              variant="outline"
              className="min-w-[100px]"
              disabled={cancellingPayment}
            >
              {cancellingPayment ? 'Membatalkan...' : 'Batalkan Pembayaran'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
