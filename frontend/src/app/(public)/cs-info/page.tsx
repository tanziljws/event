'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Ticket, 
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function CSInfoPage() {
  const router = useRouter()

  const features = [
    {
      title: 'Dashboard',
      description: 'View customer service metrics and team performance',
      icon: Settings,
      path: '/department/customer_service/dashboard',
      color: 'bg-blue-500',
      status: 'ready'
    },
    {
      title: 'Team Management',
      description: 'Manage team members and their roles',
      icon: Users,
      path: '/department/customer_service/team',
      color: 'bg-green-500',
      status: 'ready'
    },
    {
      title: 'Tickets',
      description: 'View and manage customer support tickets',
      icon: Ticket,
      path: '/department/customer_service/tickets',
      color: 'bg-purple-500',
      status: 'ready'
    }
  ]

  const credentials = [
    { role: 'CS Head', email: 'alice.customer@company.com', password: 'temp_password_123' },
    { role: 'CS Agent', email: 'bob.support@company.com', password: 'temp_password_123' },
    { role: 'CS Agent', email: 'sarah.johnson@company.com', password: 'temp_password_123' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Customer Service Department
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete customer support system with team management and ticket system
          </p>
        </div>

        {/* Status Alert */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-900">System Status: READY</h3>
              <p className="text-green-800">
                All Customer Service features are implemented and ready for testing
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">Ready</span>
                  </div>
                  <Button
                    onClick={() => router.push(feature.path)}
                    className="text-sm"
                    variant="outline"
                    size="sm"
                  >
                    Access
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Login Credentials */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Login Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((cred, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{cred.role}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {cred.email}</p>
                  <p><strong>Password:</strong> {cred.password}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">Login Page</h3>
                <p className="text-sm text-gray-600">Access the authentication system</p>
              </div>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                size="sm"
              >
                Login
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">Contact Form</h3>
                <p className="text-sm text-gray-600">Public contact form for customers</p>
              </div>
              <Button
                onClick={() => router.push('/contact')}
                variant="outline"
                size="sm"
              >
                View
              </Button>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Backend APIs</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Dashboard API: <code>GET /api/admin/dashboard/CUSTOMER_SERVICE</code></li>
                <li>✅ Team Management: <code>GET /api/departments/structure</code></li>
                <li>✅ Staff Creation: <code>POST /api/admin/create-staff</code></li>
                <li>✅ Authentication: <code>POST /api/auth/login</code></li>
                <li>✅ Role-based Access Control</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Frontend Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Dashboard with real-time metrics</li>
                <li>✅ Team management interface</li>
                <li>✅ Ticket system with filters</li>
                <li>✅ Contact form integration</li>
                <li>✅ Protected routes with role checking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}