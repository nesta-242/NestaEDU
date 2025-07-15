import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-auth'

// Simple JWT verification without database access (for Edge Runtime)
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Handle API routes that need authentication
  if (request.nextUrl.pathname.startsWith('/api/user/profile') || 
      request.nextUrl.pathname.startsWith('/api/chat-sessions') ||
      request.nextUrl.pathname.startsWith('/api/exam-results') ||
      request.nextUrl.pathname.startsWith('/api/grade-exam') ||
      request.nextUrl.pathname.startsWith('/api/test-avatar') ||
      request.nextUrl.pathname.startsWith('/api/debug-avatar') ||
      request.nextUrl.pathname.startsWith('/api/test-me')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify token
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add user info to headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Handle student pages
  if (request.nextUrl.pathname.startsWith('/student/')) {
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token
    const user = await verifyToken(token)
    if (!user) {
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }

    // Add user info to headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/student/:path*',
    '/api/chat',
    '/api/chat-sessions',
    '/api/chat-sessions/:path*',
    '/api/exam-results',
    '/api/exam-results/:path*',
    '/api/generate-exam',
    '/api/grade-exam',
    '/api/user/profile',
    '/api/test-avatar',
    '/api/debug-avatar',
    '/api/test-me',
  ],
} 