'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Pagination } from '@/components/Pagination'
import { formatDateTime } from '@/utils/date-format'

type AuditLog = { id: string; action: string; entity: string; entityId: string | null; description: string; createdAt: string; user: { name: string; email: string } }
type AuditResponse = { logs: AuditLog[]; total: number; page: number; pageSize: number; totalPages: number }
const formatDate = formatDateTime


export default function AuditLogsPage() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const response = await fetch(`/api/audit-logs?page=${page}&pageSize=${pageSize}`)
    if (response.ok) setData(await response.json())
    setLoading(false)
  }, [page, pageSize])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  return <main className="directory-page"><header className="directory-header"><div><Link href="/dashboard" className="back-link">Dashboard</Link><p className="eyebrow">Security and accountability</p><h1>Audit logs</h1><p className="settings-copy">Review administrative actions recorded across the lending workspace.</p></div></header><section className="directory-panel panel"><div className="users-table">{loading ? <div className="directory-empty">Loading audit logs...</div> : data?.logs.length ? data.logs.map((log) => <div className="user-row" key={log.id}><div><strong>{log.description}</strong><small>{log.action.replaceAll('_', ' ')} · {log.entity}</small></div><span>{log.user.name}</span><span>{formatDate(log.createdAt)}</span></div>) : <div className="directory-empty">No audit logs found.</div>}</div>{data ? <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} /> : null}</section></main>
}
