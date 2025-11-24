'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/toast'
import { ApiService } from '@/lib/api'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/layout/footer'

const contactSchema = z.object({
  name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s\u00C0-\u017F]+$/, 'Nama hanya boleh mengandung huruf dan spasi'),
  email: z.string()
    .email('Format email tidak valid')
    .min(1, 'Email harus diisi'),
  subject: z.string()
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  message: z.string()
    .min(10, 'Pesan minimal 10 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\+]?[0-9\s\-\(\)]{8,20}$/.test(val), 'Format nomor telepon tidak valid'),
  category: z.enum(['TECHNICAL_ISSUE', 'PAYMENT_ISSUE', 'GENERAL_INQUIRY', 'EVENT_MANAGEMENT', 'MARKETING_INQUIRY'], {
    required_error: 'Kategori harus dipilih'
  })
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { addToast } = useToast()
  const cursorRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema)
  })

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

  const onSubmit = async (data: ContactForm) => {
    try {
      setIsLoading(true)
      
      // Create ticket data for CS
      const ticketData = {
        title: data.subject,
        description: `From: ${data.name} (${data.email})${data.phone ? `\nPhone: ${data.phone}` : ''}\n\nMessage:\n${data.message}`,
        priority: 'MEDIUM', // Default priority
        category: data.category,
        createdBy: 'contact-form-user-id-12345', // Use system user ID
        source: 'CONTACT_FORM'
      }
      
      // Create ticket via API
      console.log('Creating ticket from contact form:', ticketData)
      await ApiService.createTicketFromContact(ticketData)
      
      setIsSubmitted(true)
      reset()
      addToast({
        type: 'success',
        title: 'Pesan Terkirim!',
        message: 'Terima kasih! Tim Customer Service akan segera merespons pesan Anda.',
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gagal Mengirim Pesan',
        message: error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        {/* Custom Cursor */}
        <div ref={cursorRef} className="custom-cursor" />
        
        {/* Animated Background Grid */}
        <div className="bg-grid" />

        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="fade-in-up">
              <Link href="/" className="interactive" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  background: 'var(--color-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: 'var(--color-bg)'
                }}>
                  E
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '400', color: 'var(--color-text)' }}>Nusa</span>
              </Link>

              <div style={{ 
                background: 'var(--color-bg)',
                border: '1px solid var(--border-default)',
                padding: '3rem',
                textAlign: 'center',
                borderRadius: '1rem'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 2rem',
                  animation: 'bounceIn 0.8s ease-out'
                }}>
                  <CheckCircle style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                
                <h2 style={{ 
                  fontSize: '2rem',
                  fontWeight: '300',
                  color: 'var(--color-text)',
                  marginBottom: '1rem'
                }}>
                  Pesan Terkirim!
                </h2>
                
                <p style={{ 
                  fontSize: '1.125rem',
                  color: 'var(--color-muted)',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Terima kasih telah menghubungi kami. Pesan Anda telah berhasil dikirim dan akan segera kami proses.
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="btn btn-primary interactive"
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Kirim Pesan Lain
                  </button>
                  <Link href="/" className="btn btn-ghost interactive" style={{ padding: '0.75rem 2rem' }}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Kembali ke Beranda
                  </Link>
                </div>
              </div>
            </div>
          </div>
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

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="asymmetric-grid" style={{ alignItems: 'center' }}>
            {/* Left Side - Contact Information */}
            <div>
              <Link href="/" className="interactive" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'white',
                  borderRadius: '0.5rem',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'visible',
                  border: '1px solid var(--border-default)'
                }}>
                  <img 
                    src="/logo-nusa.png" 
                    alt="Nusa Logo" 
                    style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain', maxHeight: '48px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<span style="font-size: 0.75rem; font-weight: 500; color: var(--color-primary)">N</span>';
                      }
                    }}
                  />
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '400', color: 'var(--color-text)' }}>Nusa</span>
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
                Contact Us
              </div>
              
              <h1 className="fade-in-up stagger-1" style={{ marginBottom: '2rem' }}>
                Hubungi Kami
                <br />
                <span style={{ color: 'var(--color-muted)', fontWeight: '200' }}>untuk Bantuan</span>
              </h1>
              
              <p className="fade-in-up stagger-2" style={{ 
                fontSize: '1.25rem', 
                marginBottom: '3rem', 
                maxWidth: '500px',
                lineHeight: '1.6',
                color: 'var(--color-muted)'
              }}>
                Ada pertanyaan atau butuh bantuan? Kami siap membantu Anda dengan sepenuh hati.
              </p>

              {/* Contact Information Cards */}
              <div className="fade-in-up stagger-3" style={{ marginBottom: '2rem' }}>
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                className="interactive"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '2.5rem', 
                      height: '2.5rem', 
                      background: 'var(--color-primary)', 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Mail style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        Email Support
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        support@eventmanagement.com
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        Respons dalam 1-2 hari kerja
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                className="interactive"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '2.5rem', 
                      height: '2.5rem', 
                      background: 'var(--color-primary)', 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Phone style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        Telepon
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        +62 812-3456-7890
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        Senin - Jumat, 09:00 - 17:00
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                className="interactive"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '2.5rem', 
                      height: '2.5rem', 
                      background: 'var(--color-primary)', 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MapPin style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        Alamat Kantor
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        Jl. Teknologi No. 123<br />
                        Jakarta Selatan, 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fade-in-up stagger-4" style={{ 
                display: 'flex', 
                gap: '2rem', 
                fontSize: '0.875rem', 
                color: 'var(--color-muted)',
                flexWrap: 'wrap'
              }}>
                <span>✓ Respons cepat</span>
                <span>✓ Support 24/7</span>
                <span>✓ Bantuan profesional</span>
              </div>
            </div>

            {/* Right Side - Contact Form */}
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
                  Kirim Pesan
                </h2>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="form-field">
                    <input
                      type="text"
                      {...register('name')}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Nama Lengkap</label>
                    {errors.name && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#dc2626', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.name.message}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <input
                      type="email"
                      {...register('email')}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Email Address</label>
                    {errors.email && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#dc2626', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.email.message}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <input
                      type="text"
                      {...register('subject')}
                      className="form-input"
                      placeholder=" "
                      required
                      disabled={isLoading}
                    />
                    <label className="form-label">Subjek</label>
                    {errors.subject && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#dc2626', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.subject.message}
                      </div>
                    )}
                  </div>

                  <div className="form-field">
                    <input
                      type="tel"
                      {...register('phone')}
                      className="form-input"
                      placeholder=" "
                      disabled={isLoading}
                    />
                    <label className="form-label">Nomor Telepon (Opsional)</label>
                    {errors.phone && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#dc2626', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.phone.message}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-field">
                      <select
                        {...register('category')}
                        className="form-input"
                        required
                        disabled={isLoading}
                        style={{ 
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="GENERAL_INQUIRY">General Inquiry</option>
                        <option value="TECHNICAL_ISSUE">Technical Issue</option>
                        <option value="PAYMENT_ISSUE">Payment Issue</option>
                        <option value="EVENT_MANAGEMENT">Event Management</option>
                        <option value="MARKETING_INQUIRY">Marketing Inquiry</option>
                      </select>
                      <label className="form-label">Kategori</label>
                      {errors.category && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#dc2626', 
                          marginTop: '0.5rem' 
                        }}>
                          {errors.category.message}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="form-field">
                    <textarea
                      {...register('message')}
                      className="form-input"
                      placeholder=" "
                      rows={4}
                      required
                      disabled={isLoading}
                      style={{ 
                        resize: 'vertical',
                        minHeight: '100px',
                        paddingTop: '1rem',
                        paddingBottom: '1rem'
                      }}
                    />
                    <label className="form-label">Pesan</label>
                    {errors.message && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#dc2626', 
                        marginTop: '0.5rem' 
                      }}>
                        {errors.message.message}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-muted)', 
                      marginTop: '0.5rem' 
                    }}>
                      Minimal 10 karakter, maksimal 2000 karakter
                    </div>
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
                    {isLoading ? (
                      <>
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginRight: '0.5rem'
                        }} />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                        Kirim Pesan
                      </>
                    )}
                  </button>
                </form>
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

      <Footer />
    </>
  )
}
