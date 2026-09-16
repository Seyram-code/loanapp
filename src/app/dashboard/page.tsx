import DashboardContent from '@/components/dashboard/DashboardPage'
import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatLongDate } from '@/utils/date-format'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || !canAccessAdminApp(session)) redirect('/login?next=/dashboard')
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
  return <DashboardContent userName={user?.name ?? 'Administrator'} currentDate={formatLongDate(new Date())} />
}