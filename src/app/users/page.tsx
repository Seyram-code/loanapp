import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import UsersPage from '@/components/users/UsersPage'

export default async function UsersRoute() {
  await requireAdmin().catch(() => redirect('/login?next=/users'))
  return <UsersPage />
}
