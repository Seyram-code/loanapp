import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('customers.manage')
    const { id } = await context.params
    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ customer: { ...customer, monthlyIncome: customer.monthlyIncome?.toFixed(2) ?? null } })
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/customers/[id]/details')
  }
}
