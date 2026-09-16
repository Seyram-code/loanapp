import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import SettingsPage from '@/components/settings/SettingsPage'

export default async function SettingsRoute() {
  await requireAdmin().catch(() => redirect('/login?next=/settings'))
  return <SettingsPage />
}
