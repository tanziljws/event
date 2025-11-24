'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, isLoading, router, searchParams]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setHasAttemptedLogin(true); // Mark that user has attempted login
    
    try {
      const success = await login({ email: formData.email, password: formData.password });
      
      if (success) {
        // Login successful, redirect will be handled by useEffect
        console.log('Login successful, redirecting...');
        // Fallback redirect in case useEffect doesn't trigger
        setTimeout(() => {
          const redirectTo = searchParams.get('redirect') || '/';
          router.replace(redirectTo);
        }, 100);
      } else {
        // Login failed - show error message
        setErrorWithTimeout('Email atau password salah. Silakan coba lagi.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error messages
      if (error?.response?.status === 401) {
        setErrorWithTimeout('Email atau password salah. Silakan coba lagi.');
      } else if (error?.response?.status === 403) {
        setErrorWithTimeout('Akun Anda belum diverifikasi. Silakan cek email Anda.');
      } else if (error?.response?.status === 429) {
        setErrorWithTimeout('Terlalu banyak percobaan login. Silakan coba lagi nanti.');
      } else if (error?.message?.includes('Network Error')) {
        setErrorWithTimeout('Koneksi internet bermasalah. Silakan coba lagi.');
      } else {
        setErrorWithTimeout('Terjadi kesalahan saat login. Silakan coba lagi.');
      }
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

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor" />
      
      {/* Animated Background Grid */}
      <div className="bg-grid" />

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '100%', width: '100%' }}>
          <div className="asymmetric-grid" style={{ alignItems: 'center' }}>
            {/* Left Side - Info */}
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
                Welcome Back
              </div>
              
              <h1 className="fade-in-up stagger-1" style={{ marginBottom: '2rem' }}>
              Sign in to your
              <br />
              <span style={{ color: 'var(--color-muted)', fontWeight: '200' }}>account.</span>
            </h1>
              
              <p className="fade-in-up stagger-2" style={{ 
                fontSize: '1.25rem', 
                marginBottom: '3rem', 
                maxWidth: '100%',
                lineHeight: '1.6'
              }}>
                Access your dashboard, manage events, and connect with your 
                community from anywhere.
              </p>

              <div className="fade-in-up stagger-3" style={{ 
                display: 'flex', 
                gap: '2rem', 
                fontSize: '0.875rem', 
                color: 'var(--color-muted)',
                flexWrap: 'wrap'
              }}>
                <span>✓ Secure authentication</span>
                <span>✓ Remember your session</span>
                <span>✓ Quick access</span>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="fade-in-up stagger-4">
              <div style={{ 
                background: 'var(--color-bg)',
                border: '1px solid var(--border-default)',
                padding: '3rem',
                maxWidth: '100%',
                width: '100%'
              }}>
                <h2 style={{ 
                  marginBottom: '2rem',
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  textAlign: 'center'
                }}>
                  Sign In
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
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
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
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
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
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '2rem',
                    fontSize: '0.875rem'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-muted)' }}>
                      <input type="checkbox" style={{ margin: 0 }} />
                      Remember me
                    </label>
                    <Link href="/forgot-password" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary interactive"
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center',
                      opacity: isLoading ? '0.7' : '1'
                    }}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div style={{ 
                  margin: '2rem 0',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{ 
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'var(--border-default)'
                  }} />
                  <span style={{ 
                    background: 'var(--color-bg)',
                    padding: '0 1rem',
                    color: 'var(--color-muted)',
                    fontSize: '0.875rem'
                  }}>
                    Or try demo accounts
                  </span>
                </div>

                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin@nusa.com', 'Admin123!')}
                    disabled={isLoading}
                    className="btn btn-ghost interactive"
                    style={{ 
                      fontSize: '0.875rem', 
                      padding: '0.75rem 1rem',
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Demo Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('user@nusa.com', 'User123!')}
                    disabled={isLoading}
                    className="btn btn-ghost interactive"
                    style={{ 
                      fontSize: '0.875rem', 
                      padding: '0.75rem 1rem',
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Demo User
                  </button>
                </div>

                <div style={{ 
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-muted)',
                marginBottom: '1rem'
              }}>
                <Link href="/forgot-password" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                  Forgot your password?
                </Link>
              </div>

              <div style={{ 
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-muted)'
              }}>
                Don't have an account?{' '}
                <Link href="/register" className="animated-link" style={{ color: 'var(--color-primary)' }}>
                  Sign up
                </Link>
              </div>
              </div>

              {/* Additional Info */}
              <div style={{ 
                background: 'var(--color-surface)', 
                border: '1px solid var(--card-border)',
                padding: '1.5rem',
                marginTop: '1rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.8rem',
                lineHeight: '1.6',
                color: 'var(--color-muted)'
              }}>
                <div style={{ color: 'var(--color-muted)', marginBottom: '0.5rem' }}>// Demo credentials</div>
                <div>
                  <span style={{ color: 'var(--color-primary)' }}>admin</span>: admin@nusa.com<br />
                  <span style={{ color: 'var(--color-primary)' }}>user</span>: user@nusa.com<br />
                  <span style={{ color: 'var(--color-primary)' }}>password</span>: Admin123! / User123!
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
      `}</style>
    </>
  );
}