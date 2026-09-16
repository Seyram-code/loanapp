import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ReportsPage from '@/components/reports/ReportsPage'

export default async function ReportsRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/reports')
  return <ReportsPage />
}
