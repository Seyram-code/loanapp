import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getSystemSettings, updateSystemSettings } from '@/services/system-setting-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requirePermission('settings.manage')
    return NextResponse.json(await getSystemSettings())
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/settings/system')
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requirePermission('settings.manage')
    return NextResponse.json(await updateSystemSettings(await request.json(), session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'PATCH /api/settings/system')
  }
}
