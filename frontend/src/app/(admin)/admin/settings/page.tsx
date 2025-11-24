'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading'
import { ApiService } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
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
  const { toast } = useToast()
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

      const response = await ApiService.getSystemSettings()

      if (!response.success || !response.data?.settings) {
        throw new Error(response.message || 'Failed to fetch settings')
      }

      // Map API response (array of {key, value, description}) to UI structure
      const settingsArray = response.data.settings as Array<{ key: string; value: any; description?: string }>

      // Create a map for easy lookup
      const settingsMap: Record<string, any> = {}
      settingsArray.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })

      // Map to UI structure with defaults
      const mappedSettings: SystemSettings = {
        general: {
          siteName: settingsMap['general.siteName'] || 'Event Management System',
          siteDescription: settingsMap['general.siteDescription'] || 'Sistem manajemen event profesional',
          siteUrl: settingsMap['general.siteUrl'] || '',
          adminEmail: settingsMap['general.adminEmail'] || '',
          timezone: settingsMap['general.timezone'] || 'Asia/Jakarta',
          language: settingsMap['general.language'] || 'id'
        },
        email: {
          smtpHost: settingsMap['email.smtpHost'] || '',
          smtpPort: settingsMap['email.smtpPort'] || 587,
          smtpUser: settingsMap['email.smtpUser'] || '',
          smtpPassword: settingsMap['email.smtpPassword'] || '',
          fromEmail: settingsMap['email.fromEmail'] || '',
          fromName: settingsMap['email.fromName'] || ''
        },
        security: {
          sessionTimeout: settingsMap['security.sessionTimeout'] || 24,
          maxLoginAttempts: settingsMap['security.maxLoginAttempts'] || 5,
          passwordMinLength: settingsMap['security.passwordMinLength'] || 8,
          requireEmailVerification: settingsMap['security.requireEmailVerification'] ?? true,
          enableTwoFactor: settingsMap['security.enableTwoFactor'] ?? false
        },
        notifications: {
          emailNotifications: settingsMap['notifications.emailNotifications'] ?? true,
          adminNotifications: settingsMap['notifications.adminNotifications'] ?? true,
          userNotifications: settingsMap['notifications.userNotifications'] ?? true,
          eventReminders: settingsMap['notifications.eventReminders'] ?? true
        },
        payment: {
          defaultCurrency: settingsMap['payment.defaultCurrency'] || 'IDR',
          paymentMethods: Array.isArray(settingsMap['payment.paymentMethods'])
            ? settingsMap['payment.paymentMethods']
            : ['QR_CODE', 'BANK_TRANSFER', 'E_WALLET'],
          taxRate: settingsMap['payment.taxRate'] || 10,
          refundPolicy: settingsMap['payment.refundPolicy'] || ''
        },
        features: {
          enableRegistration: settingsMap['features.enableRegistration'] ?? true,
          enablePayments: settingsMap['features.enablePayments'] ?? true,
          enableCertificates: settingsMap['features.enableCertificates'] ?? true,
          enableQRCode: settingsMap['features.enableQRCode'] ?? true,
          enableAnalytics: settingsMap['features.enableAnalytics'] ?? true
        }
      }

      setSettings(mappedSettings)
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat pengaturan sistem'
      setError(errorMessage)
      console.error('Settings error:', err)
      toast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
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

      // Flatten settings object to key-value pairs
      const settingsToSave: Array<{ key: string; value: any; description?: string }> = []

      // General settings
      Object.entries(settings.general).forEach(([field, value]) => {
        settingsToSave.push({
          key: `general.${field}`,
          value: value,
          description: `General setting: ${field}`
        })
      })

      // Email settings
      Object.entries(settings.email).forEach(([field, value]) => {
        settingsToSave.push({
          key: `email.${field}`,
          value: value,
          description: `Email setting: ${field}`
        })
      })

      // Security settings
      Object.entries(settings.security).forEach(([field, value]) => {
        settingsToSave.push({
          key: `security.${field}`,
          value: value,
          description: `Security setting: ${field}`
        })
      })

      // Notifications settings
      Object.entries(settings.notifications).forEach(([field, value]) => {
        settingsToSave.push({
          key: `notifications.${field}`,
          value: value,
          description: `Notification setting: ${field}`
        })
      })

      // Payment settings
      Object.entries(settings.payment).forEach(([field, value]) => {
        settingsToSave.push({
          key: `payment.${field}`,
          value: value,
          description: `Payment setting: ${field}`
        })
      })

      // Features settings
      Object.entries(settings.features).forEach(([field, value]) => {
        settingsToSave.push({
          key: `features.${field}`,
          value: value,
          description: `Feature setting: ${field}`
        })
      })

      // Update all settings in parallel
      const updatePromises = settingsToSave.map(setting =>
        ApiService.updateSystemSetting(setting.key, setting.value, setting.description)
      )

      const results = await Promise.allSettled(updatePromises)

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        throw new Error(`Failed to save ${failures.length} setting(s)`)
      }

      setSuccess('Pengaturan berhasil disimpan')
      toast({
        type: 'success',
        title: 'Success',
        message: 'Pengaturan berhasil disimpan'
      })
      setTimeout(() => setSuccess(null), 3000)

      // Refresh settings to get latest from server
      await fetchSettings()
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal menyimpan pengaturan'
      setError(errorMessage)
      console.error('Save error:', err)
      toast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
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
          <button
            onClick={fetchSettings}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Konfigurasi sistem dan pengaturan aplikasi</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={`mb-6 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200`}>
              {success}
            </div>
          )}
          {error && (
            <div className={`mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200`}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
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
          <div className="space-y-8">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                        placeholder="Nama situs"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
                      <input
                        type="text"
                        value={settings.general.siteUrl}
                        onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <input
                      type="text"
                      value={settings.general.siteDescription}
                      onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                      placeholder="Deskripsi situs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                      <input
                        type="email"
                        value={settings.general.adminEmail}
                        onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="id">Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.email.smtpHost}
                        onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                      <input
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                        placeholder="587"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP User</label>
                      <input
                        type="text"
                        value={settings.email.smtpUser}
                        onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                        placeholder="noreply@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                      <input
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                        placeholder="********"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                      <input
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
                        placeholder="noreply@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                      <input
                        type="text"
                        value={settings.email.fromName}
                        onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
                        placeholder="Event Management System"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        placeholder="24"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        placeholder="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      placeholder="8"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                      <select
                        value={settings.payment.defaultCurrency}
                        onChange={(e) => handleInputChange('payment', 'defaultCurrency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="IDR">IDR (Indonesian Rupiah)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                      <input
                        type="number"
                        value={settings.payment.taxRate}
                        onChange={(e) => handleInputChange('payment', 'taxRate', parseFloat(e.target.value))}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Refund Policy</label>
                    <input
                      type="text"
                      value={settings.payment.refundPolicy}
                      onChange={(e) => handleInputChange('payment', 'refundPolicy', e.target.value)}
                      placeholder="Refund dalam 7 hari kerja"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Features Settings */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Feature Settings</h2>
                <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={fetchSettings}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
