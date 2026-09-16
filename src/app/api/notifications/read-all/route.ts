import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { markAllNotificationsRead } from '@/services/notification-service'
import { unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const session = await requirePermission('notifications.manage')
    await markAllNotificationsRead(session.userId)
    return NextResponse.json({ success: true })
  } catch {
    return unauthorizedResponse()
  }
}
