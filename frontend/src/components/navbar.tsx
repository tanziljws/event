'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading'
import SearchModal from '@/components/search-modal'
import NotificationBell from '@/components/NotificationBell'
import { getImageUrl } from '@/lib/image-utils'

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

// Helper functions for role-based navigation
const getDashboardUrl = (user: any) => {
  const effectiveRole = getEffectiveRole(user)
  const role = effectiveRole || user?.role || 'PARTICIPANT'
  const verificationStatus = user?.verificationStatus
  
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard'
    case 'CS_HEAD':
      return '/department/customer_service/dashboard'
    case 'OPS_HEAD':
      return '/department/operations/dashboard'
    case 'FINANCE_HEAD':
      return '/department/finance/dashboard'
    case 'CS_AGENT':
      return '/department/customer_service/dashboard'
    case 'OPS_AGENT':
      return '/department/operations/dashboard'
    case 'FINANCE_AGENT':
      return '/department/finance/dashboard'
    case 'ORGANIZER':
      // If organizer is not approved, treat as participant
      return verificationStatus === 'APPROVED' ? '/organizer' : '/dashboard'
    case 'PARTICIPANT':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

const isDepartmentHead = (role: string) => {
  return ['CS_HEAD', 'OPS_HEAD', 'FINANCE_HEAD'].includes(role)
}

const isDepartmentAgent = (role: string) => {
  return ['CS_AGENT', 'OPS_AGENT', 'FINANCE_AGENT'].includes(role)
}

// Helper function to get display role based on verification status and temporary mode
const getDisplayRole = (user: any) => {
  if (!user) return 'Peserta'
  
  const effectiveRole = getEffectiveRole(user)
  const role = effectiveRole || user.role
  const verificationStatus = user.verificationStatus
  
  // If in participant mode, always show "Peserta"
  if (effectiveRole === 'PARTICIPANT') {
    return 'Peserta'
  }
  
  // If in organizer mode (temporary), show "Organizer"
  if (effectiveRole === 'ORGANIZER' && user.metadata?.temporaryRole === 'ORGANIZER') {
    return 'Organizer'
  }
  
  // Original role logic
  if (role === 'ORGANIZER') {
    if (verificationStatus === 'APPROVED') {
      return 'Organizer'
    } else if (verificationStatus === 'PENDING') {
      return 'Organizer (Pending)'
    } else if (verificationStatus === 'REJECTED') {
      return 'Organizer (Rejected)'
    } else {
      return 'Peserta'
    }
  }
  return 'Peserta'
}

const getDepartmentName = (department: string) => {
  switch (department) {
    case 'CUSTOMER_SERVICE':
      return 'Customer Service'
    case 'OPERATIONS':
      return 'Operations'
    case 'FINANCE':
      return 'Finance'
    default:
      return department
  }
}

// Helper function to get user initials
const getUserInitials = (fullName: string) => {
  if (!fullName) return 'U'
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Navbar() {
  const { user, isAuthenticated, isInitialized, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const router = useRouter()

  // Get effective role and mode
  const effectiveRole = user ? getEffectiveRole(user) : null
  const isInParticipantMode = effectiveRole === 'PARTICIPANT'

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const openSearchModal = () => {
    setIsSearchModalOpen(true)
  }

  const closeSearchModal = () => {
    setIsSearchModalOpen(false)
  }

  // Keyboard shortcut for search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!isSearchModalOpen) {
          openSearchModal()
        } else {
          closeSearchModal()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchModalOpen])

  if (!isInitialized) {
    return (
      <>
        {/* Top Banner - Blue Bar (Loading State) */}
        <div className="bg-blue-600 text-white py-2.5 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="h-4 w-32 bg-blue-500 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-blue-500 rounded animate-pulse hidden sm:block"></div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="h-4 w-28 bg-blue-500 rounded animate-pulse hidden md:block"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navbar (Loading State) */}
        <header className="bg-white border-b border-blue-100 sticky top-10 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-visible border border-gray-200">
                  <img
                    src="/logo-nusa.png"
                    alt="Nusa Logo"
                    className="h-full w-auto max-w-full object-contain"
                    style={{ maxHeight: '48px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span class="text-blue-600 font-bold text-sm">N</span>';
                      }
                    }}
                  />
                </div>
                <h1 className="text-xl font-light text-gray-900 ml-3">Nusa</h1>
              </div>
              <div className="flex items-center">
                <LoadingSpinner />
              </div>
            </div>
          </div>
        </header>
      </>
    )
  }

  return (
    <>
      {/* Main Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <img
                  src="/logo-nusa.png"
                  alt="Nusa Logo"
                  className="h-20 w-auto max-w-full object-contain group-hover:opacity-80 transition-all duration-300"
                  style={{ maxHeight: '80px' }}
                  onError={(e) => {
                    // Fallback jika logo tidak ada
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-blue-600 font-bold text-lg">N</span>';
                    }
                  }}
                />
                <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-all duration-300">
                  Nusa
                </span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <button
                onClick={openSearchModal}
                className="w-full flex items-center px-4 py-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
              >
                <span className="text-gray-500 group-hover:text-gray-700">Cari event...</span>
                <kbd className="ml-auto hidden lg:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/about"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/events"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
              >
                Event
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
              >
                Kontak
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {isAuthenticated && user ? (
                <>
                  <Link
                    href={getDashboardUrl(user)}
                    className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                  >
                    Dashboard
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  {/* Super Admin Navigation - Only if not in participant mode */}
                  {!isInParticipantMode && user.role === 'SUPER_ADMIN' && (
                    <>
                      {/* Organizers, Departments, and Analytics hidden */}
                    </>
                  )}

                  {/* Department Head Navigation - Only if not in participant mode */}
                  {!isInParticipantMode && isDepartmentHead(user.role) && (
                    <>
                      <Link
                        href={`/department/${user.department?.toLowerCase()}/dashboard`}
                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                      >
                        {getDepartmentName(user.department || '')} Dashboard
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                      <Link
                        href={`/department/${user.department?.toLowerCase()}/tickets`}
                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                      >
                        Tickets
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                      <Link
                        href={`/department/${user.department?.toLowerCase()}/team`}
                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                      >
                        Team
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                    </>
                  )}

                  {/* Department Agent Navigation - Only if not in participant mode */}
                  {!isInParticipantMode && isDepartmentAgent(user.role) && (
                    <>
                      <Link
                        href={`/department/${user.department?.toLowerCase()}/tickets`}
                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                      >
                        My Tickets
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                      <Link
                        href={`/department/${user.department?.toLowerCase()}/dashboard`}
                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                      >
                        Dashboard
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                    </>
                  )}

                  {/* Organizer Navigation - Only for approved organizers and not in participant mode */}
                  {!isInParticipantMode && user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED' && (
                    <>
                      {/* My Events, Create Event, and Attendance hidden */}
                    </>
                  )}

                  {/* Participant Navigation - Show when in participant mode OR original role is PARTICIPANT */}
                  {(isInParticipantMode || user.role === 'PARTICIPANT' || (user.role === 'ORGANIZER' && user.verificationStatus !== 'APPROVED')) && (
                    <>
                      {!isInParticipantMode && user.role === 'ORGANIZER' && user.verificationStatus === 'PENDING' && (
                        <Link
                          href="/pricing"
                          className="px-4 py-2 text-gray-600 hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 relative group"
                        >
                          Upgrade Status
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                      )}
                    </>
                  )}
                  {/* Notification Bell */}
                  <NotificationBell />
                  <div className="relative ml-4 pl-4 border-l border-gray-200">
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden relative">
                        {user.profilePicture ? (
                          <img
                            src={getImageUrl(user.profilePicture)}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const span = document.createElement('span');
                                span.className = 'text-blue-600 font-semibold text-sm';
                                span.textContent = getUserInitials(user.fullName);
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold text-sm">
                            {getUserInitials(user.fullName)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-left">
                        <div className="text-gray-900 font-semibold">{user.fullName}</div>
                        <div className="text-gray-500 text-xs">
                          {getDisplayRole(user)}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <Link
                          href="/profile"
                          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Profile</span>
                          </div>
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false)
                            handleLogout()
                          }}
                          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Logout</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3 ml-4">
                  <Link href="/login">
                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold rounded-xl transition-all duration-300">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                      Daftar
                    </Button>
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-3 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-blue-100 py-6 bg-blue-50/30">
              {/* Mobile Search */}
              <div className="px-4 mb-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    openSearchModal()
                  }}
                  className="w-full flex items-center px-4 py-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <span>Cari event...</span>
                </button>
              </div>

              <div className="space-y-2">
                <Link
                  href="/about"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/events"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Event
                </Link>
                <Link
                  href="/pricing"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/contact"
                  className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kontak
                </Link>

                {isAuthenticated && user ? (
                  <>
                    <Link
                      href={getDashboardUrl(user)}
                      className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {!isInParticipantMode && user.role === 'SUPER_ADMIN' && (
                      <>
                        <Link
                          href="/admin/organizers"
                          className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Organizers
                        </Link>
                        <Link
                          href="/admin/events/header"
                          className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Events Header
                        </Link>
                        <Link
                          href="/admin/events/carousel"
                          className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Events Carousel
                        </Link>
                      </>
                    )}
                    {!isInParticipantMode && user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED' && (
                      <>
                        {/* My Events, Create Event, and Attendance hidden */}
                      </>
                    )}
                    {(isInParticipantMode || user.role === 'PARTICIPANT' || (user.role === 'ORGANIZER' && user.verificationStatus !== 'APPROVED')) && (
                      <>
                        {!isInParticipantMode && user.role === 'ORGANIZER' && user.verificationStatus === 'PENDING' && (
                          <Link
                            href="/pricing"
                            className="block px-4 py-3 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-300"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Upgrade Status
                          </Link>
                        )}
                      </>
                    )}
                    <div className="px-4 py-4 border-t border-blue-200 bg-white/50 rounded-xl mx-2">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden relative">
                          {user.profilePicture ? (
                            <img
                              src={getImageUrl(user.profilePicture)}
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const span = document.createElement('span');
                                  span.className = 'text-blue-600 font-semibold text-lg';
                                  span.textContent = getUserInitials(user.fullName);
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-blue-600 font-semibold text-lg">
                              {getUserInitials(user.fullName)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {getDisplayRole(user)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-semibold rounded-xl transition-all duration-300"
                          >
                            Profil
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleLogout()
                            setIsMenuOpen(false)
                          }}
                          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold rounded-xl transition-all duration-300"
                        >
                          Logout
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-4 border-t border-blue-200 space-y-3">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold rounded-xl transition-all duration-300">
                        Masuk
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg">
                        Daftar
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
    </>
  )
}
