import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RepaymentsPage from '@/components/repayments/RepaymentsPage'

export default async function RepaymentsRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/repayments')
  return <RepaymentsPage />
}
