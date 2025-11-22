'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  FileText,
  Shield,
  TrendingUp,
  Calendar,
  Wrench
} from 'lucide-react'

interface OperationsSidebarProps {
  userRole: string
}

export function OperationsSidebar({ userRole }: OperationsSidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/department/operations/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']
    },
    {
      name: 'Organizer Review',
      href: '/department/operations/organizers',
      icon: UserCheck,
      roles: ['SUPER_ADMIN', 'OPS_SENIOR_AGENT', 'OPS_AGENT']
    },
  {
    name: 'Analytics',
    href: '/department/operations/analytics',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT']
  },
  {
    name: 'Reports',
    href: '/department/operations/reports',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT']
  },
    {
      name: 'User Management',
      href: '/department/operations/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'OPS_HEAD']
    }
  ]

  const filteredNavigationItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  )

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'OPS_HEAD': return 'Head of Operations'
      case 'OPS_SENIOR_AGENT': return 'Senior Agent'
      case 'OPS_AGENT': return 'Operations Agent'
      case 'SUPER_ADMIN': return 'Super Admin'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OPS_HEAD': return 'bg-red-100 text-red-800'
      case 'OPS_SENIOR_AGENT': return 'bg-blue-100 text-blue-800'
      case 'OPS_AGENT': return 'bg-green-100 text-green-800'
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Operations</h1>
            <p className="text-xs text-gray-500">Department Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-600">
              {getRoleDisplayName(userRole).charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getRoleDisplayName(userRole)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              Operations Department
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredNavigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Main Dashboard
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken')
              window.location.href = '/login'
            }}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
