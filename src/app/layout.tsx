import type { Metadata } from 'next'
import './globals.css'
import './index.css'
import './App.css'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { AdminShell } from '@/components/dashboard/AdminShell'
import { canAccessAdminApp, getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Next requires route metadata to be exported from the layout module.
// oxlint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: 'lendgh | Loan operations',
  description: 'Admin-only loan management workspace.',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()
  const user = session && canAccessAdminApp(session) ? await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }) : null

  return <html lang="en"><body><ToastProvider>{user && session ? <AdminShell userName={user.name ?? 'Administrator'} userRole={session.role}>{children}</AdminShell> : children}</ToastProvider></body></html>
}
