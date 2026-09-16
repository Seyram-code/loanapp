import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NotificationsPage from '@/components/notifications/NotificationsPage'

export default async function NotificationsRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/notifications')
  return <NotificationsPage />
}
