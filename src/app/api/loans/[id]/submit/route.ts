import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { submitLoan } from '@/services/loan-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('loans.create')
    const { id } = await context.params
    return NextResponse.json(await submitLoan(id, session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans/[id]/submit')
  }
}
