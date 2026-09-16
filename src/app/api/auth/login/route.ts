import { promisify } from 'node:util'
import { scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { isAdminRole } from '@/lib/roles'
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/rate-limit'

const scrypt = promisify(nodeScrypt)
export const runtime = 'nodejs'

async function verifyPassword(password: string, encodedHash: string) {
  const [salt, storedKey] = encodedHash.split(':')
  if (!salt || !storedKey) return false
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const expectedKey = Buffer.from(storedKey, 'hex')
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey)
}

export async function POST(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rateLimit = checkLoginRateLimit(ipAddress)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } })

  try {
    const input = loginSchema.parse(await request.json())
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user || user.status !== 'ACTIVE' || !isAdminRole(user.role) || !(await verifyPassword(input.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await createSession({ userId: user.id, role: user.role })
    clearLoginRateLimit(ipAddress)
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
