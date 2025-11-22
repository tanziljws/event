import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Fast path: Skip processing for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/galery') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Simple public route check - optimized for performance
  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/upgrade-business') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/404') ||
    pathname.startsWith('/not-found') ||
    pathname.startsWith('/cs-info')

  // All routes pass through - client-side handles auth
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (static uploads)
     * - galery (static gallery images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|galery|test).*)',
  ],
}
