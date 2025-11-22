'use client'

import React, { useState, useEffect } from 'react'
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
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending')
  const [checkingPayment, setCheckingPayment] = useState(false)
  
  // Base URL for file access
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://web-production-38c7.up.railway.app'

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
    }
  }, [isOpen, paymentUrl])

  // Check payment status periodically
  const checkPaymentStatusInterval = () => {
    if (!paymentId) return
    
    const interval = setInterval(async () => {
      try {
        setCheckingPayment(true)
        const response = await ApiService.checkPaymentStatus(paymentId)
        if (response.success && response.data) {
          const payment = response.data.payment || response.data
          if (payment.paymentStatus === 'PAID') {
            setPaymentStatus('success')
            clearInterval(interval)
            setTimeout(() => {
              onPaymentSuccess()
              onClose()
            }, 2000)
          } else if (payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'CANCELLED') {
            setPaymentStatus('failed')
            clearInterval(interval)
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
      clearInterval(interval)
    }, 300000)
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
        <div className="space-y-4">
          <div className="text-center py-4">
            <Clock className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Menunggu Pembayaran</h3>
            <p className="text-gray-600">Silakan selesaikan pembayaran sesuai instruksi di bawah ini.</p>
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

          {!currentPaymentUrl && (
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
          
          {currentPaymentUrl && paymentId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Status Pembayaran:</strong> {checkingPayment ? 'Memeriksa...' : 'Menunggu pembayaran'}
              </p>
              <p className="text-xs text-blue-600">
                Pembayaran akan diverifikasi otomatis. Jika sudah membayar, tunggu beberapa saat untuk konfirmasi.
              </p>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Pembayaran Event">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{eventTitle}</h2>
          <p className="text-gray-600">Selesaikan pembayaran untuk menyelesaikan registrasi</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          renderPaymentContent()
        )}

        {paymentStatus === 'pending' && (
          <div className="flex justify-end space-x-3">
            <Button onClick={onClose} variant="outline">
              Batal
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
