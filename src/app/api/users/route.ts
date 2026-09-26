import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminUser, listAdminUsers } from '@/services/admin-user-service'
import { safeErrorResponse } from '@/utils/api-response'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    return NextResponse.json(await listAdminUsers(Number(url.searchParams.get('page') ?? 1), Number(url.searchParams.get('pageSize') ?? 10)))
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/users')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    return NextResponse.json(await createAdminUser(await request.json(), session.userId), { status: 201 })
  } catch (error) {
    return safeErrorResponse(error, 'POST /api/users')
  }
}
