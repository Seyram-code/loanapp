import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateAdminUser } from '@/services/admin-user-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    const { id } = await context.params
    return NextResponse.json(await updateAdminUser(id, await request.json(), session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'PATCH /api/users/[id]')
  }
}
