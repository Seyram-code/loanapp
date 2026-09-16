import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CustomerProfile from '@/components/customers/CustomerProfile'

export default async function CustomerProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!canAccessAdminApp(session)) redirect('/login?next=/customers')
  const { id } = await params
  return <CustomerProfile id={id} />
}
