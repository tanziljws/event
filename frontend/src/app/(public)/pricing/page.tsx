'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, Zap, Crown, Users, Calendar, CreditCard, Shield, Headphones, BarChart3, Globe, FileText, QrCode, Award, CalendarDays, UserCheck, FileImage, TrendingUp, Palette, MessageCircle, Building2, Code, UserCog, Plug } from 'lucide-react'
import Navbar from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const handlePlanClick = (planName: string) => {
    if (!isAuthenticated) {
      // Not logged in - redirect to register
      router.push(`/register?plan=${planName.toLowerCase()}`)
    } else if (user?.role === 'PARTICIPANT') {
      // Logged in as participant - redirect to organizer registration
      router.push(`/register?plan=${planName.toLowerCase()}`)
    } else if (user?.role === 'ORGANIZER') {
      // Already organizer - redirect to dashboard
      router.push('/dashboard')
    } else {
      // Other roles - redirect to dashboard
      router.push('/dashboard')
    }
  }

  const pricingPlans = [
    {
      name: 'Pro',
      description: 'Paket ideal untuk event organizer pemula',
      icon: Zap,
      color: 'blue',
      badge: 'Populer',
      commission: '3%',
      price: {
        monthly: 'Gratis',
        annual: 'Gratis'
      },
      features: [
        { name: 'Hingga 5 event per bulan', included: true },
        { name: 'Maksimal 100 peserta per event', included: true },
        { name: 'Template sertifikat dasar', included: true },
        { name: 'QR Code attendance', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Customer support email', included: true },
        { name: 'Custom branding', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Priority support', included: false },
        { name: 'White-label solution', included: false },
        { name: 'API access', included: false }
      ],
      limitations: [
        'Komisi 3% per ticket terjual',
        'Template sertifikat terbatas',
        'Analytics dasar saja'
      ]
    },
    {
      name: 'Premium',
      description: 'Solusi lengkap untuk event organizer profesional',
      icon: Star,
      color: 'purple',
      badge: 'Rekomendasi',
      commission: '6%',
      price: {
        monthly: 'Rp 299.000',
        annual: 'Rp 2.999.000'
      },
      features: [
        { name: 'Event tak terbatas', included: true },
        { name: 'Maksimal 500 peserta per event', included: true },
        { name: 'Template sertifikat premium', included: true },
        { name: 'QR Code attendance', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Priority support', included: true },
        { name: 'Social media integration', included: true },
        { name: 'Customer support chat', included: true },
        { name: 'White-label solution', included: false },
        { name: 'API access', included: false }
      ],
      limitations: [
        'Komisi 6% per ticket terjual',
        'Belum ada white-label',
        'API access terbatas'
      ]
    },
    {
      name: 'Supervisor',
      description: 'Paket enterprise untuk organisasi besar',
      icon: Crown,
      color: 'gold',
      badge: 'Enterprise',
      commission: '8%',
      price: {
        monthly: 'Rp 599.000',
        annual: 'Rp 5.999.000'
      },
      features: [
        { name: 'Event tak terbatas', included: true },
        { name: 'Peserta tak terbatas', included: true },
        { name: 'Template sertifikat custom', included: true },
        { name: 'QR Code attendance', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Priority support', included: true },
        { name: 'White-label solution', included: true },
        { name: 'API access penuh', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom integrations', included: true }
      ],
      limitations: [
        'Komisi 8% per ticket terjual',
        'Minimum kontrak 6 bulan',
        'Setup fee Rp 2.000.000'
      ]
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          button: 'bg-gray-800 hover:bg-gray-900',
          icon: 'text-gray-600'
        }
      case 'purple':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: 'text-blue-500'
        }
      case 'gold':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          button: 'bg-gray-800 hover:bg-gray-900',
          icon: 'text-gray-600'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
          icon: 'text-gray-500'
        }
    }
  }

  return (
    <>
      <style jsx global>{`
        /* CSS Variables */
        :root {
          --color-primary: #3b82f6;
          --color-secondary: #8b5cf6;
          --color-accent: #10b981;
          --color-bg: #ffffff;
          --color-surface: #f8fafc;
          --color-text: #1f2937;
          --color-muted: #6b7280;
          --border-default: #e5e7eb;
        }

        /* Base Body Styles */
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--color-bg);
          color: var(--color-text);
          overflow-x: hidden;
        }

        /* Animated Background Grid */
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
          z-index: 0;
          opacity: 1;
        }

        /* Pricing Card Hover Effects */
        .pricing-card {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: visible;
          z-index: 10;
          min-height: 600px;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Recommended Card Special Styling */
        .pricing-card.recommended {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border: 2px solid #3b82f6;
          box-shadow: 0 20px 40px -12px rgba(59, 130, 246, 0.3);
          z-index: 15;
        }

        .pricing-card.recommended:hover {
          transform: translateY(-12px) scale(1.08);
          box-shadow: 0 30px 60px -12px rgba(59, 130, 246, 0.4);
        }

        /* Badge Styling */
        .pricing-badge {
          white-space: nowrap;
          min-width: 120px;
          text-align: center;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .pricing-card:hover::before {
          left: 100%;
        }

        /* Badge Animation */
        .pricing-badge {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Feature List Animation */
        .feature-item {
          transition: all 0.2s ease;
        }

        .feature-item:hover {
          transform: translateX(4px);
        }

        /* Commission Highlight */
        .commission-highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      
      <div className="min-h-screen bg-white relative">
        {/* Animated Background Grid */}
        <div className="bg-grid" />
        
        {/* Main Content with higher z-index */}
        <div style={{ position: 'relative', zIndex: 20 }}>
          {/* Navbar */}
          <Navbar />


          {/* Pricing Split Sections */}
          <section className="py-20 relative z-10">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 h-[800px]">
                {pricingPlans.map((plan, index) => {
                  const colors = getColorClasses(plan.color)
                  const Icon = plan.icon
                  const isRecommended = plan.badge === 'Rekomendasi'
                  
                  return (
                    <div 
                      key={plan.name}
                      className={`group relative p-8 border-2 border-gray-200 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                        plan.name === 'Pro' 
                          ? 'hover:bg-blue-500 hover:border-blue-400' 
                          : plan.name === 'Premium'
                          ? 'hover:bg-purple-500 hover:border-purple-400'
                          : 'hover:bg-yellow-400 hover:border-yellow-300'
                      } ${
                        isRecommended ? 'md:order-2' : index === 0 ? 'md:order-1' : 'md:order-3'
                      }`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <Badge 
                            className={`pricing-badge px-6 py-2 text-sm font-medium whitespace-nowrap ${
                              plan.badge === 'Rekomendasi' 
                                ? 'bg-blue-600 text-white' 
                                : plan.badge === 'Enterprise'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            {plan.badge}
                          </Badge>
                        </div>
                      )}

                      {/* Header */}
                      <div className="text-center pb-6">
                        <div className={`mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:bg-blue-200' 
                            : plan.name === 'Premium'
                            ? 'group-hover:bg-purple-200'
                            : 'group-hover:bg-yellow-200'
                        }`}>
                          <Icon className={`w-8 h-8 text-gray-600 transition-all duration-300 ${
                            plan.name === 'Pro' 
                              ? 'group-hover:text-blue-600' 
                              : plan.name === 'Premium'
                              ? 'group-hover:text-purple-600'
                              : 'group-hover:text-yellow-600'
                          }`} />
                        </div>
                        <h3 className={`text-2xl font-semibold text-gray-900 mb-2 transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:text-white' 
                            : plan.name === 'Premium'
                            ? 'group-hover:text-white'
                            : 'group-hover:text-white'
                        }`}>
                          {plan.name}
                        </h3>
                        <p className={`font-light text-gray-600 mb-4 transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:text-white' 
                            : plan.name === 'Premium'
                            ? 'group-hover:text-white'
                            : 'group-hover:text-white'
                        }`}>
                          {plan.description}
                        </p>
                        
                        {/* Commission Highlight */}
                        <div className={`mt-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:bg-blue-600' 
                            : plan.name === 'Premium'
                            ? 'group-hover:bg-purple-600'
                            : 'group-hover:bg-yellow-500'
                        }`}>
                          <div className={`text-sm mb-1 text-gray-600 transition-all duration-300 ${
                            plan.name === 'Pro' 
                              ? 'group-hover:text-white' 
                              : plan.name === 'Premium'
                              ? 'group-hover:text-white'
                              : 'group-hover:text-white'
                          }`}>Komisi per ticket</div>
                          <div className={`text-3xl font-bold text-gray-900 transition-all duration-300 ${
                            plan.name === 'Pro' 
                              ? 'group-hover:text-white' 
                              : plan.name === 'Premium'
                              ? 'group-hover:text-white'
                              : 'group-hover:text-white'
                          }`}>
                            {plan.commission}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className={`text-4xl font-bold mb-2 text-gray-900 transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:text-white' 
                            : plan.name === 'Premium'
                            ? 'group-hover:text-white'
                            : 'group-hover:text-white'
                        }`}>
                          {plan.price.monthly}
                        </div>
                        {plan.price.monthly !== 'Gratis' && (
                          <div className={`text-gray-600 transition-all duration-300 ${
                            plan.name === 'Pro' 
                              ? 'group-hover:text-white' 
                              : plan.name === 'Premium'
                              ? 'group-hover:text-white'
                              : 'group-hover:text-white'
                          }`}>
                            per bulan
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-2 gap-2 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            {feature.included ? (
                              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 mr-2 flex-shrink-0" />
                            )}
                            <span className={`text-xs transition-all duration-300 ${
                              feature.included 
                                ? 'text-gray-900 group-hover:text-white' 
                                : 'text-gray-500 group-hover:text-gray-300'
                            }`}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Limitations */}
                      <div className="mb-8">
                        <h4 className={`text-sm font-semibold mb-3 text-gray-900 transition-all duration-300 ${
                          plan.name === 'Pro' 
                            ? 'group-hover:text-white' 
                            : plan.name === 'Premium'
                            ? 'group-hover:text-white'
                            : 'group-hover:text-white'
                        }`}>Ketentuan:</h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, limitIndex) => (
                            <li key={limitIndex} className={`text-sm flex items-start text-gray-600 transition-all duration-300 ${
                              plan.name === 'Pro' 
                                ? 'group-hover:text-white' 
                                : plan.name === 'Premium'
                                ? 'group-hover:text-white'
                                : 'group-hover:text-white'
                            }`}>
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <div className="mt-auto">
                        <Button 
                          className="w-full bg-gray-800 text-white font-medium py-3 rounded-lg hover:bg-gray-900"
                          size="lg"
                          onClick={() => handlePlanClick(plan.name)}
                        >
                          {!isAuthenticated 
                            ? (plan.name === 'Pro' ? 'Mulai Gratis' : `Pilih ${plan.name}`)
                            : user?.role === 'PARTICIPANT'
                            ? `Upgrade ke ${plan.name}`
                            : user?.role === 'ORGANIZER'
                            ? 'Lihat Dashboard'
                            : (plan.name === 'Pro' ? 'Mulai Gratis' : `Pilih ${plan.name}`)
                          }
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Features Comparison */}
          <section className="py-24 bg-gray-50 relative z-10 mt-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-light text-gray-900 mb-4">
                  Perbandingan Fitur Lengkap
                </h2>
                <p className="text-gray-600 font-light">
                  Lihat detail perbedaan fitur di setiap paket
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Fitur
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                          Pro
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                          Premium
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                          Supervisor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[
                        { feature: 'Jumlah Event per Bulan', icon: CalendarDays, pro: '5', premium: 'Tak terbatas', supervisor: 'Tak terbatas' },
                        { feature: 'Maksimal Peserta per Event', icon: UserCheck, pro: '100', premium: '500', supervisor: 'Tak terbatas' },
                        { feature: 'Template Sertifikat', icon: FileImage, pro: 'Dasar', premium: 'Premium', supervisor: 'Custom' },
                        { feature: 'Analytics', icon: TrendingUp, pro: 'Basic', premium: 'Advanced', supervisor: 'Advanced' },
                        { feature: 'Custom Branding', icon: Palette, pro: 'X', premium: 'Check', supervisor: 'Check' },
                        { feature: 'Priority Support', icon: MessageCircle, pro: 'X', premium: 'Check', supervisor: 'Check' },
                        { feature: 'White-label Solution', icon: Building2, pro: 'X', premium: 'X', supervisor: 'Check' },
                        { feature: 'API Access', icon: Code, pro: 'X', premium: 'Terbatas', supervisor: 'Penuh' },
                        { feature: 'Dedicated Manager', icon: UserCog, pro: 'X', premium: 'X', supervisor: 'Check' },
                        { feature: 'Custom Integrations', icon: Plug, pro: 'X', premium: 'X', supervisor: 'Check' }
                      ].map((row, index) => {
                        const IconComponent = row.icon
                        return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <IconComponent className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                              {row.feature}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {row.pro === 'Check' ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : row.pro === 'X' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              row.pro
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {row.premium === 'Check' ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : row.premium === 'X' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              row.premium
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {row.supervisor === 'Check' ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : row.supervisor === 'X' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              row.supervisor
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-24 relative z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-light text-gray-900 mb-4">
                  Pertanyaan yang Sering Diajukan
                </h2>
                <p className="text-gray-600 font-light">
                  Temukan jawaban untuk pertanyaan umum tentang pricing kami
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    question: 'Bagaimana cara kerja komisi per ticket?',
                    answer: 'Komisi dihitung dari setiap ticket yang berhasil terjual melalui platform kami. Pro mengambil 3%, Premium 6%, dan Supervisor 8% dari nilai ticket yang terjual.'
                  },
                  {
                    question: 'Apakah ada biaya setup atau hidden fees?',
                    answer: 'Paket Pro dan Premium tidak ada biaya setup. Hanya paket Supervisor yang memiliki setup fee Rp 2.000.000 untuk custom integrations dan white-label solution.'
                  },
                  {
                    question: 'Bisakah saya upgrade atau downgrade paket?',
                    answer: 'Ya, Anda bisa upgrade atau downgrade paket kapan saja. Perubahan akan berlaku pada billing cycle berikutnya.'
                  },
                  {
                    question: 'Apakah ada trial period?',
                    answer: 'Paket Pro bisa digunakan gratis selamanya. Untuk Premium dan Supervisor, kami menyediakan trial 14 hari tanpa komitmen.'
                  },
                  {
                    question: 'Bagaimana jika saya melebihi limit peserta?',
                    answer: 'Untuk Pro dan Premium, jika melebihi limit peserta, Anda akan dikenakan biaya tambahan Rp 5.000 per peserta tambahan atau bisa upgrade ke paket yang lebih tinggi.'
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
