import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { createLoanType, listLoanTypes } from '@/services/loan-type-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requirePermission('settings.manage')
    return NextResponse.json(await listLoanTypes())
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/settings/loan-types')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('settings.manage')
    return NextResponse.json(await createLoanType(await request.json(), session.userId), { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/settings/loan-types')
  }
}
