import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { listLoanTypes } from '@/services/loan-type-service'
import { unauthorizedResponse } from '@/utils/api-response'

export async function GET() {
  try {
    await requirePermission('loans.read')
    return NextResponse.json(await listLoanTypes())
  } catch {
    return unauthorizedResponse()
  }
}
