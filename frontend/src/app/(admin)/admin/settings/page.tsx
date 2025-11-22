'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { 
  Settings, 
  Save, 
  RefreshCw,
  Mail,
  Shield,
  Database,
  Bell,
  Globe,
  Lock,
  Users,
  Calendar,
  CreditCard
} from 'lucide-react'

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    siteUrl: string
    adminEmail: string
    timezone: string
    language: string
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireEmailVerification: boolean
    enableTwoFactor: boolean
  }
  notifications: {
    emailNotifications: boolean
    adminNotifications: boolean
    userNotifications: boolean
    eventReminders: boolean
  }
  payment: {
    defaultCurrency: string
    paymentMethods: string[]
    taxRate: number
    refundPolicy: string
  }
  features: {
    enableRegistration: boolean
    enablePayments: boolean
    enableCertificates: boolean
    enableQRCode: boolean
    enableAnalytics: boolean
  }
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate settings data (replace with actual API calls)
      const mockSettings: SystemSettings = {
        general: {
          siteName: 'Event Management System',
          siteDescription: 'Sistem manajemen event profesional',
          siteUrl: 'https://events.example.com',
          adminEmail: 'admin@example.com',
          timezone: 'Asia/Jakarta',
          language: 'id'
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@example.com',
          smtpPassword: '********',
          fromEmail: 'noreply@example.com',
          fromName: 'Event Management System'
        },
        security: {
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireEmailVerification: true,
          enableTwoFactor: false
        },
        notifications: {
          emailNotifications: true,
          adminNotifications: true,
          userNotifications: true,
          eventReminders: true
        },
        payment: {
          defaultCurrency: 'IDR',
          paymentMethods: ['QR_CODE', 'BANK_TRANSFER', 'E_WALLET'],
          taxRate: 10,
          refundPolicy: 'Refund dalam 7 hari kerja'
        },
        features: {
          enableRegistration: true,
          enablePayments: true,
          enableCertificates: true,
          enableQRCode: true,
          enableAnalytics: true
        }
      }
      
      setSettings(mockSettings)
    } catch (err) {
      setError('Gagal memuat pengaturan sistem')
      console.error('Settings error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Pengaturan berhasil disimpan')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Gagal menyimpan pengaturan')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const handleArrayChange = (section: keyof SystemSettings, field: string, value: string[]) => {
    if (!settings) return
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchSettings}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  if (!settings) return null

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'features', label: 'Features', icon: Globe }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600">Konfigurasi sistem dan pengaturan aplikasi</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Pengaturan umum sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Site Name</label>
                  <Input
                    value={settings.general.siteName}
                    onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                    placeholder="Nama situs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Site URL</label>
                  <Input
                    value={settings.general.siteUrl}
                    onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Site Description</label>
                <Input
                  value={settings.general.siteDescription}
                  onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                  placeholder="Deskripsi situs"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Email</label>
                  <Input
                    value={settings.general.adminEmail}
                    onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Konfigurasi SMTP dan email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Host</label>
                  <Input
                    value={settings.email.smtpHost}
                    onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Port</label>
                  <Input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP User</label>
                  <Input
                    value={settings.email.smtpUser}
                    onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Password</label>
                  <Input
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From Email</label>
                  <Input
                    value={settings.email.fromEmail}
                    onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">From Name</label>
                  <Input
                    value={settings.email.fromName}
                    onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
                    placeholder="Event Management System"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Pengaturan keamanan dan autentikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password Min Length</label>
                <Input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  placeholder="8"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Require Email Verification</label>
                    <p className="text-xs text-gray-500">User harus verifikasi email untuk aktivasi akun</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.requireEmailVerification}
                    onChange={(e) => handleInputChange('security', 'requireEmailVerification', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Two-Factor Authentication</label>
                    <p className="text-xs text-gray-500">Tambahkan keamanan ekstra dengan 2FA</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => handleInputChange('security', 'enableTwoFactor', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Pengaturan notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-xs text-gray-500">Aktifkan notifikasi via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Admin Notifications</label>
                    <p className="text-xs text-gray-500">Notifikasi untuk admin</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.adminNotifications}
                    onChange={(e) => handleInputChange('notifications', 'adminNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">User Notifications</label>
                    <p className="text-xs text-gray-500">Notifikasi untuk user</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.userNotifications}
                    onChange={(e) => handleInputChange('notifications', 'userNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Event Reminders</label>
                    <p className="text-xs text-gray-500">Pengingat event untuk peserta</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.eventReminders}
                    onChange={(e) => handleInputChange('notifications', 'eventReminders', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Konfigurasi sistem pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Default Currency</label>
                  <select
                    value={settings.payment.defaultCurrency}
                    onChange={(e) => handleInputChange('payment', 'defaultCurrency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IDR">IDR (Indonesian Rupiah)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={settings.payment.taxRate}
                    onChange={(e) => handleInputChange('payment', 'taxRate', parseFloat(e.target.value))}
                    placeholder="10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Methods</label>
                <div className="space-y-2">
                  {['QR_CODE', 'BANK_TRANSFER', 'E_WALLET', 'CRYPTO', 'GATEWAY'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.paymentMethods.includes(method)}
                        onChange={(e) => {
                          const newMethods = e.target.checked
                            ? [...settings.payment.paymentMethods, method]
                            : settings.payment.paymentMethods.filter(m => m !== method)
                          handleArrayChange('payment', 'paymentMethods', newMethods)
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm">{method.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refund Policy</label>
                <Input
                  value={settings.payment.refundPolicy}
                  onChange={(e) => handleInputChange('payment', 'refundPolicy', e.target.value)}
                  placeholder="Refund dalam 7 hari kerja"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Settings */}
        {activeTab === 'features' && (
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>Aktifkan atau nonaktifkan fitur sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Registration</label>
                    <p className="text-xs text-gray-500">Aktifkan sistem registrasi event</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.features.enableRegistration}
                    onChange={(e) => handleInputChange('features', 'enableRegistration', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Payments</label>
                    <p className="text-xs text-gray-500">Aktifkan sistem pembayaran</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.features.enablePayments}
                    onChange={(e) => handleInputChange('features', 'enablePayments', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Certificates</label>
                    <p className="text-xs text-gray-500">Aktifkan sistem sertifikat</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.features.enableCertificates}
                    onChange={(e) => handleInputChange('features', 'enableCertificates', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable QR Code</label>
                    <p className="text-xs text-gray-500">Aktifkan sistem QR code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.features.enableQRCode}
                    onChange={(e) => handleInputChange('features', 'enableQRCode', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Analytics</label>
                    <p className="text-xs text-gray-500">Aktifkan sistem analytics</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.features.enableAnalytics}
                    onChange={(e) => handleInputChange('features', 'enableAnalytics', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
