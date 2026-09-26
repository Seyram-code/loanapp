import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getCustomerProfile } from '@/services/customer-profile-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requirePermission('customers.manage'); const { id } = await context.params; const profile = await getCustomerProfile(id); if (!profile) return NextResponse.json({ error: 'Customer not found' }, { status: 404 }); return NextResponse.json(profile) } catch (error) { return safeErrorResponse(error, 'GET /api/customers/[id]/profile') }
}
