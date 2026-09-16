import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { markNotificationRead } from '@/services/notification-service'
import { unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('notifications.manage')
    const { id } = await context.params
    await markNotificationRead(session.userId, id)
    return NextResponse.json({ success: true })
  } catch {
    return unauthorizedResponse()
  }
}
