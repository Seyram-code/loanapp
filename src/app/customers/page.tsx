import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CustomersPage from '@/components/customers/CustomersPage'

export default async function CustomersRoute() {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/customers')
  return <CustomersPage />
}
