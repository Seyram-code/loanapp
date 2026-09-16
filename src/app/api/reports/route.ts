import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { getReports, reportsCsv } from '@/services/report-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requirePermission('loans.read')
    const url = new URL(request.url)
    const report = await getReports({
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      loanTypeId: url.searchParams.get('loanTypeId') || undefined,
      loanStatus: url.searchParams.get('loanStatus') || undefined,
    })

    if (url.searchParams.get('format') === 'csv') {
      return new Response(reportsCsv(report), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="lendgh-report.csv"',
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    return safeErrorResponse(error, 'GET /api/reports')
  }
}
