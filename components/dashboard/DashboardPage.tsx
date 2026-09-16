"use client"

import dynamic from 'next/dynamic'
import { CalendarDays } from 'lucide-react'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { DashboardNotifications } from '@/components/dashboard/DashboardNotifications'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'

const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts').then((module) => module.DashboardCharts), { ssr: false, loading: () => <div className="dashboard-charts-loading" role="status">Loading charts...</div> })

type DashboardPageProps = { userName: string; currentDate: string }

export default function App({ userName, currentDate }: DashboardPageProps) {
  const { stats, loading, error, refetch } = useDashboardStats()

  if (error) {
    return <div className="page-content">
          <section className="page-intro">
            <div>
              <p className="eyebrow">Portfolio overview</p>
              <h1>Welcome back, {userName}!</h1>
              <p className="intro-copy">Here&apos;s what&apos;s happening with your loan portfolio today.</p>
            </div>
            <div className="welcome-date"><CalendarDays size={18} /><div><strong>{currentDate}</strong><small>Have a productive day!</small></div></div>
          </section>
          <div className="dashboard-error-state" role="alert" aria-live="polite">
            <div className="dashboard-error-icon" aria-hidden="true">!</div>
            <h2>Unable to load dashboard data.</h2>
            <p>Please try again in a moment.</p>
            <button type="button" className="primary-button" onClick={() => void refetch()}>Try Again</button>
          </div>
    </div>
  }

  return <div className="page-content">
        <section className="page-intro">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h1>Welcome back, {userName}!</h1>
            <p className="intro-copy">Here&apos;s what&apos;s happening with your loan portfolio today.</p>
          </div>
          <div className="welcome-date"><CalendarDays size={18} /><div><strong>{currentDate}</strong><small>Have a productive day!</small></div></div>
        </section>
        <DashboardStats stats={stats} loading={loading} />
        <DashboardCharts stats={stats} loading={loading} />
        <section className="dashboard-bottom-grid"><RecentActivity activity={stats?.activity ?? []} loading={loading} /><DashboardNotifications loading={loading} /></section>
  </div>
}
