'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterPage() {
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    lastEducation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedRegister, setHasAttemptedRegister] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Progress tracking
  const [formProgress, setFormProgress] = useState(0);
  const totalFields = 7; // Basic fields only for participants

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<NodeJS.Timeout | null>(null);

  // Carousel testimonials for participants
  const testimonials = [
    {
      text: "Bergabunglah dengan ribuan peserta yang telah menikmati berbagai event menarik di platform kami",
      author: "Active Event Participant"
    },
    {
      text: "Temukan event yang sesuai dengan minat Anda dan daftar dengan mudah dalam hitungan menit",
      author: "Event Enthusiast"
    },
    {
      text: "Dari seminar, workshop, hingga konser - semua event ada di satu tempat",
      author: "Community Member"
    },
    {
      text: "Dapatkan sertifikat digital untuk setiap event yang Anda ikuti",
      author: "Professional Learner"
    },
    {
      text: "Bergabunglah sekarang dan jangan lewatkan event-event menarik di sekitar Anda",
      author: "Event Explorer"
    }
  ];

  // Calculate form progress
  useEffect(() => {
    let filledFields = 0;

    if (formData.fullName.trim()) filledFields++;
    if (formData.email.trim()) filledFields++;
    if (formData.phoneNumber.trim()) filledFields++;
    if (formData.address.trim()) filledFields++;
    if (formData.lastEducation.trim()) filledFields++;
    if (formData.password.trim()) filledFields++;
    if (formData.confirmPassword.trim()) filledFields++;

    const progress = (filledFields / totalFields) * 100;
    setFormProgress(progress);
  }, [formData]);

  // Auto-rotate carousel
  useEffect(() => {
    carouselRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => {
      if (carouselRef.current) {
        clearInterval(carouselRef.current);
      }
    };
  }, [testimonials.length]);

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

  // Redirect if already authenticated (only on initial load, not after failed register)
  useEffect(() => {
    console.log('Register page useEffect:', { isAuthenticated, user: user?.email, isLoading, hasAttemptedRegister });
    if (isAuthenticated && user && !isLoading && !hasAttemptedRegister) {
      const redirectTo = searchParams.get('redirect') || '/';
      console.log('Redirecting authenticated user to:', redirectTo);
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, isLoading, hasAttemptedRegister, router, searchParams]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const setErrorWithTimeout = (message: string) => {
    setError(message);

    // Clear previous timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    // Set new timeout to clear error after 8 seconds (longer duration)
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 8000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHasAttemptedRegister(true);
    console.log('Form submitted, hasAttemptedRegister set to true');

    if (formData.password !== formData.confirmPassword) {
      setErrorWithTimeout('Password dan konfirmasi password tidak sama.');
      return;
    }

    try {
      // Register as participant
      const success = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        lastEducation: formData.lastEducation
      });

      if (success) {
        // Registration successful, redirect to verify email
        console.log('Registration successful, redirecting to verify email...');
        // Add small delay to ensure state is stable
        setTimeout(() => {
          console.log('About to redirect, current state:', {
            isAuthenticated,
            user: user?.email,
            isLoading,
            hasAttemptedRegister
          });
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 100);
      } else {
        // Registration failed - show error message
        console.log('Registration failed');
        setErrorWithTimeout('Registrasi gagal. Email mungkin sudah digunakan.');
      }
    } catch (error: any) {
      console.error('Register error:', error);

      // Handle specific error messages
      if (error?.response?.status === 409) {
        setErrorWithTimeout('Email sudah digunakan. Silakan gunakan email lain.');
      } else if (error?.response?.status === 400) {
        setErrorWithTimeout('Data yang dimasukkan tidak valid. Silakan periksa kembali.');
      } else if (error?.message?.includes('Network Error')) {
        setErrorWithTimeout('Koneksi internet bermasalah. Silakan coba lagi.');
      } else {
        setErrorWithTimeout('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
      }
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Sangat Lemah';
      case 2: return 'Lemah';
      case 3: return 'Cukup';
      case 4: return 'Kuat';
      case 5: return 'Sangat Kuat';
      default: return '';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#dc2626';
      case 2: return '#f59e0b';
      case 3: return '#f59e0b';
      case 4: return '#10b981';
      case 5: return '#10b981';
      default: return '#d1d5db';
    }
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />

      {/* Animated Background Grid */}
      <div className="bg-grid" />

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="asymmetric-grid" style={{ alignItems: 'center' }}>
            {/* Left Side - Interactive Progress */}
            <div>
              <Link href="/" className="interactive" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <img
                  src="/logo-nusa.png"
                  alt="Nusa Logo"
                  style={{ 
                    height: '128px', 
                    width: 'auto', 
                    maxWidth: '100%', 
                    objectFit: 'contain',
                    maxHeight: '128px'
                  }}
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
                className="fade-in-up"
              >
                Register Now!
              </div>

              {/* Testimonials Carousel */}
              <div className="fade-in-up stagger-2" style={{ marginBottom: '2rem' }}>
                <div style={{
                  position: 'relative',
                  height: '120px',
                  overflow: 'hidden',
                  borderRadius: '0.75rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  padding: '1.5rem'
                }}>
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '1.5rem',
                        opacity: index === currentSlide ? 1 : 0,
                        transform: `translateX(${index === currentSlide ? 0 : index < currentSlide ? '-100%' : '100%'})`,
                        transition: 'all 0.8s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <p style={{
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        marginBottom: '0.75rem',
                        fontStyle: 'italic'
                      }}>
                        "{testimonial.text}"
                      </p>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-primary)',
                        fontWeight: '500'
                      }}>
                        — {testimonial.author}
                      </div>
                    </div>
                  ))}

                  {/* Carousel dots */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    {testimonials.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: index === currentSlide ? 'var(--color-primary)' : 'var(--border-default)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="fade-in-up stagger-3" style={{ marginBottom: '2.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  transition: 'all 0.3s ease',
                  opacity: formData.fullName.trim() ? '1' : '0.6',
                  background: formData.fullName.trim() ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: formData.fullName.trim() ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transform: formData.fullName.trim() ? 'translateX(4px)' : 'translateX(0)'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: formData.fullName.trim() ? 'var(--color-primary)' : 'var(--border-default)',
                    color: formData.fullName.trim() ? 'white' : 'var(--color-muted)',
                    boxShadow: formData.fullName.trim() ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: formData.fullName.trim() ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {formData.fullName.trim() ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'bounceIn 0.6s ease-out' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>1</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: formData.fullName.trim() ? 'var(--color-primary)' : 'var(--color-muted)',
                      transition: 'all 0.3s ease',
                      display: 'block'
                    }}>
                      Informasi Dasar
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      transition: 'all 0.3s ease'
                    }}>
                      Nama lengkap Anda
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  transition: 'all 0.3s ease',
                  opacity: (formData.email.trim() && formData.phoneNumber.trim()) ? '1' : '0.6',
                  background: (formData.email.trim() && formData.phoneNumber.trim()) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: (formData.email.trim() && formData.phoneNumber.trim()) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transform: (formData.email.trim() && formData.phoneNumber.trim()) ? 'translateX(4px)' : 'translateX(0)'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: (formData.email.trim() && formData.phoneNumber.trim()) ? 'var(--color-primary)' : 'var(--border-default)',
                    color: (formData.email.trim() && formData.phoneNumber.trim()) ? 'white' : 'var(--color-muted)',
                    boxShadow: (formData.email.trim() && formData.phoneNumber.trim()) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: (formData.email.trim() && formData.phoneNumber.trim()) ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {(formData.email.trim() && formData.phoneNumber.trim()) ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'bounceIn 0.6s ease-out' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>2</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: (formData.email.trim() && formData.phoneNumber.trim()) ? 'var(--color-primary)' : 'var(--color-muted)',
                      transition: 'all 0.3s ease',
                      display: 'block'
                    }}>
                      Kontak & Alamat
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      transition: 'all 0.3s ease'
                    }}>
                      Email dan nomor telepon
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  transition: 'all 0.3s ease',
                  opacity: (formData.address.trim() && formData.lastEducation.trim()) ? '1' : '0.6',
                  background: (formData.address.trim() && formData.lastEducation.trim()) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: (formData.address.trim() && formData.lastEducation.trim()) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transform: (formData.address.trim() && formData.lastEducation.trim()) ? 'translateX(4px)' : 'translateX(0)'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: (formData.address.trim() && formData.lastEducation.trim()) ? 'var(--color-primary)' : 'var(--border-default)',
                    color: (formData.address.trim() && formData.lastEducation.trim()) ? 'white' : 'var(--color-muted)',
                    boxShadow: (formData.address.trim() && formData.lastEducation.trim()) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: (formData.address.trim() && formData.lastEducation.trim()) ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {(formData.address.trim() && formData.lastEducation.trim()) ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'bounceIn 0.6s ease-out' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>3</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: (formData.address.trim() && formData.lastEducation.trim()) ? 'var(--color-primary)' : 'var(--color-muted)',
                      transition: 'all 0.3s ease',
                      display: 'block'
                    }}>
                      Profil Lengkap
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      transition: 'all 0.3s ease'
                    }}>
                      Alamat dan pendidikan
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  transition: 'all 0.3s ease',
                  opacity: (formData.password.trim() && formData.confirmPassword.trim()) ? '1' : '0.6',
                  background: (formData.password.trim() && formData.confirmPassword.trim()) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: (formData.password.trim() && formData.confirmPassword.trim()) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transform: (formData.password.trim() && formData.confirmPassword.trim()) ? 'translateX(4px)' : 'translateX(0)'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: (formData.password.trim() && formData.confirmPassword.trim()) ? 'var(--color-primary)' : 'var(--border-default)',
                    color: (formData.password.trim() && formData.confirmPassword.trim()) ? 'white' : 'var(--color-muted)',
                    boxShadow: (formData.password.trim() && formData.confirmPassword.trim()) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: (formData.password.trim() && formData.confirmPassword.trim()) ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {(formData.password.trim() && formData.confirmPassword.trim()) ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'bounceIn 0.6s ease-out' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>4</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: (formData.password.trim() && formData.confirmPassword.trim()) ? 'var(--color-primary)' : 'var(--color-muted)',
                      transition: 'all 0.3s ease',
                      display: 'block'
                    }}>
                      Keamanan Akun
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      transition: 'all 0.3s ease'
                    }}>
                      Password dan konfirmasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Message */}
              {formProgress === 100 && (
                <div className="fade-in-up stagger-4" style={{
                  background: '#f0fdf4',
                  border: '2px solid #10b981',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  animation: 'fadeInScale 0.6s ease-out',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: '#10b981',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                      animation: 'bounceIn 0.8s ease-out'
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#059669',
                        display: 'block',
                        marginBottom: '0.25rem'
                      }}>
                        🎉 Form siap untuk disubmit!
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#047857',
                        opacity: 0.8
                      }}>
                        Semua field telah diisi dengan benar
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Register Form */}
            <div className="fade-in-up stagger-4">
              <div style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--border-default)',
                padding: '3rem',
                maxWidth: '500px'
              }}>
                <h2 style={{
                  marginBottom: '2rem',
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  textAlign: 'center'
                }}>
                  Buat Akun
                </h2>

                {error && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '1rem 1.25rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    animation: 'slideInDown 0.3s ease-out',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Nama Lengkap</label>
                  </div>

                  <div className="form-field">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Email Address</label>
                  </div>

                  <div className="form-field">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Nomor Telepon</label>
                  </div>

                  <div className="form-field">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Alamat</label>
                  </div>

                  <div className="form-field">
                    <input
                      type="text"
                      name="lastEducation"
                      value={formData.lastEducation}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Pendidikan Terakhir</label>
                  </div>

                  <div className="form-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-muted)',
                        fontSize: '0.875rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{
                          height: '4px',
                          background: 'var(--card-border)',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(passwordStrength / 5) * 100}%`,
                            background: getPasswordStrengthColor(),
                            transition: 'all 0.3s ease'
                          }} />
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: getPasswordStrengthColor()
                        }}>
                          {getPasswordStrengthText()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Konfirmasi Password</label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-muted)',
                        fontSize: '0.875rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>

                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: formData.password === formData.confirmPassword ? '#10b981' : '#dc2626'
                      }}>
                        {formData.password === formData.confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                      </div>
                    )}
                  </div>

                  <div style={{
                    marginBottom: '2rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-muted)',
                    lineHeight: '1.5'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <input type="checkbox" required style={{ marginTop: '0.25rem' }} disabled={isLoading} />
                      <span>
                        Saya setuju dengan{' '}
                        <Link href="/terms" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                          Syarat Layanan
                        </Link>
                        {' '}dan{' '}
                        <Link href="/privacy" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                          Kebijakan Privasi
                        </Link>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || formData.password !== formData.confirmPassword}
                    className="btn btn-primary interactive"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      opacity: (isLoading || formData.password !== formData.confirmPassword) ? '0.7' : '1'
                    }}
                  >
                    {isLoading ? 'Membuat Akun...' : 'Buat Akun'}
                  </button>
                </form>

                <div style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--color-muted)',
                  marginTop: '2rem'
                }}>
                  Sudah punya akun?{' '}
                  <Link href="/login" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                    Masuk
                  </Link>
                  {' '}atau{' '}
                  <Link href="/register-organizer" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                    Daftar sebagai Organizer
                  </Link>
                </div>
              </div>

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

        .asymmetric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        @media (max-width: 768px) {
          .asymmetric-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
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

        .form-field {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .form-input {
          width: 100%;
          padding: 1rem 0;
          border: none;
          border-bottom: 1px solid var(--border-default);
          background: transparent;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .form-input:focus {
          border-bottom-color: var(--color-primary);
        }

        .form-input:focus + .form-label,
        .form-input:not(:placeholder-shown) + .form-label {
          transform: translateY(-1.5rem) scale(0.8);
          color: var(--color-primary);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-label {
          position: absolute;
          top: 1rem;
          left: 0;
          color: var(--color-muted);
          transition: all 0.3s ease;
          pointer-events: none;
        }

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

        .btn-ghost {
          background: transparent;
          color: var(--color-text);
          border: 1px solid var(--border-default);
        }

        .btn-ghost:hover {
          background: var(--color-surface);
          border-color: var(--color-primary);
        }

        .animated-link {
          text-decoration: none;
          position: relative;
          transition: color 0.3s ease;
        }

        .animated-link:hover {
          color: var(--color-primary);
        }

        .animated-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .animated-link:hover::after {
          width: 100%;
        }

        .interactive {
          transition: all 0.3s ease;
        }

        .interactive:hover {
          transform: translateY(-1px);
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}