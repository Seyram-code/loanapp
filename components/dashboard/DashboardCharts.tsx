import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardStats } from '../../hooks/use-dashboard-stats'
import './dashboard-charts.css'

type DashboardChartsProps = { stats: DashboardStats | null; loading?: boolean }

const compactMoney = (value: string | number) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount === 0) return '0'
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2).replace(/\.00$/, '')}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')}K`
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function SkeletonChartPanel() {
  return (
    <article className="chart-panel panel dashboard-skeleton-card">
      <div className="chart-header">
        <div className="skeleton-line short" />
        <div className="skeleton-line tiny" />
      </div>
      <div className="chart-body">
        <div className="dashboard-skeleton-chart">
          <div className="skeleton-line chart-main" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line medium" />
        </div>
      </div>
    </article>
  )
}

function EmptyChartState({ title, description }: { title: string; description: string }) {
  return (
    <article className="chart-panel panel empty-chart-panel">
      <div className="chart-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="chart-body empty-chart-body">
        <div className="empty-chart-state">
          <div className="empty-chart-icon" aria-hidden="true">—</div>
          <strong>No data available</strong>
          <span>{description}</span>
        </div>
      </div>
    </article>
  )
}

export function DashboardCharts({ stats, loading = false }: DashboardChartsProps) {
  if (loading) {
    return (
      <section className="dashboard-charts dashboard-skeleton" aria-label="Loading dashboard analytics">
        <SkeletonChartPanel />
        <SkeletonChartPanel />
        <SkeletonChartPanel />
      </section>
    )
  }

  const statusCounts = stats?.loanStatuses ?? {}
  const activity = Array.isArray(stats?.monthlyActivity) ? stats.monthlyActivity : []
  const repayment = stats?.repaymentOverview ?? { expected: '0', paid: '0', outstanding: '0', overdue: '0' }

  const statusData = [
    { key: 'PENDING', label: 'Pending', color: '#ddb23c', value: (statusCounts.PENDING ?? 0) + (statusCounts.UNDER_REVIEW ?? 0) },
    { key: 'APPROVED', label: 'Approved', color: '#6e9bb3', value: statusCounts.APPROVED ?? 0 },
    { key: 'ACTIVE', label: 'Active', color: '#80af9a', value: (statusCounts.ACTIVE ?? 0) + (statusCounts.DISBURSED ?? 0) },
    { key: 'COMPLETED', label: 'Completed', color: '#537c91', value: statusCounts.COMPLETED ?? 0 },
    { key: 'REJECTED', label: 'Rejected', color: '#d99382', value: statusCounts.REJECTED ?? 0 },
    { key: 'DEFAULTED', label: 'Defaulted', color: '#9b6070', value: statusCounts.DEFAULTED ?? 0 },
  ]

  const repaymentData = [
    { key: 'PAID', label: 'Paid', color: '#80af9a', value: Number(repayment.paid) },
    { key: 'OUTSTANDING', label: 'Outstanding', color: '#6e9bb3', value: Number(repayment.outstanding) },
    { key: 'OVERDUE', label: 'Overdue', color: '#d99382', value: Number(repayment.overdue) },
  ]

  const totalExpected = Number(repayment.expected) || repaymentData.reduce((sum, item) => sum + item.value, 0)
  const totalLoans = stats?.totalLoans ?? statusData.reduce((sum, item) => sum + item.value, 0)
  const statusRingBackground = (() => {
    let cursor = 0
    const segments = statusData
      .filter((item) => item.value > 0)
      .map((item) => {
        const percent = totalLoans > 0 ? (item.value / totalLoans) * 100 : 0
        const start = cursor
        cursor += percent
        return `${item.color} ${start}% ${cursor}%`
      })

    return segments.length > 0 ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#dfe7eb 0deg 360deg)'
  })()
  const repaymentRingBackground = (() => {
    let cursor = 0
    const segments = repaymentData
      .filter((item) => item.value > 0)
      .map((item) => {
        const percent = totalExpected > 0 ? (item.value / totalExpected) * 100 : 0
        const start = cursor
        cursor += percent
        return `${item.color} ${start}% ${cursor}%`
      })

    return segments.length > 0 ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#dfe7eb 0deg 360deg)'
  })()

  const hasStatusData = statusData.some((item) => item.value > 0)
  const hasActivityData = activity.some((item) => item.applications > 0 || item.approvals > 0 || item.disbursements > 0 || item.repayments > 0)
  const hasRepaymentData = repaymentData.some((item) => item.value > 0)

  if (!hasStatusData && !hasActivityData && !hasRepaymentData) {
    return (
      <section className="dashboard-charts dashboard-empty" aria-label="Dashboard analytics">
        <EmptyChartState title="Loan Status Overview" description="There are no loan records to display yet." />
        <EmptyChartState title="Monthly Loan Activity" description="Loan activity will appear here once applications, approvals, and repayments are recorded." />
        <EmptyChartState title="Repayment Overview" description="Repayment trends will appear here once payments are logged." />
      </section>
    )
  }

  return (
    <section className="dashboard-charts" aria-label="Dashboard analytics">
      {!hasStatusData ? (
        <EmptyChartState title="Loan Status Overview" description="There are no loan records to display yet." />
      ) : (
        <article className="chart-panel panel">
          <div className="chart-header">
            <div>
              <h2>Loan Status Overview</h2>
              <p>Current portfolio distribution.</p>
            </div>
          </div>
          <div className="chart-body status-chart">
            <div className="status-chart-layout">
              <div className="status-ring-shell" aria-label="Loan status distribution chart">
                <div className="status-ring" style={{ background: statusRingBackground }} aria-hidden="true" />
                <div className="status-ring-center">
                  <strong>{totalLoans}</strong>
                </div>
              </div>
              <ul className="status-list">
                {statusData.map((item) => (
                  <li key={item.key} className="status-item">
                    <span className="status-swatch" style={{ background: item.color }} aria-hidden="true" />
                    <span className="status-name">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      )}

      {!hasActivityData ? (
        <EmptyChartState title="Monthly Loan Activity" description="Loan activity will appear here once applications, approvals, and repayments are recorded." />
      ) : (
        <article className="chart-panel panel activity-chart-panel">
          <div className="chart-header">
            <div>
              <h2>Monthly Loan Activity</h2>
            </div>
            <div className="chart-header-actions">
              <select className="chart-period" defaultValue="this-year" aria-label="Select chart period">
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 12, right: 8, left: -12, bottom: 8 }} barGap={4}>
                <CartesianGrid stroke="#eeeae1" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa79e' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#aaa79e' }} />
                <Tooltip formatter={(value: number | string) => [`${value}`, 'Loans']} />
                <Legend wrapperStyle={{ paddingTop: 8, fontSize: 10 }} iconType="circle" />
                <Bar dataKey="applications" fill="#dcae36" name="Applications" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approvals" fill="#6e9bb3" name="Approvals" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disbursements" fill="#80af9a" name="Disbursements" radius={[4, 4, 0, 0]} />
                <Bar dataKey="repayments" fill="#d99382" name="Repayments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      )}

      {!hasRepaymentData ? (
        <EmptyChartState title="Repayment Overview" description="Repayment trends will appear here once payments are logged." />
      ) : (
        <article className="chart-panel panel">
          <div className="chart-header">
            <div>
              <h2>Repayment Overview</h2>
              <p>Expected vs actual performance.</p>
            </div>
          </div>
          <div className="chart-body repayment-body">
            <div className="repayment-chart-layout">
              <div className="repayment-ring-shell" aria-label="Repayment overview chart">
                <div className="repayment-ring" style={{ background: repaymentRingBackground }} aria-hidden="true" />
                <div className="repayment-ring-center">
                  <span className="currency-tag">GHS</span>
                  <strong>{compactMoney(totalExpected)}</strong>
                  <small>Expected</small>
                </div>
              </div>
              <ul className="repayment-list">
                {repaymentData.map((item) => (
                  <li key={item.key} className="repayment-item">
                    <span className="repayment-swatch" style={{ background: item.color }} aria-hidden="true" />
                    <span className="repayment-name">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      )}
    </section>
  )
}
