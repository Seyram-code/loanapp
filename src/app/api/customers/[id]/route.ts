import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getCustomerProfile } from '@/services/customer-profile-service'
import { updateCustomer, updateCustomerStatus } from '@/services/customer-service'
import { customerCreateSchema } from '@/schemas/customer'
import { safeErrorResponse } from '@/utils/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('customers.manage')
    const { id } = await context.params
    const customer = await getCustomerProfile(id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json(customer)
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/customers/[id]')
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('customers.manage')
    const { id } = await context.params
    const body = await request.json()
    if (Object.keys(body).length === 1 && body.status) {
      const status = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) }).parse(body).status
      return NextResponse.json(await updateCustomerStatus(id, status, session.userId))
    }
    return NextResponse.json(await updateCustomer(id, customerCreateSchema.partial().parse(body), session.userId))
  } catch (error) { return safeErrorResponse(error, 'PATCH /api/customers/[id]') }
}