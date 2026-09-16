import { redirect } from 'next/navigation'
import AuditLogsPage from '@/components/audit-logs/AuditLogsPage'
import { requireAdmin } from '@/lib/auth'

export default async function AuditLogsRoute() {
  await requireAdmin().catch(() => redirect('/login?next=/audit-logs'))
  return <AuditLogsPage />
}
