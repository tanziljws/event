import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true
}) => {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''}`
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
    <Skeleton height={20} width="60%" className="mb-4" />
    <Skeleton height={16} width="100%" className="mb-2" />
    <Skeleton height={16} width="80%" className="mb-2" />
    <Skeleton height={16} width="90%" />
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={16} width="20%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} height={16} width="20%" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
    <Skeleton height={24} width="40%" className="mb-4" />
    <div className="space-y-3">
      <Skeleton height={200} width="100%" />
      <div className="flex justify-between">
        <Skeleton height={16} width="15%" />
        <Skeleton height={16} width="15%" />
        <Skeleton height={16} width="15%" />
        <Skeleton height={16} width="15%" />
      </div>
    </div>
  </div>
)

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton height={16} width="25%" />
        <Skeleton height={40} width="100%" rounded="lg" />
      </div>
    ))}
  </div>
)

export const SkeletonEventCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
    <Skeleton height={200} width="100%" rounded="none" />
    <div className="p-4 space-y-3">
      <Skeleton height={20} width="80%" />
      <Skeleton height={16} width="100%" />
      <Skeleton height={16} width="60%" />
      <div className="flex justify-between items-center">
        <Skeleton height={16} width="30%" />
        <Skeleton height={32} width="80px" rounded="lg" />
      </div>
    </div>
  </div>
)

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton height={32} width="200px" />
      <Skeleton height={40} width="120px" rounded="lg" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
          <Skeleton height={16} width="60%" className="mb-2" />
          <Skeleton height={32} width="40%" className="mb-1" />
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>

    {/* Recent Events */}
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <Skeleton height={24} width="30%" className="mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton height={60} width={60} rounded="lg" />
            <div className="flex-1 space-y-2">
              <Skeleton height={18} width="70%" />
              <Skeleton height={14} width="50%" />
              <Skeleton height={14} width="40%" />
            </div>
            <Skeleton height={32} width="80px" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const SkeletonAttendance: React.FC = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="text-center">
      <Skeleton height={40} width="300px" className="mx-auto mb-2" />
      <Skeleton height={20} width="200px" className="mx-auto" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <Skeleton height={48} width="60px" className="mx-auto mb-3" />
          <Skeleton height={24} width="40%" className="mx-auto mb-1" />
          <Skeleton height={16} width="60%" className="mx-auto" />
        </div>
      ))}
    </div>

    {/* Forms */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Event Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Skeleton height={24} width="40%" className="mb-4" />
        <SkeletonForm fields={2} />
      </div>

      {/* QR Scanner */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Skeleton height={24} width="30%" className="mb-4" />
        <SkeletonForm fields={2} />
      </div>
    </div>

    {/* Participants List */}
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <Skeleton height={24} width="35%" className="mb-4" />
      <SkeletonTable rows={5} columns={4} />
    </div>
  </div>
)

export const SkeletonCertificateTemplates: React.FC = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton height={32} width="250px" />
      <Skeleton height={40} width="120px" rounded="lg" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Sidebar */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Skeleton height={24} width="50%" className="mb-4" />
          <SkeletonForm fields={3} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Skeleton height={24} width="60%" className="mb-4" />
          <SkeletonForm fields={4} />
        </div>
      </div>

      {/* Canvas Area */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Skeleton height={24} width="40%" className="mb-4" />
          <Skeleton height={400} width="100%" rounded="lg" />
        </div>
      </div>
    </div>
  </div>
)
