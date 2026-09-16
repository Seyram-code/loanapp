import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listAuditLogs } from '@/services/audit-log-service'
import { forbiddenResponse, unauthorizedResponse } from '@/utils/api-response'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    return NextResponse.json(await listAuditLogs(Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 10)))
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse()
    return forbiddenResponse()
  }
}
