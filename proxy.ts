import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/telegram/webhook']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow programmatic access via x-api-secret header
  const apiSecret = request.headers.get('x-api-secret')
  if (apiSecret && apiSecret === process.env.API_SECRET) {
    return NextResponse.next()
  }

  // Check auth cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token && await verifyAuthToken(token)) {
    return NextResponse.next()
  }

  // Redirect to login
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)'],
}
