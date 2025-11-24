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
  Plus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Briefcase,
  Wallet
} from 'lucide-react'

interface OrganizerLayoutProps {
  children: React.ReactNode
}

// Helper function to get effective role (check temporaryRole from metadata)
const getEffectiveRole = (user: any) => {
  if (!user) return null
  
  const metadata = user.metadata && typeof user.metadata === 'object' && user.metadata !== null ? user.metadata : null
  const temporaryRole = metadata?.temporaryRole
  
  // If in temporary mode, use temporary role
  if (temporaryRole === 'PARTICIPANT') {
    return 'PARTICIPANT'
  } else if (temporaryRole === 'ORGANIZER') {
    return 'ORGANIZER'
  }
  
  // Otherwise use original role
  return user.role
}

export default function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAuthenticated, isInitialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Organizer role protection - check effective role (including temporary mode)
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !user) {
        router.push('/login')
        return
      }

      const effectiveRole = getEffectiveRole(user)
      
      // Block access if in participant mode
      if (effectiveRole === 'PARTICIPANT') {
        router.push('/dashboard')
        return
      }

      // Block access if not organizer/admin
      if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/organizer', icon: LayoutDashboard, color: 'blue' },
    { name: 'My Events', href: '/organizer/events', icon: Calendar, color: 'purple' },
    { name: 'Create Event', href: '/organizer/events/create', icon: Plus, color: 'green' },
    { name: 'Analytics', href: '/organizer/analytics', icon: BarChart3, color: 'orange' },
    { name: 'Attendance', href: '/organizer/attendance', icon: Users, color: 'pink' },
    { name: 'Wallet', href: '/organizer/wallet', icon: Wallet, color: 'yellow' },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const SidebarContent = () => (
    <>
      {/* Logo/Header - Clean Solid Color */}
      <div className="flex h-16 items-center px-6 border-b border-gray-100 bg-white">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Organizer Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href
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
                {user?.fullName?.charAt(0).toUpperCase() || 'O'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || 'Organizer'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'organizer@example.com'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0 transition-colors"
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
