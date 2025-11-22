'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/toast'
import { ApiService } from '@/lib/api'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <span className="text-xl font-semibold text-gray-900">Event Management</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Platform manajemen event paling canggih untuk tim modern. Buat, kelola, dan skalakan event dengan tools yang dirancang untuk dunia modern.
              </p>
              <div className="flex gap-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h6 className="text-sm font-semibold text-gray-900 mb-4">Produk</h6>
              <div className="space-y-3">
                <Link href="/events" className="block text-gray-600 hover:text-gray-900 transition-colors">Lihat Event</Link>
                <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
                <Link href="/app" className="block text-gray-600 hover:text-gray-900 transition-colors">Mobile App</Link>
                <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</Link>
                <Link href="/login" className="block text-gray-600 hover:text-gray-900 transition-colors">Masuk</Link>
                <Link href="/register" className="block text-gray-600 hover:text-gray-900 transition-colors">Daftar</Link>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h6 className="text-sm font-semibold text-gray-900 mb-4">Perusahaan</h6>
              <div className="space-y-3">
                <Link href="/about" className="block text-gray-600 hover:text-gray-900 transition-colors">Tentang</Link>
                <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">Kontak</Link>
                <Link href="/careers" className="block text-gray-600 hover:text-gray-900 transition-colors">Karir</Link>
                <Link href="/blog" className="block text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 text-sm mb-4 md:mb-0">
                © 2025 Event Management System. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privasi</Link>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Syarat</Link>
                <Link href="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">Cookies</Link>
                <Link href="/security" className="text-gray-600 hover:text-gray-900 transition-colors">Keamanan</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
