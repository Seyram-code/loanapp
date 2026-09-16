import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/csrf'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await clearSession()
  return NextResponse.json({ success: true })
}