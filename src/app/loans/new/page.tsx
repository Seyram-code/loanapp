import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateLoan from '@/components/loans/CreateLoanForm'

export default async function CreateLoanRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/loans/new')
  return <CreateLoan />
}
