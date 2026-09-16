import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { createLoan, searchLoans } from '@/services/loan-service'
import { safeErrorResponse, unauthorizedResponse } from '@/utils/api-response'

export async function GET(request: Request) {
  try {
    await requirePermission('loans.read')
    const url = new URL(request.url)
    return NextResponse.json(await searchLoans({ query: url.searchParams.get('query') ?? undefined, status: url.searchParams.get('status') ?? undefined, loanTypeId: url.searchParams.get('loanTypeId') ?? undefined, startDate: url.searchParams.get('startDate') ?? undefined, endDate: url.searchParams.get('endDate') ?? undefined, sort: url.searchParams.get('sort') ?? undefined, direction: (url.searchParams.get('direction') as 'asc' | 'desc' | null) ?? undefined, page: Number(url.searchParams.get('page') ?? 1), pageSize: Number(url.searchParams.get('pageSize') ?? 10) }))
  } catch {
    return unauthorizedResponse()
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('loans.create')
    const loan = await createLoan(await request.json(), session.userId)
    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/loans')
  }
}
