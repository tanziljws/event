'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  FileText,
  QrCode,
  UserCheck,
  ChevronRight,
  Image
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAuthenticated, isInitialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Strict admin role protection
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }

      if (user.role !== 'SUPER_ADMIN') {
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  if (!isInitialized || !isAuthenticated || !user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, color: 'blue' },
    { name: 'Events', href: '/admin/events', icon: Calendar, color: 'purple' },
    { name: 'Events Banner', href: '/admin/events/header', icon: Image, color: 'amber' },
    { name: 'Homepage Events', href: '/admin/events/homepage', icon: Calendar, color: 'green' },
    { name: 'Teams', href: '/admin/teams', icon: UserCheck, color: 'indigo' },
    { name: 'Attendance', href: '/admin/attendance', icon: QrCode, color: 'pink' },
    { name: 'Certificate Templates', href: '/admin/certificate-templates', icon: FileText, color: 'cyan' },
    { name: 'Global Templates', href: '/admin/certificate-templates/global', icon: FileText, color: 'teal' },
    { name: 'Users', href: '/admin/users', icon: Users, color: 'violet' },
    { name: 'Email Templates', href: '/admin/email-templates', icon: FileText, color: 'slate' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'gray' },
  ]

  const handleLogout = async () => {
    await logout()
  }

  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        pink: 'bg-pink-50 text-pink-700 border-pink-200',
        cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        teal: 'bg-teal-50 text-teal-700 border-teal-200',
        violet: 'bg-violet-50 text-violet-700 border-violet-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
      }
      return colors[color] || colors.blue
    }
    return 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
  }

  const SidebarContent = () => (
    <>
      {/* Logo/Header - Clean Solid Color */}
      <div className="flex h-16 items-center px-6 border-b border-gray-100 bg-white">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                aria-hidden="true"
              />
              {item.name}
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
              )}
            </Link>
          )
        })}
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 gap-3">
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-blue-600">
                {user?.fullName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'admin@example.com'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
          <div className="absolute top-0 right-0 -mr-12 pt-4">
            <button
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex h-full flex-col bg-white">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white shadow-sm">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:text-gray-900 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Header Actions */}
            </div>
          </div>
        </div>

        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
