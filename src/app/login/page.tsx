import { canAccessAdminApp, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/login/LoginForm'

export default async function LoginPage() {
  const session = await getSession()
  if (canAccessAdminApp(session)) redirect('/dashboard')

  return <LoginForm />
}