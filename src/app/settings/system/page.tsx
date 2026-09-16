import { redirect } from 'next/navigation'
import { canAccessAdminApp, getSession } from '@/lib/auth'
import SystemSettings from '@/components/settings/SystemSettings'

export default async function SystemSettingsPage() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/settings/system')
  return <SystemSettings />
}
