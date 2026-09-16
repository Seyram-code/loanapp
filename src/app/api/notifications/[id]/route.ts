import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { deleteNotification, markNotificationRead } from '@/services/notification-service'
import { forbiddenResponse, unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('notifications.manage')
    const { id } = await context.params
    await markNotificationRead(session.userId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return forbiddenResponse()
    return unauthorizedResponse()
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('notifications.manage')
    const { id } = await context.params
    await deleteNotification(session.userId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return forbiddenResponse()
    return unauthorizedResponse()
  }
}