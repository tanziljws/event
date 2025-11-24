'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading'
import { Calendar, User, LogOut, Settings, Ticket, Award, Shield, ArrowRight, TrendingUp, Users, Clock, Home } from 'lucide-react'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ApiService } from '@/lib/api'
import { Event } from '@/types'

function DashboardContent() {
  const { user, logout, isAuthenticated, isInitialized, isLoading } = useAuth()
  const router = useRouter()
  const [latestEvent, setLatestEvent] = useState<Event | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [userStats, setUserStats] = useState({
    totalRegistrations: 0,
    totalCertificates: 0,
    attendedEvents: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const cursorRef = useRef<HTMLDivElement>(null)

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.classList.contains('interactive'))) {
        cursor.classList.add('hover');
      }
      if (target && (target.tagName === 'P' || target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || target.tagName === 'INPUT')) {
        cursor.classList.add('text');
      }
    };

    const handleMouseLeave = () => {
      cursor.classList.remove('hover', 'text');
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Load user stats
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await ApiService.getUserDashboardStats()
        if (response.success) {
          setUserStats(response.data)
        }
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadUserStats()
  }, [])

  // Fetch latest event
  useEffect(() => {
    const fetchLatestEvent = async () => {
      try {
        setIsLoadingEvent(true)
        const response = await ApiService.getPublicEvents()
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Sort by createdAt descending and take the first one
          const sortedEvents = response.data.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setLatestEvent(sortedEvents[0])
        }
      } catch (error) {
        console.error('Error fetching latest event:', error)
      } finally {
        setIsLoadingEvent(false)
      }
    }

    fetchLatestEvent()
  }, [])

  // Strict user role protection - admin should not access user dashboard
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        // Admin trying to access user dashboard, redirect to 404 for security
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Show loading while checking authentication and role
  if (isLoading || !isInitialized) {
    return (
      <>
        <div ref={cursorRef} className="custom-cursor" />
        <div className="bg-grid" />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid transparent',
            borderTop: '2px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </>
    )
  }

  // If not authenticated after loading, redirect to login
  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  // If admin, show loading while redirecting to 404
  if (user.role === 'ADMIN') {
    return (
      <>
        <div ref={cursorRef} className="custom-cursor" />
        <div className="bg-grid" />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid transparent',
            borderTop: '2px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />

      {/* Animated Background Grid */}
      <div className="bg-grid" />

      <div style={{ minHeight: '100vh', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '1200px', width: '100%' }}>
          {/* Header */}
          <div className="fade-in-up" style={{ marginBottom: '4rem' }}>
            <Link href="/" className="interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
              <img
                src="/logo-nusa.png"
                alt="Nusa Logo"
                className="h-32 w-auto max-w-full object-contain"
                style={{ maxHeight: '128px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span style="font-size: 1.5rem; font-weight: 500; color: var(--color-primary)">N</span>';
                  }
                }}
              />
              <span style={{ fontSize: '1.5rem', fontWeight: '400', color: 'var(--color-text)' }}>Nusa</span>
            </Link>

            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-primary)',
                marginBottom: '2rem',
                fontWeight: '500',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Dashboard
            </div>
          </div>

          {/* Split Layout: Left Side (Text + Stats) | Right Side (Event Terbaru) */}
          <div className="fade-in-up stagger-1" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'start',
            marginBottom: '4rem'
          }}>
            {/* Left Side - Text and Stats */}
            <div>
              <h1 className="fade-in-up stagger-2" style={{ marginBottom: '2rem' }}>
                Selamat Datang,
                <br />
                <span style={{ color: 'var(--color-muted)', fontWeight: '200' }}>{user?.fullName}</span>
              </h1>

              <p className="fade-in-up stagger-3" style={{
                fontSize: '1.25rem',
                marginBottom: '3rem',
                lineHeight: '1.6',
                color: 'var(--color-muted)'
              }}>
                Kelola event, pendaftaran, dan sertifikat Anda dari satu tempat yang mudah diakses.
              </p>

              {/* Stats Cards */}
              <div className="fade-in-up stagger-4" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                        Event Terdaftar
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                        {isLoadingStats ? '...' : userStats.totalRegistrations}
                      </p>
                    </div>
                    <Calendar style={{ width: '2rem', height: '2rem', color: 'var(--color-primary)' }} />
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                        Sertifikat
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: '600', color: '#10b981' }}>
                        {isLoadingStats ? '...' : userStats.totalCertificates}
                      </p>
                    </div>
                    <Award style={{ width: '2rem', height: '2rem', color: '#10b981' }} />
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                        Event Dihadiri
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: '600', color: '#8b5cf6' }}>
                        {isLoadingStats ? '...' : userStats.attendedEvents}
                      </p>
                    </div>
                    <Users style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Event Terbaru */}
            <div className="fade-in-up stagger-5">
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '300',
                marginBottom: '2rem',
                color: 'var(--color-text)'
              }}>
                Event Terbaru
              </h2>

              {isLoadingEvent ? (
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '2rem'
                }}>
                  <div style={{
                    height: '200px',
                    background: 'var(--color-surface)',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    animation: 'pulse 2s infinite'
                  }} />
                  <div style={{
                    height: '1.5rem',
                    background: 'var(--color-surface)',
                    borderRadius: '0.25rem',
                    marginBottom: '1rem',
                    animation: 'pulse 2s infinite'
                  }} />
                  <div style={{
                    height: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '0.25rem',
                    marginBottom: '1.5rem',
                    animation: 'pulse 2s infinite'
                  }} />
                  <div style={{
                    height: '3rem',
                    background: 'var(--color-surface)',
                    borderRadius: '0.5rem',
                    animation: 'pulse 2s infinite'
                  }} />
                </div>
              ) : latestEvent ? (
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.5rem'
                    }}>
                      {latestEvent.title}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.5'
                    }}>
                      {latestEvent.description}
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        {new Date(latestEvent.eventDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Clock style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        {latestEvent.eventTime} WIB
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Users style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        {latestEvent.maxParticipants} Peserta
                      </span>
                    </div>
                  </div>

                  <Link href={`/events/${latestEvent.id}`}>
                    <button className="btn btn-primary interactive" style={{ width: '100%', justifyContent: 'center' }}>
                      <span>Lihat Detail Event</span>
                      <ArrowRight style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} />
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <Calendar style={{ width: '3rem', height: '3rem', color: 'var(--color-muted)', margin: '0 auto 1rem' }} />
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem'
                  }}>
                    Belum Ada Event
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-muted)',
                    marginBottom: '1.5rem',
                    lineHeight: '1.5'
                  }}>
                    Saat ini belum ada event yang tersedia. Silakan cek kembali nanti.
                  </p>
                  <Link href="/events">
                    <button className="btn btn-primary interactive" style={{ width: '100%', justifyContent: 'center' }}>
                      <span>Lihat Semua Event</span>
                      <ArrowRight style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} />
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>


          {/* Quick Actions */}
          <div className="fade-in-up stagger-6" style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '300',
              marginBottom: '1rem',
              color: 'var(--color-text)'
            }}>
              Akses Cepat
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--color-muted)',
              marginBottom: '2rem'
            }}>
              Kelola semua aktivitas event Anda dengan mudah
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              justifyContent: 'center'
            }}>
              <Link href="/events" className="interactive">
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: 'var(--color-primary)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.25rem'
                    }}>
                      Jelajahi Event
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.4'
                    }}>
                      Temukan dan daftar event menarik yang sesuai dengan minat Anda
                    </p>
                  </div>
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                </div>
              </Link>

              <Link href="/my-registrations" className="interactive">
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#10b981',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ticket style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.25rem'
                    }}>
                      Pendaftaran Saya
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.4'
                    }}>
                      Kelola dan pantau status pendaftaran event Anda
                    </p>
                  </div>
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                </div>
              </Link>

              <Link href="/my-certificates" className="interactive">
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#8b5cf6',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Award style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.25rem'
                    }}>
                      Sertifikat Saya
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.4'
                    }}>
                      Download dan kelola sertifikat event yang telah Anda ikuti
                    </p>
                  </div>
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                </div>
              </Link>

              <Link href="/profile" className="interactive">
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#f59e0b',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Settings style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.25rem'
                    }}>
                      Profil Saya
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.4'
                    }}>
                      Kelola informasi profil dan preferensi akun Anda
                    </p>
                  </div>
                  <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                </div>
              </Link>
            </div>
          </div>

          {/* User Info & Activity */}
          <div className="fade-in-up stagger-7" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            justifyContent: 'center'
          }}>
            {/* Profile Info */}
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--border-default)',
              borderRadius: '1rem',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'var(--color-primary)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <User style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.25rem'
                  }}>
                    Informasi Profil
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                    Ringkasan akun Anda
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'var(--color-surface)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--color-text)'
                    }}>
                      {user?.fullName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p style={{
                      fontWeight: '500',
                      color: 'var(--color-text)',
                      marginBottom: '0.25rem'
                    }}>
                      {user?.fullName}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Role</span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontWeight: '500'
                  }}>
                    Peserta
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Status Email</span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    fontWeight: '500',
                    background: user?.emailVerified ? '#10b981' : '#f59e0b',
                    color: 'white'
                  }}>
                    {user?.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Bergabung</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: '500' }}>
                    {new Date().toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>

              <Link href="/profile">
                <button className="btn btn-primary interactive" style={{ width: '100%', justifyContent: 'center' }}>
                  Kelola Profil
                </button>
              </Link>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--border-default)',
              borderRadius: '1rem',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: '#10b981',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <Clock style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.25rem'
                  }}>
                    Aktivitas Terbaru
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                    Riwayat aktivitas Anda
                  </p>
                </div>
              </div>

              <RecentActivity userId={user?.id || ''} />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --color-bg: #ffffff;
          --color-surface: #f8f9fa;
          --color-text: #1a1a1a;
          --color-muted: #6b7280;
          --color-primary: #3b82f6;
          --border-default: #e5e7eb;
          --card-border: #d1d5db;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: var(--color-bg);
          color: var(--color-text);
          line-height: 1.6;
        }

        .custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background: var(--color-primary);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.1s ease;
          opacity: 0.8;
        }

        .custom-cursor.hover {
          transform: scale(1.5);
        }

        .custom-cursor.text {
          transform: scale(0.5);
        }

        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .stagger-5 { transition-delay: 0.5s; }
        .stagger-6 { transition-delay: 0.6s; }
        .stagger-7 { transition-delay: 0.7s; }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .interactive {
          transition: all 0.3s ease;
        }

        .interactive:hover {
          transform: translateY(-1px);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
