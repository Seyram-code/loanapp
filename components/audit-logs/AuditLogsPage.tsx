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

  return <main className="directory-page"><header className="directory-header"><div><Link href="/dashboard" className="back-link">Dashboard</Link><p className="eyebrow">Security and accountability</p><h1>Audit logs</h1><p className="settings-copy">Review administrative actions recorded across the lending workspace.</p></div></header><section className="directory-panel panel">{loading ? <div className="directory-empty">Loading audit logs...</div> : data?.logs.length ? <div className="users-table"><div className="user-row user-header" aria-label="Audit log table headers"><span>Action</span><span>Details</span><span>Performed by</span><span>Date &amp; Time</span></div>{data.logs.map((log) => <div className="user-row" key={log.id}><span>{log.action.replaceAll('_', ' ')}</span><div><strong>{log.description}</strong><small>{log.entity}{log.entityId ? ` · ${log.entityId}` : ''}</small></div><span>{log.user.name}</span><span>{formatDate(log.createdAt)}</span></div>)}</div> : <div className="directory-empty">No audit logs found.</div>}{data ? <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} /> : null}</section></main>
}
