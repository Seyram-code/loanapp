'use client'

import { ArrowUpRight, BellRing, CheckCircle2, CircleDollarSign, CreditCard, TriangleAlert, UserRoundPlus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/utils/date-format'

type Notification = { id: string; title: string; message: string; type: string; createdAt: string }

const icons = {
  LOAN: CreditCard,
  REPAYMENT: CircleDollarSign,
  SUCCESS: CheckCircle2,
  INFO: BellRing,
  CUSTOMER: UserRoundPlus,
  WARNING: TriangleAlert,
}

function getNotificationTitle(title: string, type: string) {
  const normalized = `${title} ${type}`.toLowerCase()
  if (normalized.includes('repayment')) return 'Repayment Received'
  if (normalized.includes('disbursement') || normalized.includes('disbursed')) return 'Loan Disbursed'
  if (normalized.includes('approved')) return 'Loan Approved'
  if (normalized.includes('customer')) return 'New Customer'
  if (normalized.includes('overdue')) return 'Payment Overdue'
  if (normalized.includes('loan')) return 'Loan Update'
  return title || 'Notification'
}

type DashboardNotificationsProps = { loading?: boolean }

export function DashboardNotifications({ loading = false }: DashboardNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/notifications?page=1&pageSize=5')
      .then((response) => response.ok ? response.json() : null)
      .then((data: { notifications?: Notification[] } | null) => {
        setNotifications(data?.notifications ?? [])
        setIsLoading(false)
      })
      .catch(() => {
        setNotifications([])
        setIsLoading(false)
      })
  }, [])

  if (loading || isLoading) {
    return <article className="dashboard-notifications panel dashboard-skeleton"><div className="section-header"><div><h2>Recent Notifications</h2><p>Latest updates from your workspace.</p></div><Link href="/notifications" className="activity-view-all">View All <ArrowUpRight size={14} /></Link></div><div className="dashboard-notification-list">{Array.from({ length: 4 }).map((_, index) => <div className="dashboard-notification-skeleton" key={`notification-skeleton-${index}`}><span className="skeleton-icon" /><div className="dashboard-notification-copy"><span className="skeleton-line short" /><span className="skeleton-line medium" /></div><span className="skeleton-line tiny" /></div>)}</div></article>
  }

  return <article className="dashboard-notifications panel dashboard-content-ready"><div className="section-header"><div><h2>Recent Notifications</h2><p>Latest updates from your workspace.</p></div><Link href="/notifications" className="activity-view-all">View All <ArrowUpRight size={14} /></Link></div><div className="dashboard-notification-list">{notifications.length ? notifications.map((notification) => { const Icon = icons[(notification.type || 'INFO').toUpperCase() as keyof typeof icons] ?? BellRing; const typeClass = (notification.type || 'info').toLowerCase(); const displayTitle = getNotificationTitle(notification.title, notification.type); return <div className="dashboard-notification" key={notification.id}><span className={`dashboard-notification-icon ${typeClass}`}><Icon size={15} /></span><div className="dashboard-notification-copy"><strong>{displayTitle}</strong><p>{notification.message}</p></div><time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time></div> }) : <div className="activity-empty"><strong>No recent notifications</strong><span>Loan, repayment, and system updates will appear here.</span></div>}</div></article>
}
