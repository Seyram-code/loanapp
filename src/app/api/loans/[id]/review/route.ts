import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { startLoanReview } from '@/services/loan-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('loans.approve')
    const { id } = await context.params
    return NextResponse.json(await startLoanReview(id, session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans/[id]/review')
  }
}
