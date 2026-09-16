'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from '@/components/Pagination'
import { useToast } from '@/components/ui/ToastProvider'
import { formatDateTime } from '@/utils/date-format'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

type NotificationResponse = { notifications: Notification[]; unreadCount: number; total: number; page: number; pageSize: number; totalPages: number }

const typeClass = (type: string) => type.toLowerCase()
const formatDate = (value: string) => formatDateTime(value)

export default function NotificationsPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<NotificationResponse>({ notifications: [], unreadCount: 0, total: 0, page: 1, pageSize: 10, totalPages: 0 })
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (unreadOnly) params.set('unread', 'true')
    const response = await fetch(`/api/notifications?${params}`)
    if (response.ok) setData(await response.json())
    else setError('Unable to load notifications.')
    setLoading(false)
  }, [unreadOnly, page, pageSize])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  async function markRead(id: string) {
    if (actionPending) return
    setActionPending(id)
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    showToast('Notification marked as read.')
    await load()
    setActionPending(null)
  }

  async function markAllRead() {
    if (actionPending) return
    setActionPending('all')
    await fetch('/api/notifications/read-all', { method: 'POST' })
    showToast('Notifications marked as read.')
    await load()
    setActionPending(null)
  }

  async function deleteOne(id: string) {
    if (actionPending) return
    const notification = data.notifications.find((item) => item.id === id)
    if (!window.confirm(`Delete notification${notification ? ` "${notification.title}"` : ''}? This cannot be undone.`)) return
    setActionPending(id)
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    showToast('Notification deleted.')
    await load()
    setActionPending(null)
  }

  async function clearRead() {
    if (actionPending) return
    if (!window.confirm('Clear all read notifications? This cannot be undone.')) return
    setActionPending('clear')
    await fetch('/api/notifications?action=clear-read', { method: 'DELETE' })
    showToast('Read notifications cleared.')
    await load()
    setActionPending(null)
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
          <p className="eyebrow">Workspace updates</p>
          <h1>Notifications</h1>
          <p className="settings-copy">Stay current on loan, repayment, and system activity.</p>
        </div>
        <div className="notification-actions">
          <button type="button" className="secondary-button" onClick={() => void markAllRead()} disabled={!data.unreadCount || Boolean(actionPending)}><CheckCheck size={16} /> {actionPending === 'all' ? 'Marking...' : 'Mark all read'}</button>
          <button type="button" className="secondary-button" onClick={() => void clearRead()} disabled={Boolean(actionPending)}><Trash2 size={16} /> {actionPending === 'clear' ? 'Clearing...' : 'Clear read'}</button>
        </div>
      </header>

      <section className="notifications-panel panel">
        <div className="notifications-toolbar">
          <button type="button" className={`notification-filter ${!unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(false); setPage(1) }}>All</button>
          <button type="button" className={`notification-filter ${unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(true); setPage(1) }}>Unread <span>{data.unreadCount}</span></button>
          <strong>{data.total} notifications</strong>
        </div>

        {error ? <div className="loan-warning"><strong>Notifications unavailable</strong><span>{error}</span></div> : null}
        {loading ? <div className="directory-empty">Loading notifications...</div> : data.notifications.length === 0 ? <div className="notifications-empty"><Bell size={24} /><strong>{unreadOnly ? 'You are all caught up.' : 'No notifications yet.'}</strong><span>{unreadOnly ? 'There are no unread updates waiting for you.' : 'Loan, repayment, and system updates will appear here.'}</span></div> : (
          <div className="notification-list">
            {data.notifications.map((notification) => (
              <article className={`notification-row ${notification.read ? 'read' : 'unread'}`} key={notification.id}>
                <div className={`notification-icon ${typeClass(notification.type)}`}><Bell size={17} /></div>
                <div className="notification-content"><div className="notification-title"><strong>{notification.title}</strong>{!notification.read ? <span className="unread-dot" aria-label="Unread" /> : null}</div><p>{notification.message}</p><time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time></div>
                <div className="notification-row-actions">
                  {!notification.read ? <button type="button" disabled={Boolean(actionPending)} onClick={() => void markRead(notification.id)} aria-label={`Mark ${notification.title} as read`} title="Mark as read">{actionPending === notification.id ? <span className="loading-spinner small" /> : <Check size={16} />}</button> : null}
                  <button type="button" disabled={Boolean(actionPending)} onClick={() => void deleteOne(notification.id)} aria-label={`Delete ${notification.title}`} title="Delete notification">{actionPending === notification.id ? <span className="loading-spinner small" /> : <Trash2 size={16} />}</button>
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} />
      </section>
    </main>
  )
}
