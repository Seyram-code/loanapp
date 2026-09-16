import { ArrowUpRight, BadgeCheck, FileText, HandCoins, UserRoundPlus, WalletCards } from 'lucide-react'
import type { DashboardStats } from '../../hooks/use-dashboard-stats'
import { formatDateTime } from '@/utils/date-format'

type RecentActivityProps = { activity: DashboardStats['activity']; loading?: boolean }

const actionPalette = {
  blue: '#6e9bb3',
  gold: '#dcae36',
  mint: '#69a28f',
  coral: '#d99382',
}

function normalizeAction(action: string) {
  const value = action.toUpperCase().replace(/_/g, ' ').trim()
  if (value.includes('REPAYMENT')) return 'Repayment Recorded'
  if (value.includes('DISBURSED')) return 'Loan Disbursed'
  if (value.includes('APPROVED')) return 'Loan Approved'
  if (value.includes('CUSTOMER')) return 'New Customer'
  if (value.includes('LOAN')) return 'Loan Application'
  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getActionMeta(action: string) {
  const normalized = normalizeAction(action)
  if (normalized === 'Repayment Recorded') return { icon: HandCoins, tone: actionPalette.mint }
  if (normalized === 'Loan Disbursed') return { icon: WalletCards, tone: actionPalette.blue }
  if (normalized === 'Loan Approved') return { icon: BadgeCheck, tone: actionPalette.blue }
  if (normalized === 'New Customer') return { icon: UserRoundPlus, tone: actionPalette.gold }
  return { icon: FileText, tone: actionPalette.coral }
}

export function RecentActivity({ activity, loading = false }: RecentActivityProps) {
  const rows = activity.length === 0 ? [] : activity.slice(0, 6)

  if (loading) {
    return <aside className="activity-panel panel dashboard-skeleton"><div className="section-header"><div><h2>Recent Activity</h2><p>Latest administrative actions.</p></div><button className="activity-view-all" type="button">View All <ArrowUpRight size={14} /></button></div><div className="activity-table-wrap"><table className="activity-table"><thead><tr><th>Action</th><th>Details</th><th>Performed By</th><th>Date &amp; Time</th></tr></thead><tbody>{Array.from({ length: 4 }).map((_, index) => <tr key={`activity-skeleton-${index}`}><td><div className="activity-action-cell"><span className="activity-skeleton-icon" /><span className="skeleton-line medium" /></div></td><td><div className="activity-detail"><span className="skeleton-line short" /><span className="skeleton-line medium" /></div></td><td><span className="skeleton-line short" /></td><td><span className="skeleton-line short" /></td></tr>)}</tbody></table></div></aside>
  }

  return <aside className="activity-panel panel dashboard-content-ready"><div className="section-header"><div><h2>Recent Activity</h2><p>Latest administrative actions.</p></div><button className="activity-view-all" type="button">View All <ArrowUpRight size={14} /></button></div>{rows.length === 0 ? <div className="activity-empty"><strong>No recent activity</strong><span>Loan, repayment, and account events will appear here as your team works.</span></div> : <div className="activity-table-wrap"><table className="activity-table"><thead><tr><th>Action</th><th>Details</th><th>Performed By</th><th>Date &amp; Time</th></tr></thead><tbody>{rows.map((item, index) => {
  const actionName = normalizeAction(item.action)
  const meta = getActionMeta(item.action)
  const Icon = meta.icon
  return <tr key={`${item.date}-${index}`}>
    <td><div className="activity-action-cell"><span className="activity-icon" style={{ background: `${meta.tone}1A`, color: meta.tone, borderColor: `${meta.tone}33` }}><Icon size={12} /></span><span>{actionName}</span></div></td>
    <td><div className="activity-detail"><strong>{item.related}</strong><small>{item.description || 'Activity recorded from the platform.'}</small></div></td>
    <td><span className="activity-admin">{item.admin}</span></td>
    <td><time className="activity-date">{formatDateTime(item.date)}</time></td>
  </tr>
})}</tbody></table></div>}</aside>
}
