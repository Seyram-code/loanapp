import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoansPage from '@/components/loans/LoansPage'

export default async function LoansRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/loans')
  return <LoansPage />
}
