import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ErrorProvider } from '@/contexts/error-context'
import { ToastProvider } from '@/components/ui/toast'
import dynamic from 'next/dynamic'

// Lazy load SessionStatus (client-only, tidak critical)
const SessionStatus = dynamic(() => import('@/components/auth/session-status').then(mod => ({ default: mod.SessionStatus })), {
  ssr: false,
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Event Management System',
  description: 'Sistem manajemen event yang modern dan mudah digunakan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="referrer" content="unsafe-url" />
        <meta httpEquiv="Content-Security-Policy" content="frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; object-src 'none';" />
        {/* Optimized font loading - only preconnect, fonts loaded via next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Decorative fonts - lazy loaded only when needed to speed up initial compilation */}
        {process.env.NODE_ENV === 'production' && (
          <link 
            href="https://fonts.googleapis.com/css2?family=Ephesis:wght@400&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Berkshire+Swash&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Pacifico&family=Satisfy&family=Yellowtail&family=Amatic+SC:wght@400;700&family=Indie+Flower&family=Lobster&family=Righteous&family=Shadows+Into+Light&family=Special+Elite&display=swap" 
            rel="stylesheet" 
            media="print" 
            onLoad="this.media='all'; this.onload=null;" 
          />
        )}
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <ErrorProvider>
            <AuthProvider>
              {children}
              <SessionStatus />
            </AuthProvider>
          </ErrorProvider>
        </ToastProvider>
      </body>
    </html>
  )
}