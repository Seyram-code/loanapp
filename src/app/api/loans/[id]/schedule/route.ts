import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { listRepaymentSchedule } from '@/services/repayment-schedule-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('loan_schedules.read')
    const { id } = await context.params
    return NextResponse.json(await listRepaymentSchedule(id))
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/loans/[id]/schedule')
  }
}
