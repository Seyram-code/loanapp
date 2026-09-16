import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { createRepayment, listRepayments } from '@/services/repayment-service'
import { safeErrorResponse, unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requirePermission('repayments.manage')
    const url = new URL(request.url)
    return NextResponse.json(await listRepayments({
      query: url.searchParams.get('query') ?? undefined,
      paymentMethod: url.searchParams.get('paymentMethod') ?? undefined,
      startDate: url.searchParams.get('startDate') ?? undefined,
      endDate: url.searchParams.get('endDate') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }))
  } catch {
    return unauthorizedResponse()
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('repayments.manage')
    return NextResponse.json(await createRepayment(await request.json(), session.userId), { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/repayments')
  }
}
