import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/authorization'
import { rejectLoan } from '@/services/loan-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

async function reject(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('loans.approve')
    const { id } = await context.params
    const payload = z.object({ rejectionReason: z.string().min(1).max(2000) }).parse(await request.json())
    return NextResponse.json(await rejectLoan(id, payload.rejectionReason, session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans/[id]/reject')
  }
}

export const POST = reject
export const PATCH = reject
