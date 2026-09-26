import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getDashboardStats } from '@/services/dashboard-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requirePermission('loans.read')
    return NextResponse.json(await getDashboardStats())
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/dashboard/stats')
  }
}
