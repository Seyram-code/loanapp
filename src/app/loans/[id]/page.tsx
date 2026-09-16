import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoanDetails from '@/components/loans/LoanDetails'

export default async function LoanDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/loans')
  const { id } = await params
  return <LoanDetails id={id} />
}
