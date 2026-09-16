import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { hasAnyRole, isAdminRole, isRole, type Role } from './roles'
import { prisma } from './prisma'

export type Session = { userId: string; role: Role }
const authSecret = process.env.AUTH_SECRET
if (!authSecret) throw new Error('AUTH_SECRET must be configured')
const secret = new TextEncoder().encode(authSecret)
const cookieName = 'lendgh_session'

export async function createSession(session: Session) {
  const token = await new SignJWT(session).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret)
  const cookieStore = await cookies()
  cookieStore.set(cookieName, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8, path: '/', priority: 'high' })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set(cookieName, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', expires: new Date(0), path: '/', priority: 'high' })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    if (typeof payload.userId !== 'string' || !isRole(payload.role)) return null
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true, status: true } })
    if (!user || user.status !== 'ACTIVE' || user.role !== payload.role) return null
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export async function requireAdmin() {
  return requireRoles('SUPER_ADMIN', 'ADMIN')
}

export async function requireRoles(...allowedRoles: Role[]) {
  const session = await getSession()
  if (!session || !hasAnyRole(session.role, allowedRoles)) throw new Error('Unauthorized')
  return session
}

export function canAccessAdminApp(session: Session | null) {
  return session !== null && isAdminRole(session.role)
}
