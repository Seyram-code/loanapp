import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { createLoanType, listLoanTypes } from '@/services/loan-type-service'
import { unauthorizedResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requirePermission('settings.manage')
    return NextResponse.json(await listLoanTypes())
  } catch {
    return unauthorizedResponse()
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('settings.manage')
    return NextResponse.json(await createLoanType(await request.json(), session.userId), { status: 201 })
  } catch {
    return unauthorizedResponse()
  }
}
