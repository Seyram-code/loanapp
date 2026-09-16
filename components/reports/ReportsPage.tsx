'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type ReportData = {
  filters: { startDate: string; endDate: string; loanTypeId: string; loanStatus: string }
  loanTypes: Array<{ id: string; name: string }>
  customers: { total: number; new: number; active: number; inactive: number }
  loans: { total: number; pending: number; approved: number; active: number; completed: number; rejected: number; defaulted: number }
  financial: { totalRequested: string; totalApproved: string; totalDisbursed: string; totalRepaid: string; totalInterest: string; outstanding: string; overdue: string }
}

const money = (value: string) => `GHS ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Metric({ label, value, tone = '' }: { label: string; value: string | number; tone?: string }) {
  return <div className={`report-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loanTypeId, setLoanTypeId] = useState('')
  const [loanStatus, setLoanStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (loanTypeId) params.set('loanTypeId', loanTypeId)
    if (loanStatus) params.set('loanStatus', loanStatus)
    const response = await fetch(`/api/reports?${params}`)
    if (!response.ok) setError('Unable to load reports.')
    else setReport(await response.json())
    setLoading(false)
  }, [startDate, endDate, loanTypeId, loanStatus])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const exportCsv = () => {
    const params = new URLSearchParams({ format: 'csv' })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (loanTypeId) params.set('loanTypeId', loanTypeId)
    if (loanStatus) params.set('loanStatus', loanStatus)
    window.location.href = `/api/reports?${params}`
  }

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
          <p className="eyebrow">Business intelligence</p>
          <h1>Reports</h1>
          <p className="settings-copy">Track portfolio growth, loan performance, and cash movement.</p>
        </div>
        <button className="primary-button" type="button" onClick={exportCsv}><Download size={16} /> Export CSV</button>
      </header>

      <section className="reports-filters panel">
        <div className="report-filter-field"><label htmlFor="report-start">From</label><input id="report-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
        <div className="report-filter-field"><label htmlFor="report-end">To</label><input id="report-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
        <div className="report-filter-field"><label htmlFor="report-loan-type">Loan type</label><select id="report-loan-type" value={loanTypeId} onChange={(event) => setLoanTypeId(event.target.value)}><option value="">All loan types</option>{report?.loanTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select></div>
        <div className="report-filter-field"><label htmlFor="report-status">Loan status</label><select id="report-status" value={loanStatus} onChange={(event) => setLoanStatus(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="UNDER_REVIEW">Under review</option><option value="APPROVED">Approved</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option><option value="DEFAULTED">Defaulted</option></select></div>
        <button className="report-refresh" type="button" onClick={() => void load} aria-label="Refresh reports" title="Refresh reports"><RefreshCw size={16} /></button>
      </section>

      {error ? <div className="loan-warning"><strong>Reports unavailable</strong><span>{error}</span></div> : null}
      {loading || !report ? <div className="directory-empty">Loading reports...</div> : (
        <div className="report-sections">
          <section className="report-section panel"><div className="report-section-heading"><div><p className="eyebrow">Customer report</p><h2>Customer activity</h2></div><span className="report-section-count">{report.customers.total} total</span></div><div className="report-metric-grid"><Metric label="Total customers" value={report.customers.total} /><Metric label="New customers" value={report.customers.new} tone="blue" /><Metric label="Active customers" value={report.customers.active} tone="mint" /><Metric label="Inactive customers" value={report.customers.inactive} tone="coral" /></div></section>
          <section className="report-section panel"><div className="report-section-heading"><div><p className="eyebrow">Loan report</p><h2>Portfolio status</h2></div><span className="report-section-count">{report.loans.total} total</span></div><div className="report-metric-grid report-loan-grid"><Metric label="Total loans" value={report.loans.total} /><Metric label="Pending" value={report.loans.pending} /><Metric label="Approved" value={report.loans.approved} tone="blue" /><Metric label="Active" value={report.loans.active} tone="mint" /><Metric label="Completed" value={report.loans.completed} tone="mint" /><Metric label="Rejected" value={report.loans.rejected} tone="coral" /><Metric label="Defaulted" value={report.loans.defaulted} tone="coral" /></div></section>
          <section className="report-section panel"><div className="report-section-heading"><div><p className="eyebrow">Financial report</p><h2>Money movement</h2></div><span className="report-section-count">Filtered portfolio</span></div><div className="report-metric-grid report-financial-grid"><Metric label="Total requested" value={money(report.financial.totalRequested)} /><Metric label="Total approved" value={money(report.financial.totalApproved)} tone="blue" /><Metric label="Total disbursed" value={money(report.financial.totalDisbursed)} tone="gold" /><Metric label="Total repaid" value={money(report.financial.totalRepaid)} tone="mint" /><Metric label="Total interest" value={money(report.financial.totalInterest)} tone="gold" /><Metric label="Outstanding" value={money(report.financial.outstanding)} /><Metric label="Overdue" value={money(report.financial.overdue)} tone="coral" /></div></section>
        </div>
      )}
    </main>
  )
}
