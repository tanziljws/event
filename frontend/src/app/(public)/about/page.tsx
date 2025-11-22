'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading'
import Navbar from '@/components/navbar'
import { SiGoogle, SiApple, SiAmazon, SiMeta, SiNetflix, SiSpotify, SiTesla, SiAdobe } from 'react-icons/si'
import { FaMicrosoft, FaBuilding } from 'react-icons/fa'

// Demo form data
const demoFormData = {
  email: 'john.doe@example.com',
  name: 'John Doe',
  phone: '+62 812 3456 7890'
};

export default function HomePage() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const cursorRef = useRef<HTMLDivElement>(null)
  
  // Demo form state
  const [demoForm, setDemoForm] = useState({
    email: '',
    name: '',
    phone: '',
    progress: 0,
    showOtp: false,
    otp: '',
    otpConfirmed: false
  });

  // Demo event form state
  const [demoEventForm, setDemoEventForm] = useState({
    currentStep: 'search' as 'search' | 'results' | 'detail' | 'register' | 'notification',
    search: '',
    selectedEvent: null as { id: number; title: string; location: string; date: string; time: string; venue: string; } | null,
    name: '',
    email: '',
    phone: '',
    events: [
      { id: 1, title: 'Seminar Bisnis 2024', location: 'Jakarta', date: '25 Jan 2024', time: '09:00 WIB', venue: 'Hotel Mulia' },
      { id: 2, title: 'Workshop Digital Marketing', location: 'Bandung', date: '28 Jan 2024', time: '14:00 WIB', venue: 'Convention Center' },
      { id: 3, title: 'Konser Musik Jazz', location: 'Surabaya', date: '30 Jan 2024', time: '19:00 WIB', venue: 'Taman Budaya' }
    ]
  });

  // Testimonial carousel state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Testimonial data - Using placeholder avatars instead of Unsplash to avoid 404 errors
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/images/placeholder-avatar-1.png", // Fallback to local placeholder
      avatarFallback: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3b82f6&color=fff&size=128",
      title: "Platform yang Sangat Mudah Digunakan",
      content: "Sebagai event organizer, platform ini benar-benar mengubah cara saya mengelola event. Dari pendaftaran hingga sertifikat, semuanya otomatis dan profesional.",
      events: 12,
      badge: { text: "Verified!", color: "bg-green-600", icon: "check" }
    },
    {
      id: 2,
      name: "Michael Chen",
      avatar: "/images/placeholder-avatar-2.png", // Fallback to local placeholder
      avatarFallback: "https://ui-avatars.com/api/?name=Michael+Chen&background=10b981&color=fff&size=128",
      title: "Fitur Sertifikat Digital yang Luar Biasa",
      content: "Sertifikat otomatis dengan desain yang bisa dikustomisasi membuat peserta sangat puas. Tidak perlu lagi repot dengan sertifikat manual.",
      events: 8,
      badge: { text: "5 Stars!", color: "bg-blue-600", icon: "star" }
    },
    {
      id: 3,
      name: "Lisa Rodriguez",
      avatar: "/images/placeholder-avatar-3.png", // Fallback to local placeholder
      avatarFallback: "https://ui-avatars.com/api/?name=Lisa+Rodriguez&background=8b5cf6&color=fff&size=128",
      title: "Support Tim yang Responsif",
      content: "Tim support sangat membantu dan responsif. Setiap pertanyaan dijawab dengan cepat dan solutif. Platform yang sangat recommended untuk event organizer.",
      events: 15,
      badge: { text: "Loved!", color: "bg-purple-600", icon: "heart" }
    }
  ];

  // OTP typing function
  const typeOtpCode = useCallback(() => {
    const otpCode = '123456';
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const typeOtp = () => {
      if (currentIndex < otpCode.length) {
        setDemoForm(prev => ({
          ...prev,
          otp: otpCode.substring(0, currentIndex + 1)
        }));
        currentIndex++;
        // Slower OTP typing for better readability
        const otpBaseSpeed = 300;
        const otpVariation = Math.random() * 100; // 0-100ms variation
        timeoutId = setTimeout(typeOtp, otpBaseSpeed + otpVariation);
      } else {
        // After completing OTP, show confirmation
        setTimeout(() => {
          setDemoForm(prev => ({ ...prev, otpConfirmed: true }));
          // Wait 5 seconds then reset
          setTimeout(() => {
            setDemoForm(prev => ({
              ...prev,
              showOtp: false,
              otp: '',
              otpConfirmed: false,
              email: '',
              name: '',
              phone: ''
            }));
            // Restart the typing animation
            setTimeout(() => {
              startTypingAnimation();
            }, 300);
          }, 5000);
        }, 1000);
      }
    };
    
    typeOtp();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Demo form auto-typing effect
  const startTypingAnimation = useCallback(() => {
    let currentField = 0;
    let currentChar = 0;
    let timeoutId: NodeJS.Timeout;

    const fields = ['email', 'name', 'phone'];
    const texts = [demoFormData.email, demoFormData.name, demoFormData.phone];

    const typeText = () => {
      const currentFieldText = texts[currentField];

      currentChar++;
      
      if (currentChar > currentFieldText.length) {
        // Field typing completed, move to next field
        currentField++;
        currentChar = 0;
        
        if (currentField >= fields.length) {
          // All fields completed, show OTP form
          setTimeout(() => {
            setDemoForm(prev => ({ ...prev, showOtp: true }));
            // Start OTP typing after showing OTP form
            setTimeout(() => {
              typeOtpCode();
            }, 500);
          }, 1000);
          return;
        }
        
        timeoutId = setTimeout(typeText, 1200); // Longer pause between fields
        return;
      }

      // Update current field with typed text
      const currentText = currentFieldText.substring(0, currentChar);
      setDemoForm(prev => ({
        ...prev,
        [fields[currentField]]: currentText
      }));

      // Continue typing with slower, more natural variation
      const baseSpeed = 150;
      const variation = Math.random() * 80; // 0-80ms variation
      timeoutId = setTimeout(typeText, baseSpeed + variation);
    };

    // Start typing after 1 second
    timeoutId = setTimeout(typeText, 1000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [demoFormData]);

  useEffect(() => {
    const cleanup = startTypingAnimation();
    return cleanup;
  }, [startTypingAnimation]);

  // Auto-rotation for testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  // Custom cursor effect
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Scroll animation effect
  useEffect(() => {
    // Wait for DOM to be ready and hydration complete
    const timer = setTimeout(() => {
      const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add animation class with delay for smooth effect
            setTimeout(() => {
              entry.target.classList.add('animate-in')
            }, 100)
          } else {
            // Remove animation class when out of view for repeat effect
            entry.target.classList.remove('animate-in')
          }
        })
      }, observerOptions)

      // Observe all scroll animation elements
      const animateElements = document.querySelectorAll('.scroll-animate-left, .scroll-animate-right, .scroll-animate-up, .scroll-animate-scale')
      
      if (animateElements.length === 0) return
      
      animateElements.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }, 100) // Delay for scroll animation

    return () => clearTimeout(timer)
  }, [])


  // Text carousel effect
  useEffect(() => {
    // Wait for DOM to be ready and hydration complete
    const timer = setTimeout(() => {
      const textElements = document.querySelectorAll('.carousel-text')
      
      if (textElements.length === 0) return

      let currentTextIndex = 0

      const showText = (index: number) => {
        textElements.forEach((text, i) => {
          text.classList.remove('active', 'prev', 'next')
          if (i === index) {
            text.classList.add('active')
          } else if (i === (index - 1 + textElements.length) % textElements.length) {
            text.classList.add('prev')
          } else if (i === (index + 1) % textElements.length) {
            text.classList.add('next')
          }
        })
      }

      // Auto-rotate text every 3 seconds
      const textAutoRotate = setInterval(() => {
        currentTextIndex = (currentTextIndex + 1) % textElements.length
        showText(currentTextIndex)
      }, 3000)

      // Initialize first text
      showText(0)

      return () => {
        clearInterval(textAutoRotate)
      }
    }, 300) // Delay for text carousel

    return () => clearTimeout(timer)
  }, [])

  // Counter animation effect
  useEffect(() => {
    // Wait for DOM to be ready and hydration complete
    const timer = setTimeout(() => {
      const counters = document.querySelectorAll('.counter')
      
      if (counters.length === 0) return
      
      const animateCounters = () => {
        counters.forEach((counter) => {
          const target = parseFloat(counter.getAttribute('data-target') || '0')
          const current = parseFloat(counter.textContent?.replace(/[^\d.]/g, '') || '0')
          const increment = target / 100
          
          if (current < target) {
            const newValue = Math.min(current + increment, target)
            const displayValue = target >= 1000 ? 
              (newValue / 1000).toFixed(0) + 'K+' : 
              newValue.toFixed(target % 1 !== 0 ? 1 : 0) + (target === 99.9 ? '%' : '+')
            
            counter.textContent = displayValue
            setTimeout(() => animateCounters(), 20)
          } else {
            const finalValue = target >= 1000 ? 
              (target / 1000).toFixed(0) + 'K+' : 
              target.toFixed(target % 1 !== 0 ? 1 : 0) + (target === 99.9 ? '%' : '+')
            counter.textContent = finalValue
          }
        })
      }

      // Start animation when stats section is visible
      const statsSection = document.querySelector('.stats-section')
      if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(animateCounters, 500) // Delay for stagger effect
              observer.unobserve(entry.target)
            }
          })
        }, { threshold: 0.5 })
        
        observer.observe(statsSection)
      }

      return () => {
        // Cleanup if needed
      }
    }, 400) // Delay for counter animation

    return () => clearTimeout(timer)
  }, [])

  // Certificate carousel effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const slides = document.querySelectorAll('.certificate-slide')
      const dots = document.querySelectorAll('.certificate-dot')
      
      if (slides.length === 0) return
      
      let currentSlide = 0
      
      const showSlide = (index: number) => {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'))
        dots.forEach(dot => dot.classList.remove('active'))
        
        // Add active class to current slide and dot
        slides[index]?.classList.add('active')
        dots[index]?.classList.add('active')
      }
      
      const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length
        showSlide(currentSlide)
      }
      
      // Auto-rotate every 4 seconds
      const interval = setInterval(nextSlide, 4000)
      
      // Add click handlers to dots
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          currentSlide = index
          showSlide(currentSlide)
        })
      })
      
      return () => {
        clearInterval(interval)
        dots.forEach(dot => {
          dot.removeEventListener('click', () => {})
        })
      }
    }, 500) // Delay for carousel initialization
    
    return () => clearTimeout(timer)
  }, [])

  // Event Management progressive animation
  useEffect(() => {
    const startAnimation = () => {
      // Reset form
      setDemoEventForm(prev => ({
        ...prev,
        currentStep: 'search',
        search: '',
        selectedEvent: null,
        name: '',
        email: '',
        phone: ''
      }))

      // Phase 1: Search Event
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, search: 'Seminar Bisnis' }))
      }, 1000)
      
      // Phase 2: Show Results
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, currentStep: 'results' }))
      }, 2000)
      
      // Phase 3: Select Event (auto-select first event)
      setTimeout(() => {
        setDemoEventForm(prev => ({ 
          ...prev, 
          currentStep: 'detail',
          selectedEvent: prev.events[0]
        }))
      }, 4000)
      
      // Phase 4: Switch to Registration Form
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, currentStep: 'register' }))
      }, 6000)
      
      // Phase 5: Fill Registration Form
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, name: 'John Doe' }))
      }, 7000)
      
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, email: 'john@example.com' }))
      }, 8000)
      
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, phone: '+62 812 3456 7890' }))
      }, 9000)
      
      // Phase 6: Show Notification
      setTimeout(() => {
        setDemoEventForm(prev => ({ ...prev, currentStep: 'notification' }))
      }, 10000)
      
      // Phase 7: Reset and loop
      setTimeout(() => {
        startAnimation()
      }, 12000)
    }

    const timer = setTimeout(() => {
      startAnimation()
    }, 1000) // Initial delay
    
    return () => clearTimeout(timer)
  }, [])

  // Show loading while checking authentication
  if (!isInitialized) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
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

        /* Custom Cursor */
        .custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background: var(--color-primary);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
          mix-blend-mode: difference;
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
          z-index: 1;
          opacity: 1;
        }

        /* Social Media Buttons - From Uiverse.io by vinodjangid07 */
        .card {
          width: fit-content;
          height: fit-content;
          background-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px 15px;
          gap: 12px;
          box-shadow: none;
        }

        /* for all social containers*/
        .socialContainer {
          width: 40px;
          height: 40px;
          background-color: rgb(44, 44, 44);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition-duration: .3s;
        }
        /* instagram*/
        .containerOne:hover {
          background-color: #d62976;
          transition-duration: .3s;
        }
        /* twitter*/
        .containerTwo:hover {
          background-color: #00acee;
          transition-duration: .3s;
        }
        /* linkdin*/
        .containerThree:hover {
          background-color: #0072b1;
          transition-duration: .3s;
        }
        /* Whatsapp*/
        .containerFour:hover {
          background-color: #128C7E;
          transition-duration: .3s;
        }

        .socialContainer:active {
          transform: scale(0.9);
          transition-duration: .3s;
        }

        .socialSvg {
          width: 14px;
        }

        .socialSvg path {
          fill: rgb(255, 255, 255);
        }

        .socialContainer:hover .socialSvg {
          transform: translateY(-2px);
          transition: transform 0.3s ease;
        }

        /* Prevent flip animation on social icons in footer */
        footer .socialContainer {
          transform-style: flat !important;
          perspective: none !important;
          will-change: transform;
        }

        footer .socialContainer:hover {
          transform: scale(1.1) !important;
        }

        .scroll-animate-left {
          opacity: 0;
          transform: translateX(-100px) scale(0.95);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .scroll-animate-right {
          opacity: 0;
          transform: translateX(100px) scale(0.95);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .scroll-animate-left.animate-in {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        
        .scroll-animate-right.animate-in {
          opacity: 1;
          transform: translateX(0) scale(1);
        }

        .scroll-animate-up {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .scroll-animate-up.animate-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .scroll-animate-scale {
          opacity: 0;
          transform: scale(0.8) rotate(-5deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .scroll-animate-scale.animate-in {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        
        /* Stagger animation delays */
        .scroll-animate-left:nth-child(1) { transition-delay: 0.1s; }
        .scroll-animate-right:nth-child(1) { transition-delay: 0.2s; }
        .scroll-animate-left:nth-child(2) { transition-delay: 0.3s; }
        .scroll-animate-right:nth-child(2) { transition-delay: 0.4s; }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        body {
          scroll-snap-type: y mandatory;
          overflow-x: hidden;
        }

        /* Mobile snap scrolling */
        @media (max-width: 768px) {
          body {
            scroll-snap-type: y proximity;
          }
          
          .snap-section {
            scroll-snap-align: start;
            min-height: 80vh;
          }
        }

        /* Snap scrolling for sections */
        .snap-container {
          scroll-snap-type: y mandatory;
          overflow-y: scroll;
          height: 100vh;
        }

        .snap-section {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .snap-section-hero {
          scroll-snap-align: start;
          min-height: 100vh;
        }

        .snap-section-features {
          scroll-snap-align: start;
          min-height: 100vh;
          padding: 4rem 0;
        }

        .snap-section-cta {
          scroll-snap-align: start;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        
        
        /* Text Carousel */
        .text-carousel-container {
          position: relative;
          height: 3.5rem; /* Fixed height for smooth transition */
          overflow: hidden;
        }
        
        .carousel-text {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          line-height: 1.6;
        }
        
        .carousel-text.active {
          opacity: 1;
          transform: translateY(0);
        }
        
        .carousel-text.prev {
          opacity: 0;
          transform: translateY(-20px);
        }
        
        .carousel-text.next {
          opacity: 0;
          transform: translateY(20px);
        }
        
        /* Company Logo Slider */
        .company-slider-container {
          overflow: hidden;
          position: relative;
          margin: 0 auto;
          max-width: 100%;
        }
        
        .company-slider {
          display: flex;
          animation: slide 20s linear infinite;
          width: calc(200% + 2rem);
        }
        
        .company-slide {
          flex: 0 0 auto;
          width: calc(100% / 10);
          padding: 0 1rem;
        }
        
        .company-logo {
          padding: 1.5rem 2rem;
          text-align: center;
          font-weight: 600;
          transition: all 0.3s ease;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .company-logo:hover {
          transform: translateY(-2px);
        }
        
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Visa Card Styles */
        .card-container {
          perspective: 1000px;
          position: relative;
          animation: float 6s ease-in-out infinite;
        }

        .card {
          width: 300px;
          height: 190px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }

        .card:hover {
          transform: rotateY(180deg) scale(1.05);
        }
        
        .card:hover .card-front {
          opacity: 0;
        }
        
        .card:hover .card-back {
          opacity: 1;
        }

        /* Prevent flip animation on footer social icons */
        footer .card {
          width: auto !important;
          height: auto !important;
          transform: none !important;
          transform-style: flat !important;
          perspective: none !important;
          transition: none !important;
          cursor: default !important;
        }

        footer .card:hover {
          transform: none !important;
        }

        footer .socialContainer {
          transform-style: flat !important;
          perspective: none !important;
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }

        .card-front {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          position: absolute;
          top: 0;
          left: 0;
        }

        .card-back {
          background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
          transform: rotateY(180deg);
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        /* Animated Background Pattern */
        .card-front::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Chip */
        .chip {
          position: absolute;
          top: 45px;
          left: 25px;
          width: 35px;
          height: 28px;
          background: linear-gradient(145deg, #f0d084, #c9a961);
          border-radius: 6px;
          border: 2px solid #b8985a;
          position: relative;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .chip::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 16px;
          background: linear-gradient(45deg, #d4af37, #f7dc6f);
          border-radius: 2px;
        }

        /* Contactless Symbol */
        .contactless {
          position: absolute;
          top: 50px;
          right: 25px;
          width: 25px;
          height: 25px;
        }

        .wave {
          position: absolute;
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: ripple 2s linear infinite;
        }

        .wave:nth-child(1) { width: 12px; height: 12px; animation-delay: 0s; }
        .wave:nth-child(2) { width: 16px; height: 16px; animation-delay: 0.3s; }
        .wave:nth-child(3) { width: 20px; height: 20px; animation-delay: 0.6s; }

        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Card Number */
        .card-number {
          position: absolute;
          top: 95px;
          left: 25px;
          color: white;
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .card-number .digit-group {
          display: inline-block;
          margin-right: 12px;
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .card-number .digit-group:nth-child(1) { animation-delay: 0.1s; }
        .card-number .digit-group:nth-child(2) { animation-delay: 0.2s; }
        .card-number .digit-group:nth-child(3) { animation-delay: 0.3s; }
        .card-number .digit-group:nth-child(4) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Cardholder Name */
        .cardholder {
          position: absolute;
          bottom: 45px;
          left: 25px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: slideInLeft 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Expiry Date */
        .expiry {
          position: absolute;
          bottom: 45px;
          right: 90px;
          color: white;
          font-size: 10px;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: slideInRight 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .expiry-label {
          font-size: 8px;
          opacity: 0.8;
          margin-bottom: 2px;
        }

        /* Visa Logo */
        .visa-logo {
          position: absolute;
          bottom: 25px;
          right: 25px;
          color: white;
          font-size: 24px;
          font-weight: bold;
          font-style: italic;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: zoomIn 0.8s ease-out 0.7s forwards;
          opacity: 0;
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Back Side Styling */
        .magnetic-strip {
          width: 100%;
          height: 35px;
          background: linear-gradient(90deg, #2c2c2c 0%, #1a1a1a 50%, #2c2c2c 100%);
          position: absolute;
          top: 25px;
          left: 0;
        }

        .signature-panel {
          position: absolute;
          top: 70px;
          left: 25px;
          right: 25px;
          height: 28px;
          background: linear-gradient(90deg, #f5f5f5 0%, #e0e0e0 100%);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
        }

        .cvv {
          background: white;
          color: #333;
          padding: 3px 6px;
          border-radius: 2px;
          font-weight: bold;
          font-size: 10px;
          margin-right: 8px;
        }

        .signature {
          font-style: italic;
          color: #666;
          font-size: 10px;
        }

        .security-features {
          position: absolute;
          bottom: 25px;
          left: 25px;
          right: 25px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 8px;
          text-align: center;
          line-height: 1.3;
        }

        /* Holographic Effect */
        .hologram {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          animation: hologramSweep 3s ease-in-out infinite;
        }

        @keyframes hologramSweep {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        /* Progressive Registration Form Styles */
        .registration-demo-container {
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
        }
        
        .registration-form {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #f3f4f6;
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .form-fields {
          space-y: 16px;
        }
        
        .field-container {
          margin-bottom: 16px;
        }
        
        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        
        .field-input {
          position: relative;
        }
        
        .demo-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #f3f4f6;
          border-radius: 16px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: #fafafa;
          color: #374151;
          font-weight: 400;
        }
        
        .demo-input:focus {
          outline: none;
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .typing-cursor {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 20px;
          background: #10b981;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        
        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 12px;
        }
        
        .submit-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        
        .submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        
        /* OTP Form Styles */
        .otp-form {
          text-align: center;
        }
        
        .otp-header {
          margin-bottom: 20px;
        }
        
        .otp-icon {
          display: flex;
          justify-content: center;
        }
        
        .otp-input-container {
          position: relative;
          margin-bottom: 20px;
        }
        
        .otp-inputs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .otp-digit {
          width: 40px;
          height: 40px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          background: #f9fafb;
          color: #374151;
          transition: all 0.3s ease;
        }
        
        .otp-digit:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .otp-digit:not(:empty) {
          border-color: #10b981;
          background: #f0fdf4;
          animation: digitFill 0.3s ease-in-out;
        }
        
        @keyframes digitFill {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .otp-cursor {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 20px;
          background: #3b82f6;
          animation: blink 1s infinite;
        }
        
        .verify-btn {
          width: 100%;
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .verify-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        
        .verify-btn.confirmed {
          background: linear-gradient(135deg, #10b981, #059669);
          animation: successPulse 0.6s ease-in-out;
        }
        
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .professional-icon {
          display: flex;
          justify-content: center;
        }
        
        /* Pause animation on hover */
        .company-slider-container:hover .company-slider {
          animation-play-state: paused;
        }
        
        .certificate-carousel {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .certificate-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.5s ease-in-out;
        }
        
        .certificate-slide.active {
          opacity: 1;
          transform: translateX(0);
        }
        
        .certificate-dot.active {
          background-color: var(--color-primary) !important;
        }
        
        .certificate-dot:hover {
          transform: scale(1.2);
        }
        
        .event-step {
          opacity: 0.5;
          transform: translateY(10px);
          transition: all 0.5s ease-in-out;
        }
        
        .event-step.active {
          opacity: 1;
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .event-step.completed {
          opacity: 0.8;
          transform: translateY(0);
        }
        
        .event-step.active .w-2 {
          animation: pulse 2s infinite;
        }
        
        .event-step.completed .w-2 {
          background-color: #10b981 !important;
        }
        
        .event-form {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease-in-out;
        }
        
        .event-form.active {
          opacity: 1;
          transform: translateY(0);
        }
        
        .event-demo-container {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .event-form {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }
        
        .event-form .form-header {
          margin-bottom: 20px;
        }
        
        .event-form .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .event-form .field-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .event-form .field-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        
        .event-form .field-input {
          position: relative;
        }
        
        .event-form .demo-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .event-form .demo-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .event-form .typing-cursor {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 16px;
          background: #3b82f6;
          animation: blink 1s infinite;
        }
        
        .event-form .form-submit {
          margin-top: 20px;
        }
        
        .event-form .submit-button {
          width: 100%;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .event-form .submit-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slideOutToLeft {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-100px) scale(0.9);
          }
        }


        .animate-slideInFromRight {
          animation: slideInFromRight 0.6s ease-out forwards;
        }

        .animate-slideOutToLeft {
          animation: slideOutToLeft 0.6s ease-out forwards;
        }


        .testimonial-carousel {
          position: relative;
          overflow: hidden;
        }

        .testimonial-slide {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          opacity: 0;
          transform: translateX(100px) scale(0.9);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .testimonial-slide.active {
          opacity: 1;
          transform: translateX(0) scale(1);
          position: relative;
        }

        .testimonial-slide.prev {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="min-h-screen bg-white relative">
        {/* Custom Cursor */}
        <div ref={cursorRef} className="custom-cursor" />
        
        {/* Animated Background Grid */}
        <div className="bg-grid" />
        
        {/* Main Content with higher z-index */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Navbar */}
          <Navbar />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 snap-section-hero">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Side - H1 Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-light text-blue-600 sm:text-6xl md:text-7xl leading-tight">
                Kelola Event dengan Mudah
              </h1>
              <h2 className="text-3xl font-light text-gray-600 sm:text-4xl md:text-5xl leading-tight tracking-wide">
                Platform Terdepan untuk<br className="hidden sm:block" />
                <span className="sm:ml-0">Event Profesional</span>
              </h2>
            </div>
            
            <div className="text-carousel-container max-w-lg">
              <p className="text-lg text-gray-600 carousel-text active">
                Platform terintegrasi untuk mengelola event, pendaftaran peserta, 
                pembayaran, dan sertifikat dalam satu tempat.
              </p>
              <p className="text-lg text-gray-600 carousel-text">
                Solusi lengkap untuk event organizer profesional dengan fitur 
                manajemen peserta, pembayaran multi-channel, dan sertifikat digital.
              </p>
              <p className="text-lg text-gray-600 carousel-text">
                Tingkatkan efisiensi event Anda dengan sistem otomatis yang 
                menghemat waktu dan meningkatkan pengalaman peserta.
              </p>
              <p className="text-lg text-gray-600 carousel-text">
                Dari perencanaan hingga eksekusi, kelola seluruh lifecycle 
                event Anda dengan mudah dan profesional.
              </p>
              <p className="text-lg text-gray-600 carousel-text">
                Platform event management terdepan yang didukung teknologi 
                modern untuk hasil yang maksimal.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated && user ? (
                <>
                  <Link href={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 w-full sm:w-auto">
                      {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard Saya'}
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 px-8 py-3 rounded-lg font-medium transition-all duration-200 w-full sm:w-auto">
                      Lihat Event
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 w-full sm:w-auto">
                      Mulai Sekarang
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 px-8 py-3 rounded-lg font-medium transition-all duration-200 w-full sm:w-auto">
                      Lihat Pricing
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button variant="outline" size="lg" className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 px-8 py-3 rounded-lg font-medium transition-all duration-200 w-full sm:w-auto">
                      Lihat Event
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Testimonials Carousel */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light text-gray-800 animate-fadeInUp">Apa Kata Mereka?</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  title={isAutoPlaying ? "Pause" : "Play"}
                >
                  {isAutoPlaying ? (
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Carousel Container */}
            <div className="testimonial-carousel relative h-80">
              {testimonials.map((testimonial, index) => (
                <article
                  key={testimonial.id}
                  className={`testimonial-slide rounded-xl border-2 border-gray-100 bg-white hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:border-blue-300 hover:-translate-y-1 group ${
                    index === currentTestimonial ? 'active' : ''
                  } ${index < currentTestimonial ? 'prev' : ''}`}
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  <div className="flex items-start gap-4 p-4 sm:p-6 lg:p-8">
                    <a href="#" className="block shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Image
                        alt={testimonial.name}
                        src={testimonial.avatarFallback || testimonial.avatar}
                        width={56}
                        height={56}
                        className="size-14 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-blue-200 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to UI Avatars if image fails
                          const target = e.target as HTMLImageElement
                          if (testimonial.avatarFallback && target.src !== testimonial.avatarFallback) {
                            target.src = testimonial.avatarFallback
                          } else {
                            // Final fallback: hide image and show initials
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.avatar-fallback')) {
                              const fallback = document.createElement('div')
                              fallback.className = 'avatar-fallback size-14 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold'
                              fallback.textContent = testimonial.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                              parent.appendChild(fallback)
                            }
                          }
                        }}
                      />
                    </a>

                    <div>
                      <h3 className="font-medium sm:text-lg">
                        <a href="#" className="hover:underline group-hover:text-blue-600 transition-colors duration-300">
                          {testimonial.title}
                        </a>
                      </h3>

                      <p className="line-clamp-2 text-sm text-gray-700">
                        {testimonial.content}
                      </p>

                      <div className="mt-2 sm:flex sm:items-center sm:gap-2">
                        <div className="flex items-center gap-1 text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                          </svg>
                          <p className="text-xs">{testimonial.events} events</p>
                        </div>

                        <span className="hidden sm:block" aria-hidden="true">&middot;</span>

                        <p className="hidden sm:block sm:text-xs sm:text-gray-500">
                          Posted by
                          <a href="#" className="font-medium underline hover:text-gray-700"> {testimonial.name} </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <strong
                      className={`-me-[2px] -mb-[2px] inline-flex items-center gap-1 rounded-ss-xl rounded-ee-xl ${testimonial.badge.color} px-3 py-1.5 text-white group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}
                    >
                      {testimonial.badge.icon === 'check' && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      )}
                      {testimonial.badge.icon === 'star' && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      )}
                      {testimonial.badge.icon === 'heart' && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      )}
                      <span className="text-[10px] font-medium sm:text-xs">{testimonial.badge.text}</span>
                    </strong>
                  </div>
                </article>
              ))}
            </div>

          </div>

        </div>

        {/* Features with Scroll Animation */}
        <div className="mt-32 snap-section-features">
          <div className="text-center mb-20 scroll-animate-up">
            <h3 className="text-3xl font-light text-gray-900 mb-6">Fitur Utama</h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
              Semua yang Anda butuhkan untuk mengelola event profesional dalam satu platform
            </p>
          </div>
          
          {/* Feature 1 - Event Management */}
          <div className="mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-animate-left">
                <div className="rounded-3xl p-8 h-96 flex items-center justify-center">
                  {/* Event Management Demo */}
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                      
                      {/* Step 1: Search */}
                      {demoEventForm.currentStep === 'search' && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Cari Event</h3>
                          </div>
                          <div>
                            <div className="relative">
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300" 
                                value={demoEventForm.search}
                                readOnly
                                placeholder="Ketik untuk mencari event..."
                              />
                              <div className="absolute right-4 top-3.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Step 2: Results */}
                      {demoEventForm.currentStep === 'results' && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Hasil Pencarian</h3>
                            <p className="text-sm text-gray-600">Pilih event yang menarik</p>
                          </div>
                          <div className="space-y-3">
                            {demoEventForm.events.map((event, index) => (
                              <div 
                                key={event.id}
                                className={`p-4 border-2 rounded-xl cursor-pointer hover:scale-105 transition-all duration-500 transform ${
                                  index === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                                style={{
                                  animationDelay: `${index * 300}ms`,
                                  animation: 'slideInUp 0.6s ease-out forwards'
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h5>
                                    <p className="text-xs text-gray-600">{event.location} • {event.date}</p>
                                    <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <div className="text-xs text-blue-600 font-medium">Klik</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Step 3: Event Detail */}
                      {demoEventForm.currentStep === 'detail' && demoEventForm.selectedEvent && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{demoEventForm.selectedEvent.title}</h4>
                            <p className="text-sm text-gray-600">Detail Event Lengkap</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-blue-200">
                              <span className="text-sm font-medium text-gray-700">Lokasi</span>
                              <span className="text-sm font-semibold text-gray-900">{demoEventForm.selectedEvent.location}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-blue-200">
                              <span className="text-sm font-medium text-gray-700">Tanggal</span>
                              <span className="text-sm font-semibold text-gray-900">{demoEventForm.selectedEvent.date}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-blue-200">
                              <span className="text-sm font-medium text-gray-700">Waktu</span>
                              <span className="text-sm font-semibold text-gray-900">{demoEventForm.selectedEvent.time}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-gray-700">Venue</span>
                              <span className="text-sm font-semibold text-gray-900">{demoEventForm.selectedEvent.venue}</span>
                            </div>
                          </div>
                          
                          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Daftar Event
                          </button>
                        </div>
                      )}
                      
                      {/* Step 4: Registration Form */}
                      {demoEventForm.currentStep === 'register' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Form Pendaftaran</h4>
                            <p className="text-sm text-gray-600">Isi data untuk mendaftar</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300" 
                                  value={demoEventForm.name}
                                  readOnly
                                  placeholder="Masukkan nama lengkap..."
                                />
                                <div className="absolute right-4 top-3.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            
                            <div className="animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                              <div className="relative">
                                <input 
                                  type="email" 
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300" 
                                  value={demoEventForm.email}
                                  readOnly
                                  placeholder="Masukkan email..."
                                />
                                <div className="absolute right-4 top-3.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            
                            <div className="animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                              <div className="relative">
                                <input 
                                  type="tel" 
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300" 
                                  value={demoEventForm.phone}
                                  readOnly
                                  placeholder="Masukkan nomor telepon..."
                                />
                                <div className="absolute right-4 top-3.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg animate-slideInUp">
                            Konfirmasi Pendaftaran
                          </button>
                        </div>
                      )}
                      
                      {/* Step 5: Notification */}
                      {demoEventForm.currentStep === 'notification' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="text-center">
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h4>
                            <p className="text-sm text-gray-600">Anda telah terdaftar di event</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 animate-slideInUp">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-green-900">Konfirmasi Terkirim</p>
                                <p className="text-xs text-green-700">Check email untuk detail event</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-900">Reminder Akan Dikirim</p>
                                <p className="text-xs text-blue-700">1 hari sebelum event dimulai</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                            <p className="text-xs text-gray-500">Terima kasih telah menggunakan layanan kami!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-animate-right">
                <div className="space-y-6">
                  <h4 className="text-4xl font-light text-gray-900">Event Management</h4>
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    Temukan dan daftar event menarik dengan mudah. Jelajahi berbagai kategori event, 
                    dari seminar bisnis hingga konser musik, semua dalam satu platform.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Jelajahi ribuan event menarik
          </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Daftar event dengan satu klik
          </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Notifikasi real-time untuk event favorit
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Pendaftaran Peserta */}
          <div className="mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-animate-right lg:order-1">
                <div className="space-y-6">
                  <h4 className="text-4xl font-light text-gray-900">Pendaftaran Peserta</h4>
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    Sistem pendaftaran otomatis dengan validasi email dan manajemen slot 
                    yang efisien untuk event Anda.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Validasi email otomatis
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Manajemen slot dan kapasitas
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Notifikasi real-time
                    </li>
                  </ul>
                </div>
              </div>
              <div className="scroll-animate-left lg:order-2">
                <div className="rounded-3xl p-8 h-96 flex items-center justify-center">
                  {/* Progressive Registration Form */}
                  <div className="registration-demo-container">
                    <div className="registration-form">
                      <div className="form-header">
                        {/* Clean header without icon and title */}
                      </div>
                      
                      {!demoForm.showOtp ? (
                        <div className="form-fields">
                          {/* Email Field */}
                          <div className="field-container">
                            <label className="field-label">Email</label>
                            <div className="field-input">
                              <input 
                                type="email" 
                                className="demo-input" 
                                value={demoForm.email}
                                readOnly
                              />
                              <div className="typing-cursor"></div>
        </div>
                          </div>
                          
                          {/* Nama Field */}
                          <div className="field-container">
                            <label className="field-label">Nama Lengkap</label>
                            <div className="field-input">
                              <input 
                                type="text" 
                                className="demo-input" 
                                value={demoForm.name}
                                readOnly
                              />
                              <div className="typing-cursor"></div>
                            </div>
                          </div>
                          
                          {/* Phone Field */}
                          <div className="field-container">
                            <label className="field-label">Nomor Telepon</label>
                            <div className="field-input">
                              <input 
                                type="tel" 
                                className="demo-input" 
                                value={demoForm.phone}
                                readOnly
                              />
                              <div className="typing-cursor"></div>
                            </div>
                          </div>
                          
                          
                          {/* Submit Button */}
                          <button className="submit-btn">
                            Kirim OTP
                          </button>
                        </div>
                      ) : (
                        <div className="otp-form">
                                                  <div className="otp-header">
                          {/* Clean header without icon and title */}
                        </div>
                          
                          <div className="otp-input-container">
                            <div className="otp-inputs">
                              {[1,2,3,4,5,6].map((digit, index) => (
                                <input 
                                  key={index}
                                  type="text" 
                                  className="otp-digit" 
                                  maxLength={1}
                                  value={demoForm.otp[index] || ''}
                                  readOnly
                                />
                              ))}
                            </div>
                            <div className="otp-cursor"></div>
                          </div>
                          
                          <button className={`verify-btn ${demoForm.otpConfirmed ? 'confirmed' : ''}`}>
                            {demoForm.otpConfirmed ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Terverifikasi
                              </>
                            ) : (
                              'Verifikasi & Daftar'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 - Pembayaran Terintegrasi */}
          <div className="mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-animate-left">
                <div className="rounded-3xl p-8 h-96 flex items-center justify-center">
                  {/* Visa Card UI */}
                  <div className="card-container scale-125">
                    <div className="card">
                      {/* Front Side */}
                      <div className="card-face card-front">
                        <div className="hologram"></div>
                        
                        {/* EMV Chip */}
                        <div className="chip"></div>
                        
                        {/* Contactless Payment Symbol */}
                        <div className="contactless">
                          <div className="wave"></div>
                          <div className="wave"></div>
                          <div className="wave"></div>
                        </div>
                        
                        {/* Card Number */}
                        <div className="card-number">
                          <span className="digit-group">4532</span>
                          <span className="digit-group">1234</span>
                          <span className="digit-group">5678</span>
                          <span className="digit-group">9012</span>
                        </div>
                        
                        {/* Cardholder Name */}
                        <div className="cardholder">NUSA PAYMENT</div>
                        
                        {/* Expiry Date */}
                        <div className="expiry">
                          <div className="expiry-label">VALID THRU</div>
                          <div>12/28</div>
                        </div>
                        
                        {/* Visa Logo */}
                        <div className="visa-logo">VISA</div>
                      </div>
                      
                      {/* Back Side */}
                      <div className="card-face card-back">
                        {/* Magnetic Strip */}
                        <div className="magnetic-strip"></div>
                        
                        {/* Signature Panel */}
                        <div className="signature-panel">
                          <div className="cvv">123</div>
                          <div className="signature">NUSA PAY</div>
                        </div>
                        
                        {/* Security Features */}
                        <div className="security-features">
                          This card is property of NUSA Platform.<br />
                          24/7 Customer Service: 1-800-NUSA-HELP<br />
                          <strong>nusa.com</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-animate-right">
                <div className="space-y-6">
                  <h4 className="text-4xl font-light text-gray-900">Pembayaran Terintegrasi</h4>
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    Berbagai metode pembayaran: QR Code, Bank Transfer, E-Wallet, 
                    dan Cryptocurrency untuk kemudahan transaksi.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      QR Code dan Bank Transfer
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      E-Wallet dan Cryptocurrency
          </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Verifikasi transaksi otomatis
          </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4 - Sertifikat Digital */}
          <div className="mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-animate-right lg:order-1">
                <div className="space-y-6">
                  <h4 className="text-4xl font-light text-gray-900">Sertifikat Digital</h4>
                  <p className="text-xl text-gray-600 leading-relaxed font-light">
                    Generate sertifikat otomatis untuk peserta yang hadir dengan 
                    QR code untuk verifikasi keaslian.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      Generate otomatis setelah event
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      QR code untuk verifikasi
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      Download dan sharing mudah
                    </li>
                  </ul>
                </div>
              </div>
              <div className="scroll-animate-left lg:order-2">
                <div className="relative h-96 overflow-hidden">
                  {/* Certificate Carousel */}
                  <div className="certificate-carousel">
                    {/* Certificate 1 - Classic Orange with Left Blue Accent */}
                    <div className="certificate-slide active">
                      <div className="relative bg-white border-2 border-gray-300 rounded-3xl p-6 h-full overflow-hidden shadow-xl">
                        {/* Left Blue Accent Background */}
                        <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-b from-blue-600 to-blue-800"></div>
                        <div className="absolute left-16 top-0 w-2 h-full bg-gradient-to-b from-blue-500 to-blue-700"></div>
                        
                        {/* Decorative Border Pattern */}
                        <div className="absolute inset-2 border-2 border-orange-200 rounded-2xl"></div>
                        <div className="absolute inset-4 border border-orange-100 rounded-xl"></div>
                        
                        {/* Certificate Content */}
                        <div className="relative z-10 bg-white rounded-xl p-4 h-full flex flex-col justify-between ml-4">
                          <div className="text-center border-b-2 border-orange-200 pb-3">
                            <div className="text-3xl mb-1">🏆</div>
                            <h5 className="text-base font-bold text-gray-900 tracking-wide">CERTIFICATE OF COMPLETION</h5>
                            <p className="text-xs text-gray-600 font-medium">Event Management Workshop</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-center py-2">
                            <p className="text-gray-700 text-sm mb-1">This certifies that</p>
                            <h6 className="text-lg font-bold text-gray-900 mb-1" style={{
                              fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)',
                              letterSpacing: '0.5px'
                            }}>John Doe</h6>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">has successfully completed the event management course</p>
                            
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded border flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-300 rounded grid grid-cols-2 gap-0.5">
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Verify authenticity</p>
                          </div>
                          
                          <div className="text-center border-t border-orange-200 pt-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                              <span>Date: {new Date().toLocaleDateString()}</span>
                              <span>ID: #EVT2024-001</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Director</div>
                                <div className="w-16 h-8 border-b border-gray-400 relative">
                                  <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" style={{
                                    clipPath: 'polygon(0% 100%, 20% 80%, 40% 90%, 60% 70%, 80% 85%, 100% 75%, 100% 100%, 0% 100%)'
                                  }}></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1" style={{
                                  fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>Sarah Johnson</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Verified</div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corner Decorative Elements */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-orange-400 rounded-full"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-orange-400 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-orange-400 rounded-full"></div>
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-orange-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Certificate 2 - Blue Professional with Top Green Banner */}
                    <div className="certificate-slide">
                      <div className="relative bg-white border-2 border-gray-300 rounded-3xl p-6 h-full overflow-hidden shadow-xl">
                        {/* Top Green Banner */}
                        <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-r from-green-600 to-green-800"></div>
                        <div className="absolute top-12 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-green-700"></div>
                        
                        {/* Decorative Border Pattern */}
                        <div className="absolute inset-2 border-2 border-blue-200 rounded-2xl"></div>
                        <div className="absolute inset-4 border border-blue-100 rounded-xl"></div>
                        
                        {/* Certificate Content */}
                        <div className="relative z-10 bg-white rounded-xl p-4 h-full flex flex-col justify-between mt-6">
                          <div className="text-center border-b-2 border-blue-200 pb-3">
                            <div className="text-3xl mb-1">🎓</div>
                            <h5 className="text-base font-bold text-gray-900 tracking-wide">CERTIFICATE OF ACHIEVEMENT</h5>
                            <p className="text-xs text-gray-600 font-medium">Digital Marketing Masterclass</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-center py-2">
                            <p className="text-gray-700 text-sm mb-1">This certifies that</p>
                            <h6 className="text-lg font-bold text-gray-900 mb-1" style={{
                              fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)',
                              letterSpacing: '0.5px'
                            }}>Emily Chen</h6>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">has successfully completed the digital marketing course</p>
                            
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded border flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-300 rounded grid grid-cols-2 gap-0.5">
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Verify authenticity</p>
                          </div>
                          
                          <div className="text-center border-t border-blue-200 pt-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                              <span>Date: {new Date().toLocaleDateString()}</span>
                              <span>ID: #DIG2024-002</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">CEO</div>
                                <div className="w-16 h-8 border-b border-gray-400 relative">
                                  <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" style={{
                                    clipPath: 'polygon(0% 100%, 15% 85%, 35% 75%, 55% 90%, 75% 70%, 100% 80%, 100% 100%, 0% 100%)'
                                  }}></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1" style={{
                                  fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>Michael Brown</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Verified</div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corner Decorative Elements */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-400 rounded-full"></div>
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Certificate 3 - Green Success with Right Purple Accent */}
                    <div className="certificate-slide">
                      <div className="relative bg-white border-2 border-gray-300 rounded-3xl p-6 h-full overflow-hidden shadow-xl">
                        {/* Right Purple Accent Background */}
                        <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-b from-purple-600 to-purple-800"></div>
                        <div className="absolute right-16 top-0 w-2 h-full bg-gradient-to-b from-purple-500 to-purple-700"></div>
                        
                        {/* Decorative Border Pattern */}
                        <div className="absolute inset-2 border-2 border-green-200 rounded-2xl"></div>
                        <div className="absolute inset-4 border border-green-100 rounded-xl"></div>
                        
                        {/* Certificate Content */}
                        <div className="relative z-10 bg-white rounded-xl p-4 h-full flex flex-col justify-between mr-4">
                          <div className="text-center border-b-2 border-green-200 pb-3">
                            <div className="text-3xl mb-1">🌟</div>
                            <h5 className="text-base font-bold text-gray-900 tracking-wide">CERTIFICATE OF EXCELLENCE</h5>
                            <p className="text-xs text-gray-600 font-medium">Leadership Development Program</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-center py-2">
                            <p className="text-gray-700 text-sm mb-1">This certifies that</p>
                            <h6 className="text-lg font-bold text-gray-900 mb-1" style={{
                              fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)',
                              letterSpacing: '0.5px'
                            }}>David Wilson</h6>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">has demonstrated exceptional leadership skills</p>
                            
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded border flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-300 rounded grid grid-cols-2 gap-0.5">
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Verify authenticity</p>
                          </div>
                          
                          <div className="text-center border-t border-green-200 pt-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                              <span>Date: {new Date().toLocaleDateString()}</span>
                              <span>ID: #LEAD2024-003</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">President</div>
                                <div className="w-16 h-8 border-b border-gray-400 relative">
                                  <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" style={{
                                    clipPath: 'polygon(0% 100%, 25% 75%, 45% 85%, 65% 70%, 85% 80%, 100% 75%, 100% 100%, 0% 100%)'
                                  }}></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1" style={{
                                  fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>Lisa Anderson</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Verified</div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corner Decorative Elements */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-green-400 rounded-full"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-green-400 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-green-400 rounded-full"></div>
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-green-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Certificate 4 - Purple Creative with Bottom Red Banner */}
                    <div className="certificate-slide">
                      <div className="relative bg-white border-2 border-gray-300 rounded-3xl p-6 h-full overflow-hidden shadow-xl">
                        {/* Bottom Red Banner */}
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-r from-red-600 to-red-800"></div>
                        <div className="absolute bottom-12 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-700"></div>
                        
                        {/* Decorative Border Pattern */}
                        <div className="absolute inset-2 border-2 border-purple-200 rounded-2xl"></div>
                        <div className="absolute inset-4 border border-purple-100 rounded-xl"></div>
                        
                        {/* Certificate Content */}
                        <div className="relative z-10 bg-white rounded-xl p-4 h-full flex flex-col justify-between mb-6">
                          <div className="text-center border-b-2 border-purple-200 pb-3">
                            <div className="text-3xl mb-1">🎨</div>
                            <h5 className="text-base font-bold text-gray-900 tracking-wide">CERTIFICATE OF CREATIVITY</h5>
                            <p className="text-xs text-gray-600 font-medium">Graphic Design Workshop</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-center py-2">
                            <p className="text-gray-700 text-sm mb-1">This certifies that</p>
                            <h6 className="text-lg font-bold text-gray-900 mb-1" style={{
                              fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)',
                              letterSpacing: '0.5px'
                            }}>Sophie Martinez</h6>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">has completed the graphic design program</p>
                            
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded border flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-300 rounded grid grid-cols-2 gap-0.5">
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Verify authenticity</p>
                          </div>
                          
                          <div className="text-center border-t border-purple-200 pt-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                              <span>Date: {new Date().toLocaleDateString()}</span>
                              <span>ID: #CREA2024-004</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Creative Director</div>
                                <div className="w-16 h-8 border-b border-gray-400 relative">
                                  <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" style={{
                                    clipPath: 'polygon(0% 100%, 30% 80%, 50% 70%, 70% 85%, 90% 75%, 100% 80%, 100% 100%, 0% 100%)'
                                  }}></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1" style={{
                                  fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>Alex Thompson</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Verified</div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corner Decorative Elements */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-purple-400 rounded-full"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-purple-400 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-400 rounded-full"></div>
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-purple-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Certificate 5 - Red Achievement with Diagonal Accent */}
                    <div className="certificate-slide">
                      <div className="relative bg-white border-2 border-gray-300 rounded-3xl p-6 h-full overflow-hidden shadow-xl">
                        {/* Diagonal Accent Background */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-orange-50 to-transparent"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-800 transform rotate-45 -translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-800 transform rotate-45 translate-x-10 translate-y-10"></div>
                        
                        {/* Decorative Border Pattern */}
                        <div className="absolute inset-2 border-2 border-red-200 rounded-2xl"></div>
                        <div className="absolute inset-4 border border-red-100 rounded-xl"></div>
                        
                        {/* Certificate Content */}
                        <div className="relative z-10 bg-white rounded-xl p-4 h-full flex flex-col justify-between">
                          <div className="text-center border-b-2 border-red-200 pb-3">
                            <div className="text-3xl mb-1">🔥</div>
                            <h5 className="text-base font-bold text-gray-900 tracking-wide">CERTIFICATE OF MASTERY</h5>
                            <p className="text-xs text-gray-600 font-medium">Advanced Programming Bootcamp</p>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-center py-2">
                            <p className="text-gray-700 text-sm mb-1">This certifies that</p>
                            <h6 className="text-lg font-bold text-gray-900 mb-1" style={{
                              fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)',
                              letterSpacing: '0.5px'
                            }}>Ryan Kim</h6>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">has mastered advanced programming concepts</p>
                            
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded border flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-300 rounded grid grid-cols-2 gap-0.5">
                                <div className="bg-gray-600 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-400 rounded-sm"></div>
                                <div className="bg-gray-600 rounded-sm"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Verify authenticity</p>
                          </div>
                          
                          <div className="text-center border-t border-red-200 pt-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                              <span>Date: {new Date().toLocaleDateString()}</span>
                              <span>ID: #PROG2024-005</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">CTO</div>
                                <div className="w-16 h-8 border-b border-gray-400 relative">
                                  <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" style={{
                                    clipPath: 'polygon(0% 100%, 20% 85%, 40% 75%, 60% 90%, 80% 70%, 100% 85%, 100% 100%, 0% 100%)'
                                  }}></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1" style={{
                                  fontFamily: "'Brush Script MT', cursive, 'Dancing Script', cursive",
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>Jennifer Lee</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Verified</div>
                                <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Corner Decorative Elements */}
                        <div className="absolute top-2 left-2 w-1 h-1 bg-red-400 rounded-full"></div>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-red-400 rounded-full"></div>
                        <div className="absolute bottom-2 right-2 w-1 h-1 bg-red-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Carousel Navigation Dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <button className="certificate-dot active w-2 h-2 bg-orange-500 rounded-full transition-all duration-300"></button>
                    <button className="certificate-dot w-2 h-2 bg-gray-300 rounded-full transition-all duration-300"></button>
                    <button className="certificate-dot w-2 h-2 bg-gray-300 rounded-full transition-all duration-300"></button>
                    <button className="certificate-dot w-2 h-2 bg-gray-300 rounded-full transition-all duration-300"></button>
                    <button className="certificate-dot w-2 h-2 bg-gray-300 rounded-full transition-all duration-300"></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Combined Stats & CTA Section with SVG Diagonal Split */}
      <div className="relative overflow-hidden min-h-[600px] snap-section-cta">
        {/* SVG Background with Diagonal Split */}
        <div className="absolute inset-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f9fafb" />
              </linearGradient>
              <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="50%" stopColor="#374151" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
            </defs>
            
            {/* Left Side - White Background */}
            <path d="M 0 0 L 700 0 L 500 600 L 0 600 Z" fill="url(#whiteGradient)" />
            
            {/* Right Side - Dark Background */}
            <path d="M 700 0 L 1200 0 L 1200 600 L 500 600 Z" fill="url(#darkGradient)" />
          </svg>
        </div>
        
        {/* Content Container - Flex Layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-stretch justify-between min-h-[600px] gap-0">
          {/* Left Side - Stats */}
          <div className="flex items-center justify-center lg:justify-start w-full lg:w-1/2 p-4 sm:p-8 lg:p-16">
            <div className="stats-section w-full max-w-lg">
              <div className="mb-8">
                <h3 className="text-3xl font-light text-gray-900 mb-4">Dipercaya oleh Tim di Seluruh Dunia</h3>
                <p className="text-gray-600 font-light">
                  Ribuan organisasi telah mempercayai platform kami untuk mengelola event mereka
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2 counter" data-target="500">0</div>
                  <div className="text-gray-600">Event Dibuat</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2 counter" data-target="10">0</div>
                  <div className="text-gray-600">Peserta Dikelola</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2 counter" data-target="99.9">0</div>
                  <div className="text-gray-600">Uptime Garansi</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2 counter" data-target="150">0</div>
                  <div className="text-gray-600">Negara Dilayani</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - CTA */}
          <div className="flex items-center lg:items-end justify-center lg:justify-end w-full lg:w-1/2 p-4 sm:p-8 lg:p-16 relative">
            {/* Floating Elements for Visual Interest */}
            <div className="absolute top-10 right-4 sm:right-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-bounce"></div>
            <div className="absolute bottom-20 right-4 sm:right-20 w-16 h-16 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-green-500/20 rounded-full blur-md animate-ping"></div>
            
            {/* Content - Right aligned on desktop, centered on mobile */}
            <div className="text-white w-full lg:max-w-lg text-center lg:text-right relative z-10 space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight">
                  Siap Memulai Event Pertama Anda?
                </h3>
                <p className="text-gray-200 text-sm sm:text-base lg:text-lg font-light leading-relaxed">
                  Daftar sekarang dan nikmati kemudahan mengelola event profesional. Gratis selamanya, tanpa biaya setup.
                </p>
              </div>
              
              {/* Features List - Right aligned on desktop */}
              <div className="space-y-3 mb-6 flex flex-col items-center lg:items-end">
                <div className="flex items-center text-sm lg:text-base text-gray-200 hover:text-white transition-colors duration-200 lg:flex-row-reverse">
                  <span className="w-2 h-2 bg-green-400 rounded-full lg:ml-3 lg:mr-0 mr-3 flex-shrink-0"></span>
                  <span>Event tak terbatas</span>
                </div>
                <div className="flex items-center text-sm lg:text-base text-gray-200 hover:text-white transition-colors duration-200 lg:flex-row-reverse">
                  <span className="w-2 h-2 bg-green-400 rounded-full lg:ml-3 lg:mr-0 mr-3 flex-shrink-0"></span>
                  <span>Analytics real-time</span>
                </div>
                <div className="flex items-center text-sm lg:text-base text-gray-200 hover:text-white transition-colors duration-200 lg:flex-row-reverse">
                  <span className="w-2 h-2 bg-green-400 rounded-full lg:ml-3 lg:mr-0 mr-3 flex-shrink-0"></span>
                  <span>Support 24/7</span>
                </div>
                <div className="flex items-center text-sm lg:text-base text-gray-200 hover:text-white transition-colors duration-200 lg:flex-row-reverse">
                  <span className="w-2 h-2 bg-green-400 rounded-full lg:ml-3 lg:mr-0 mr-3 flex-shrink-0"></span>
                  <span>Branding kustom</span>
                </div>
              </div>
              
              {/* Action Buttons - Right aligned on desktop, centered on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
                <Link href="/register" className="inline-block">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 lg:px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 hover:shadow-blue-500/25">
                    Mulai Sekarang - Gratis
                  </Button>
                </Link>
                <Link href="/pricing" className="inline-block">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 lg:px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105">
                    Lihat Pricing
                  </Button>
                </Link>
                <Link href="/contact" className="inline-block">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 lg:px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:scale-105">
                    Hubungi Tim
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Logo Slider */}
      <div className="py-16">
        <div className="text-center mb-8">
          <h4 className="text-lg font-light text-gray-700 mb-2">Dipercaya oleh Perusahaan Terkemuka</h4>
          <p className="text-gray-500 text-sm font-light">Ribuan organisasi telah mempercayai platform kami</p>
        </div>
        <div className="company-slider-container">
                      <div className="company-slider">
              {/* Google */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiGoogle className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              
              {/* Microsoft */}
              <div className="company-slide">
                <div className="company-logo">
                  <FaMicrosoft className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              {/* Apple */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiApple className="w-12 h-12 text-gray-800" />
                </div>
              </div>
              
              {/* Amazon */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiAmazon className="w-12 h-12 text-orange-500" />
                </div>
              </div>
              
              {/* Meta */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiMeta className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              {/* Netflix */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiNetflix className="w-12 h-12 text-red-600" />
                </div>
              </div>
              
              {/* Spotify */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiSpotify className="w-12 h-12 text-green-500" />
                </div>
              </div>
              
              {/* Tesla */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiTesla className="w-12 h-12 text-red-500" />
                </div>
              </div>
              
              {/* IBM */}
              <div className="company-slide">
                <div className="company-logo">
                  <FaBuilding className="w-12 h-12 text-blue-700" />
                </div>
              </div>
              
              {/* Adobe */}
              <div className="company-slide">
                <div className="company-logo">
                  <SiAdobe className="w-12 h-12 text-red-600" />
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-24 snap-section">
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
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="socialContainer containerOne" style={{ textDecoration: 'none' }}>
                  <svg className="socialSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="socialContainer containerTwo" style={{ textDecoration: 'none' }}>
                  <svg className="socialSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="socialContainer containerThree" style={{ textDecoration: 'none' }}>
                  <svg className="socialSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="socialContainer containerFour" style={{ textDecoration: 'none' }}>
                  <svg className="socialSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    </div>
      </div>
    </>
  )
}