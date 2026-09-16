import { Banknote, CheckCircle2, Coins, FileClock, Hourglass, Landmark, UsersRound, UserRoundCheck, WalletCards, AlertTriangle, TrendingUp } from 'lucide-react'
import { MetricCard } from './MetricCard'
import type { DashboardStats } from '../../hooks/use-dashboard-stats'
import './dashboard-stats.css'

type DashboardStatsProps = { stats: DashboardStats | null; loading?: boolean }

const formatCurrency = (value?: string) => value ? `GHS ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...'

function SkeletonMetricCard() {
  return <div className="metric-card dashboard-skeleton-card"><div className="metric-top"><span className="skeleton-line short" /> <span className="skeleton-icon" /></div><div className="skeleton-line tall" /><div className="skeleton-line medium" /></div>
}

export function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const cards = [
    { title: 'Total customers', value: stats ? String(stats.totalCustomers) : '...', icon: <UsersRound size={18} />, line: 'blue-line', iconClass: 'blue-icon', change: '12%', negative: false },
    { title: 'Active customers', value: stats ? String(stats.activeCustomers) : '...', icon: <UserRoundCheck size={18} />, line: 'mint-line', iconClass: 'mint-icon', change: '8%', negative: false },
    { title: 'Total loans', value: stats ? String(stats.totalLoans) : '...', icon: <WalletCards size={18} />, line: 'gold-line', featured: true, change: '15%', negative: false },
    { title: 'Pending applications', value: stats ? String(stats.pendingApplications) : '...', icon: <FileClock size={18} />, line: 'coral-line', iconClass: 'coral-icon', change: '10%', negative: true },
    { title: 'Approved loans', value: stats ? String(stats.approvedLoans) : '...', icon: <CheckCircle2 size={18} />, line: 'mint-line', iconClass: 'mint-icon', change: '20%', negative: false },
    { title: 'Active loans', value: stats ? String(stats.activeLoans) : '...', icon: <Landmark size={18} />, line: 'blue-line', iconClass: 'blue-icon', change: '8%', negative: false },
    { title: 'Completed loans', value: stats ? String(stats.completedLoans) : '...', icon: <CheckCircle2 size={18} />, line: 'mint-line', iconClass: 'mint-icon', change: '18%', negative: false },
    { title: 'Overdue loans', value: stats ? String(stats.overdueLoans) : '...', icon: <AlertTriangle size={18} />, line: 'coral-line', iconClass: 'coral-icon', negative: true, change: '25%' },
  ]

  const financialCards = [
    { title: 'Total disbursed', value: stats ? formatCurrency(stats.totalDisbursed) : '...', icon: <Banknote size={18} />, line: 'gold-line', iconClass: 'gold-icon', change: '14%', negative: false },
    { title: 'Total repaid', value: stats ? formatCurrency(stats.totalRepaid) : '...', icon: <Coins size={18} />, line: 'mint-line', iconClass: 'mint-icon', change: '16%', negative: false },
    { title: 'Outstanding balance', value: stats ? formatCurrency(stats.outstandingBalance) : '...', icon: <Hourglass size={18} />, line: 'coral-line', iconClass: 'coral-icon', change: '12%', negative: false },
    { title: 'Interest profit', value: stats ? formatCurrency(stats.interestProfit) : '...', icon: <TrendingUp size={18} />, line: 'mint-line', iconClass: 'mint-icon', change: '', negative: false },
  ]

  if (loading) {
    return <>
      <section className="metric-grid dashboard-stat-grid dashboard-skeleton" aria-label="Loading dashboard statistics">{Array.from({ length: 8 }).map((_, index) => <SkeletonMetricCard key={`metric-${index}`} />)}</section>
      <section className="financial-summary-grid dashboard-skeleton" aria-label="Loading financial summary">{Array.from({ length: 4 }).map((_, index) => <SkeletonMetricCard key={`financial-${index}`} />)}</section>
    </>
  }

  return <>
    <section className="metric-grid dashboard-stat-grid dashboard-content-ready" aria-label="Dashboard statistics">{cards.map((card) => <MetricCard key={card.title} {...card} change={card.change ?? ''} negative={card.negative ?? false} />)}</section>
    <section className="financial-summary-grid dashboard-content-ready" aria-label="Financial summary">{financialCards.map((card) => <MetricCard key={card.title} {...card} className="financial-card" change={card.change ?? ''} negative={card.negative ?? false} />)}</section>
  </>
}
