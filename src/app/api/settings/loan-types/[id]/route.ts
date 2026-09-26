import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { updateLoanType } from '@/services/loan-type-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('settings.manage')
    const { id } = await context.params
    return NextResponse.json(await updateLoanType(id, await request.json(), session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'PATCH /api/settings/loan-types/[id]')
  }
}
