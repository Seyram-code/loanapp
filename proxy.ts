import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRole, isRole } from './lib/roles'
import { isSameOrigin } from './lib/csrf'

const authSecret = process.env.AUTH_SECRET
if (!authSecret) throw new Error('AUTH_SECRET must be configured')
const secret = new TextEncoder().encode(authSecret)

export async function proxy(request: NextRequest) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !request.nextUrl.pathname.startsWith('/api/auth/login')) {
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const token = request.cookies.get('lendgh_session')?.value
  if (!token) return redirectToLogin(request)

  try {
    const { payload } = await jwtVerify(token, secret)
    if (typeof payload.userId !== 'string' || !isRole(payload.role) || !isAdminRole(payload.role)) return redirectToLogin(request)
    return NextResponse.next()
  } catch {
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
}
