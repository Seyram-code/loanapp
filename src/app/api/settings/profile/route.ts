import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAdminProfile, updateAdminProfile } from '@/services/admin-profile-service'
import { safeErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireAdmin()
    return NextResponse.json(await getAdminProfile(session.userId))
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse()
    return forbiddenResponse()
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin()
    return NextResponse.json(await updateAdminProfile(session.userId, await request.json()))
  } catch (error) {
    return safeErrorResponse(error, 'PATCH /api/settings/profile')
  }
}
