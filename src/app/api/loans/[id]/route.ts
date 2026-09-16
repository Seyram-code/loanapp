import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getLoanById } from '@/services/loan-service'
import { unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('loans.read')
    const { id } = await context.params
    const loan = await getLoanById(id)
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    return NextResponse.json(loan)
  } catch {
    return unauthorizedResponse()
  }
}
