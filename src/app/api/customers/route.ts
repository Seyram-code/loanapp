import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { createCustomer, searchCustomers } from '@/services/customer-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requirePermission('customers.manage')
    const url = new URL(request.url)
    return NextResponse.json(await searchCustomers({ query: url.searchParams.get('query') ?? undefined, status: (url.searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null) ?? undefined, sort: url.searchParams.get('sort') ?? undefined, direction: (url.searchParams.get('direction') as 'asc' | 'desc' | null) ?? undefined, page: Number(url.searchParams.get('page') ?? 1), pageSize: Number(url.searchParams.get('pageSize') ?? 10) }))
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/customers')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('customers.manage')
    const customer = await createCustomer(await request.json(), session.userId)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/customers')
  }
}