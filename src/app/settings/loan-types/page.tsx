import { redirect } from 'next/navigation'
import { canAccessAdminApp, getSession } from '@/lib/auth'
import LoanTypeSettings from '@/components/settings/LoanTypeSettings'

export default async function LoanTypesSettingsPage() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/settings/loan-types')
  return <LoanTypeSettings />
}
