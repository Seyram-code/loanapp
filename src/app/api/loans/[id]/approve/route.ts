import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/authorization'
import { approveLoan } from '@/services/loan-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'
const approvalSchema = z.object({ approvedAmount: z.number().positive() })

async function approve(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('loans.approve')
    const { id } = await context.params
    const payload = await request.json().catch(() => ({}))
    const approvedAmount = payload.approvedAmount
    if (approvedAmount !== undefined && approvedAmount !== null) approvalSchema.parse({ approvedAmount })
    return NextResponse.json(await approveLoan(id, approvedAmount, session.userId))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans/[id]/approve')
  }
}

export const POST = approve
export const PATCH = approve
