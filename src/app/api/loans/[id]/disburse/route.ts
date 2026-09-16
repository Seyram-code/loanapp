import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { disburseLoan } from '@/services/loan-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('loans.disburse')
    const { id } = await context.params
    const body = await request.json()
    return NextResponse.json(await disburseLoan(id, body, session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans/[id]/disburse')
  }
}
