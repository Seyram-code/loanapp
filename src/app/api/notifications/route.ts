import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { clearReadNotifications, listNotifications } from '@/services/notification-service'
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await requirePermission('notifications.read')
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'
    return NextResponse.json(await listNotifications(session.userId, unreadOnly, Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 10)))
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return forbiddenResponse()
    return unauthorizedResponse()
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePermission('notifications.manage')
    const action = new URL(request.url).searchParams.get('action')
    if (action !== 'clear-read') return badRequestResponse('Only read notifications can be cleared')
    await clearReadNotifications(session.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return forbiddenResponse()
    return unauthorizedResponse()
  }
}
