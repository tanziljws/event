'use client'

import React from 'react'
import { OperationsSidebar } from './operations-sidebar'
import { useAuth } from '@/contexts/auth-context'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OperationsLayoutProps {
  children: React.ReactNode
}

export function OperationsLayout({ children }: OperationsLayoutProps) {
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <OperationsSidebar userRole={user?.role || ''} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Operations Management
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'Operations User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'OPS_HEAD' ? 'Head of Operations' :
                     user?.role === 'OPS_SENIOR_AGENT' ? 'Senior Agent' :
                     user?.role === 'OPS_AGENT' ? 'Operations Agent' :
                     user?.role || 'Operations'}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
