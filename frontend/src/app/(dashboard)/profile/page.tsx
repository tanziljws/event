'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import {
  User, Mail, Save, ArrowLeft, Shield, CheckCircle, XCircle, Clock,
  AlertCircle, Phone, MapPin, GraduationCap, Calendar, Activity,
  Edit2, Award, Settings, Ticket, Lock, Bell, Eye, EyeOff, RefreshCw, Camera, Upload
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { ApiService } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  lastEducation: z.string().min(2, 'Pendidikan terakhir minimal 2 karakter'),
})

type ProfileForm = z.infer<typeof profileSchema>

function ProfileContent() {
  const { user, updateProfile, switchRole, isLoading, isAuthenticated, isInitialized } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const cursorRef = useRef<HTMLDivElement>(null)

  // Check if user is in temporary mode
  const metadata = user?.metadata && typeof user.metadata === 'object' && user.metadata !== null ? user.metadata as any : null
  const isInParticipantMode = metadata?.temporaryRole === 'PARTICIPANT'
  const isInOrganizerMode = metadata?.temporaryRole === 'ORGANIZER'
  const originalRole = metadata?.originalRole || user?.role

  // Can switch if:
  // 1. Participant with approved organizer request (can switch to organizer)
  // 2. Approved organizer (can switch to participant)
  const canSwitchToOrganizer = user?.role === 'PARTICIPANT' && user?.organizerType && user?.verificationStatus === 'APPROVED'
  const canSwitchToParticipant = user?.role === 'ORGANIZER' && user?.verificationStatus === 'APPROVED'
  const canSwitchRoles = canSwitchToOrganizer || canSwitchToParticipant || isInParticipantMode || isInOrganizerMode

  const handleSwitchRole = async () => {
    if (!canSwitchRoles) return

    setIsSwitchingRole(true)
    try {
      let targetRole: 'ORGANIZER' | 'PARTICIPANT'

      if (isInParticipantMode) {
        targetRole = 'ORGANIZER'
      } else if (isInOrganizerMode) {
        targetRole = 'PARTICIPANT'
      } else if (user?.role === 'PARTICIPANT' && canSwitchToOrganizer) {
        targetRole = 'ORGANIZER'
      } else if (user?.role === 'ORGANIZER' && canSwitchToParticipant) {
        targetRole = 'PARTICIPANT'
      } else {
        return
      }

      await switchRole(targetRole)
    } catch (error) {
      console.error('Error switching role:', error)
    } finally {
      setIsSwitchingRole(false)
    }
  }

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

  // Strict user role protection
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/404')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  if (isLoading || !isInitialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  if (user.role === 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      lastEducation: user?.lastEducation || '',
    },
  })

  React.useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        lastEducation: user.lastEducation || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileForm) => {
    const success = await updateProfile(data)
    if (success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle profile picture upload
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      return
    }

    setIsUploadingPicture(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const uploadResponse = await ApiService.uploadProfilePicture(file)
      if (uploadResponse.success && uploadResponse.data?.url) {
        // Update profile with new picture URL
        const updateResponse = await ApiService.updateProfile({
          profilePicture: uploadResponse.data.url
        })
        if (updateResponse.success) {
          // Refresh user data
          window.location.reload()
        } else {
          alert('Gagal mengupdate foto profil')
        }
      } else {
        alert('Gagal mengupload foto')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('Terjadi kesalahan saat mengupload foto')
    } finally {
      setIsUploadingPicture(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return

    try {
      const updateResponse = await ApiService.updateProfile({
        profilePicture: null
      })
      if (updateResponse.success) {
        window.location.reload()
      } else {
        alert('Gagal menghapus foto profil')
      }
    } catch (error) {
      console.error('Error removing profile picture:', error)
      alert('Terjadi kesalahan saat menghapus foto')
    }
  }

  // Get profile picture URL
  const profilePictureUrl = user?.profilePicture 
    ? getImageUrl(user.profilePicture)
    : null

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />

      {/* Animated Background Grid */}
      <div className="bg-grid" />

      <div style={{ minHeight: '100vh', padding: '2rem', display: 'flex', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="container" style={{ maxWidth: '1200px', width: '100%' }}>
          {/* Header */}
          <div className="fade-in-up" style={{ marginBottom: '3rem' }}>
            <Link href="/dashboard" className="interactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--color-muted)', textDecoration: 'none' }}>
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              <span>Kembali ke Dashboard</span>
            </Link>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--color-primary)',
                marginBottom: '0.5rem',
                fontWeight: '500',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Profil
              </div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '300',
                color: 'var(--color-text)',
                marginBottom: '0.5rem',
                lineHeight: '1.2'
              }}>
                Profil Saya
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--color-muted)',
                lineHeight: '1.6'
              }}>
                Kelola informasi akun dan preferensi Anda
              </p>
            </div>
          </div>

          {/* Main Layout */}
          <div className="fade-in-up stagger-1" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2.5fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Sidebar - Profile Info */}
            <aside>
              <div style={{ position: 'sticky', top: '2rem' }}>
                {/* Profile Card */}
                <div className="fade-in-up stagger-2" style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  transition: 'all 0.3s ease'
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{
                      position: 'relative',
                      width: '5rem',
                      height: '5rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        width: '5rem',
                        height: '5rem',
                        borderRadius: '50%',
                        background: profilePictureUrl ? 'transparent' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {profilePictureUrl ? (
                          <img
                            src={profilePicturePreview || profilePictureUrl}
                            alt={user.fullName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white' }}>
                            {getInitials(user.fullName)}
                          </span>
                        )}
                      </div>
                      {/* Upload Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPicture}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          border: '2px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                          opacity: isUploadingPicture ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                        className="interactive"
                        onMouseEnter={(e) => {
                          if (!isUploadingPicture) {
                            e.currentTarget.style.transform = 'scale(1.1)'
                            e.currentTarget.style.background = '#2563eb'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.background = 'var(--color-primary)'
                        }}
                        title="Ubah Foto Profil"
                      >
                        {isUploadingPicture ? (
                          <div style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            border: '2px solid white',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                        ) : (
                          <Camera style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} />
                        )}
                      </button>
                      {/* Remove Button (if picture exists) */}
                      {profilePictureUrl && !isUploadingPicture && (
                        <button
                          onClick={handleRemoveProfilePicture}
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '1.5rem',
                            height: '1.5rem',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                          }}
                          className="interactive"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)'
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
                          }}
                          title="Hapus Foto Profil"
                        >
                          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>×</span>
                        </button>
                      )}
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '0.5rem',
                      textAlign: 'center'
                    }}>
                      {user.fullName}
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted)',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      {user.email}
                    </p>

                    {/* Role Badge */}
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '9999px',
                        background: (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED') || isInOrganizerMode
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'var(--color-surface)',
                        color: (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED') || isInOrganizerMode
                          ? 'var(--color-primary)'
                          : 'var(--color-muted)'
                      }}>
                        {isInOrganizerMode
                          ? '🎯 Organizer Mode'
                          : isInParticipantMode
                            ? '👤 Peserta Mode'
                            : (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED'
                              ? '🎯 Organizer'
                              : (canSwitchToOrganizer ? '👤 Peserta (Organizer Approved)' : '👤 Peserta'))
                        }
                      </span>
                    </div>

                    {/* Switch Role Button */}
                    {canSwitchRoles && (
                      <div style={{ width: '100%', marginBottom: '1rem' }}>
                        <button
                          onClick={handleSwitchRole}
                          disabled={isSwitchingRole}
                          className="btn btn-primary interactive"
                          style={{
                            width: '100%',
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            opacity: isSwitchingRole ? 0.6 : 1,
                            cursor: isSwitchingRole ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <RefreshCw style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            marginRight: '0.5rem',
                            animation: isSwitchingRole ? 'spin 1s linear infinite' : 'none'
                          }} />
                          {isSwitchingRole
                            ? 'Mengubah...'
                            : isInParticipantMode
                              ? 'Kembali ke Organizer'
                              : isInOrganizerMode
                                ? 'Kembali ke Peserta'
                                : canSwitchToOrganizer
                                  ? 'Beralih ke Organizer'
                                  : 'Beralih ke Peserta'
                          }
                        </button>
                      </div>
                    )}

                    {/* Verification Badge */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '9999px',
                        background: user.emailVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        color: user.emailVerified ? '#10b981' : '#fbbf24'
                      }}>
                        {user.emailVerified ? (
                          <>
                            <CheckCircle style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            Terverifikasi
                          </>
                        ) : (
                          <>
                            <Clock style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            Belum Terverifikasi
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      <span style={{ flex: 1 }}>Bergabung</span>
                      <span style={{ fontWeight: '500', color: 'var(--color-text)' }}>
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {user.lastActivity && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        <Activity style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                        <span style={{ flex: 1 }}>Aktif</span>
                        <span style={{ fontWeight: '500', color: 'var(--color-text)' }}>
                          {new Date(user.lastActivity).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organizer Status Card */}
                {user.role === 'ORGANIZER' && (
                  <div className="fade-in-up stagger-3" style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    transition: 'all 0.3s ease'
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
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '0.75rem'
                      }}>
                        <Shield style={{ width: '1rem', height: '1rem', color: 'var(--color-primary)' }} />
                      </div>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)' }}>
                        Status Organizer
                      </h3>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {user.verificationStatus === 'APPROVED' && (
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.1)',
                            marginBottom: '0.5rem'
                          }}>
                            <CheckCircle style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                          </div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669' }}>Disetujui</p>
                        </div>
                      )}
                      {user.verificationStatus === 'PENDING' && (
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '50%',
                            background: 'rgba(251, 191, 36, 0.1)',
                            marginBottom: '0.5rem'
                          }}>
                            <Clock style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                          </div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d97706' }}>Menunggu</p>
                        </div>
                      )}
                      {user.verificationStatus === 'REJECTED' && (
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            marginBottom: '0.5rem'
                          }}>
                            <XCircle style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                          </div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>Ditolak</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="fade-in-up stagger-4" style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease'
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
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '1rem' }}>
                    Menu Cepat
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href="/my-registrations" style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-text)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                      className="interactive"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text)';
                      }}>
                      <Ticket style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      Registrasi Saya
                    </Link>
                    <Link href="/my-certificates" style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-text)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                      className="interactive"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text)';
                      }}>
                      <Award style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      Sertifikat Saya
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content - Tabs */}
            <main>
              {/* Tabs Navigation */}
              <div className="fade-in-up stagger-5" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--border-default)',
                borderRadius: '0.75rem',
                padding: '0.25rem'
              }}>
                {[
                  { id: 'profile', label: 'Profil', icon: User },
                  { id: 'events', label: 'Event', icon: Ticket },
                  { id: 'certificates', label: 'Sertifikat', icon: Award },
                  { id: 'settings', label: 'Pengaturan', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-muted)',
                        fontSize: '0.875rem',
                        fontWeight: activeTab === tab.id ? '500' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      className="interactive"
                    >
                      <Icon style={{ width: '1rem', height: '1rem' }} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="fade-in-up stagger-6" style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  transition: 'all 0.3s ease'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                        marginBottom: '0.5rem'
                      }}>
                        Informasi Profil
                      </h2>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-muted)'
                      }}>
                        Perbarui informasi pribadi Anda
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary interactive"
                      >
                        <Edit2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                        Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <User style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                          Nama Lengkap
                        </label>
                        <Input
                          {...register('fullName')}
                          placeholder="John Doe"
                          error={errors.fullName?.message}
                          disabled={!isEditing}
                          required
                          style={{
                            background: !isEditing ? 'var(--color-surface)' : 'var(--color-bg)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text)',
                            width: '100%'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Mail style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                          Email
                        </label>
                        <Input
                          value={user.email}
                          disabled
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-muted)',
                            width: '100%',
                            cursor: 'not-allowed'
                          }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Email tidak dapat diubah</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Phone style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                          Nomor Telepon
                        </label>
                        <Input
                          {...register('phoneNumber')}
                          type="tel"
                          placeholder="081234567890"
                          error={errors.phoneNumber?.message}
                          disabled={!isEditing}
                          required
                          style={{
                            background: !isEditing ? 'var(--color-surface)' : 'var(--color-bg)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text)',
                            width: '100%'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <GraduationCap style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                          Pendidikan Terakhir
                        </label>
                        <Input
                          {...register('lastEducation')}
                          placeholder="S1 Teknik Informatika"
                          error={errors.lastEducation?.message}
                          disabled={!isEditing}
                          required
                          style={{
                            background: !isEditing ? 'var(--color-surface)' : 'var(--color-bg)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text)',
                            width: '100%'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <MapPin style={{ width: '1rem', height: '1rem', color: 'var(--color-muted)' }} />
                        Alamat Lengkap
                      </label>
                      <Input
                        {...register('address')}
                        placeholder="Jl. Contoh No. 123, Jakarta"
                        error={errors.address?.message}
                        disabled={!isEditing}
                        required
                        style={{
                          background: !isEditing ? 'var(--color-surface)' : 'var(--color-bg)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          fontSize: '0.875rem',
                          color: 'var(--color-text)',
                          width: '100%'
                        }}
                      />
                    </div>

                    {isEditing && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-default)'
                      }}>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={isLoading}
                          style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          className="interactive"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={!isDirty || isLoading}
                          className="btn btn-primary interactive"
                          style={{
                            opacity: (!isDirty || isLoading) ? 0.6 : 1,
                            cursor: (!isDirty || isLoading) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                          {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="fade-in-up stagger-6" style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '3rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <Ticket style={{ width: '4rem', height: '4rem', color: 'var(--color-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
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
                    marginBottom: '1.5rem'
                  }}>
                    Belum ada event yang diikuti
                  </p>
                  <Link href="/events">
                    <button className="btn btn-primary interactive">
                      Jelajahi Event
                    </button>
                  </Link>
                </div>
              )}

              {/* Certificates Tab */}
              {activeTab === 'certificates' && (
                <div className="fade-in-up stagger-6" style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '1rem',
                  padding: '3rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                  className="interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}>
                  <Award style={{ width: '4rem', height: '4rem', color: 'var(--color-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem'
                  }}>
                    Belum Ada Sertifikat
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Belum ada sertifikat
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                    marginBottom: '1.5rem'
                  }}>
                    Ikuti event untuk mendapatkan sertifikat
                  </p>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="fade-in-up stagger-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Security Settings */}
                  <div style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    transition: 'all 0.3s ease'
                  }}
                    className="interactive"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem'
                      }}>
                        <Lock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
                      </div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--color-text)'
                      }}>
                        Keamanan
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--color-surface)',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                        className="interactive"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--color-surface)';
                        }}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--color-text)',
                            marginBottom: '0.25rem'
                          }}>
                            Ubah Password
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-muted)'
                          }}>
                            Perbarui password akun Anda
                          </p>
                        </div>
                        <button style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid var(--border-default)',
                          borderRadius: '0.5rem',
                          background: 'transparent',
                          color: 'var(--color-text)',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                          className="interactive"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.color = 'var(--color-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                            e.currentTarget.style.color = 'var(--color-text)';
                          }}>
                          Ubah
                        </button>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--color-surface)',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                        className="interactive"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--color-surface)';
                        }}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--color-text)',
                            marginBottom: '0.25rem'
                          }}>
                            Verifikasi Email
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-muted)'
                          }}>
                            {user.emailVerified ? 'Email sudah terverifikasi' : 'Verifikasi email Anda'}
                          </p>
                        </div>
                        {user.emailVerified ? (
                          <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                        ) : (
                          <button style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--border-default)',
                            borderRadius: '0.5rem',
                            background: 'transparent',
                            color: 'var(--color-text)',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                            className="interactive"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'var(--border-default)';
                              e.currentTarget.style.color = 'var(--color-text)';
                            }}>
                            Verifikasi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    transition: 'all 0.3s ease'
                  }}
                    className="interactive"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem'
                      }}>
                        <Bell style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
                      </div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--color-text)'
                      }}>
                        Notifikasi
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--color-surface)',
                        borderRadius: '0.5rem'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--color-text)',
                            marginBottom: '0.25rem'
                          }}>
                            Email Notifikasi
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-muted)'
                          }}>
                            Terima notifikasi via email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            accentColor: 'var(--color-primary)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--color-surface)',
                        borderRadius: '0.5rem'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--color-text)',
                            marginBottom: '0.25rem'
                          }}>
                            Event Reminder
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-muted)'
                          }}>
                            Pengingat event yang akan datang
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            accentColor: 'var(--color-primary)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    transition: 'all 0.3s ease'
                  }}
                    className="interactive"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem'
                      }}>
                        <Eye style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
                      </div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--color-text)'
                      }}>
                        Privasi
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)'
                    }}>
                      <p style={{ display: 'flex', alignItems: 'start' }}>
                        <span style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }}>•</span>
                        Email tidak dapat diubah setelah registrasi
                      </p>
                      <p style={{ display: 'flex', alignItems: 'start' }}>
                        <span style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }}>•</span>
                        Semua perubahan profil akan tercatat dalam sistem
                      </p>
                      <p style={{ display: 'flex', alignItems: 'start' }}>
                        <span style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }}>•</span>
                        Data Anda dilindungi sesuai kebijakan privasi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </main>
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

        @media (max-width: 1024px) {
          .container > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
