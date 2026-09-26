'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Printer, RefreshCw } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/ToastProvider'
import { formatDate as formatConfiguredDate } from '@/utils/date-format'
import './loans-page.css'

type LoanScheduleItem = {
  installmentNumber: number
  dueDate: string
  expectedAmount: string
  principalAmount: string
  interestAmount: string
  amountPaid: string
  remainingAmount: string
  status: string
}

type LoanDetailsData = {
  id: string
  loanNumber: string
  customer: { id: string; name: string; customerNumber: string; phone: string; email: string | null }
  loanType: string
  requestedAmount: string
  approvedAmount: string | null
  interestRate: string
  interest: string
  totalRepayment: string
  amountPaid: string
  outstanding: string
  term: string
  repaymentFrequency: string
  applicationDate: string
  approvalDate: string | null
  disbursementDate: string | null
  maturityDate: string | null
  status: string
  rolloverToLoan: { id: string; loanNumber: string; status: string } | null
  rejectionReason: string | null
  purpose: string | null
  notes: string | null
  createdBy: string
  approvedBy: string | null
  disbursedBy: string | null
}

const money = (value: string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'GHS 0.00'
  return `GHS ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  return formatConfiguredDate(value)
}

export default function LoanDetails({ id }: { id: string }) {
  const { showToast } = useToast()
  const [loan, setLoan] = useState<LoanDetailsData | null>(null)
  const [schedule, setSchedule] = useState<LoanScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showDisbursementDialog, setShowDisbursementDialog] = useState(false)
  const [showDisbursementConfirm, setShowDisbursementConfirm] = useState(false)
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [showRolloverConfirm, setShowRolloverConfirm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')
  const [repaymentError, setRepaymentError] = useState<{ title: string; message: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [disbursementForm, setDisbursementForm] = useState({
    amount: '',
    disbursementDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  })
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  })

  const loadLoan = useCallback(async () => {
    const [loanResponse, scheduleResponse] = await Promise.all([
      fetch(`/api/loans/${id}`),
      fetch(`/api/loans/${id}/schedule`),
    ])

    if (loanResponse.status === 401 || scheduleResponse.status === 401) {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.assign(`/login?next=/loans/${id}`)
      return
    }

    const loanData = loanResponse.ok ? await loanResponse.json() : null
    const scheduleData = scheduleResponse.ok ? await scheduleResponse.json() : []
    setLoan(loanData)
    setSchedule(Array.isArray(scheduleData) ? scheduleData : [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadLoan()
  }, [loadLoan])

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  const handleApprove = async () => {
    if (actionPending) return
    setActionPending(true)
    setError('')
    const response = await fetch(`/api/loans/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedAmount: Number(loan?.requestedAmount ?? 0) }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload.error || 'Unable to approve the loan.')
      setActionPending(false)
      return
    }

    await loadLoan()
    showToast('Loan approved successfully.')
    setRejecting(false)
    setRejectionReason('')
    setActionPending(false)
  }

  const handleReject = async () => {
    if (actionPending) return
    const reason = rejectionReason.trim()
    if (!reason) {
      setError('A rejection reason is required before rejecting the loan.')
      return
    }

    setActionPending(true)
    setShowRejectConfirm(false)
    const response = await fetch(`/api/loans/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason: reason }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload.error || 'Unable to reject the loan.')
      setActionPending(false)
      return
    }

    await loadLoan()
    showToast('Loan rejected.')
    setRejecting(false)
    setRejectionReason('')
    setActionPending(false)
  }

  const handleDisburse = async () => {
    if (!loan || actionPending) return
    setActionPending(true)

    const amount = Number(disbursementForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Disbursement amount is required and must be greater than zero.')
      setActionPending(false)
      return
    }

    const response = await fetch(`/api/loans/${id}/disburse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        disbursementDate: disbursementForm.disbursementDate,
        paymentMethod: disbursementForm.paymentMethod,
        referenceNumber: disbursementForm.referenceNumber || undefined,
        notes: disbursementForm.notes || undefined,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload.error || 'Unable to disburse the loan.')
      setActionPending(false)
      return
    }

    setShowDisbursementDialog(false)
    setShowDisbursementConfirm(false)
    setError('')
    setDisbursementForm({
      amount: loan.approvedAmount ?? loan.requestedAmount,
      disbursementDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: '',
    })
    await loadLoan()
    showToast('Loan disbursed successfully.')
    setActionPending(false)
  }

  const handleRepayment = async () => {
    if (!loan || actionPending) return
    setActionPending(true)
    const amount = Number(repaymentForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setRepaymentError({ title: 'Enter a valid amount', message: 'The repayment amount must be greater than zero.' })
      setActionPending(false)
      return
    }
    const outstanding = Number(loan.outstanding)
    if (amount > outstanding) {
      setRepaymentError({ title: 'Please enter a lower amount', message: `Enter ${money(loan.outstanding)} or less to match the remaining balance.` })
      setActionPending(false)
      return
    }

    const response = await fetch('/api/repayments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanId: loan.id,
        customerId: loan.customer.id,
        amount,
        paymentDate: repaymentForm.paymentDate,
        paymentMethod: repaymentForm.paymentMethod,
        referenceNumber: repaymentForm.referenceNumber || undefined,
        notes: repaymentForm.notes || undefined,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setRepaymentError({ title: 'Unable to record repayment', message: payload.error || 'Please review the details and try again.' })
      setActionPending(false)
      return
    }

    setShowRepaymentDialog(false)
    setError('')
    setRepaymentForm({
      amount: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: '',
    })
    await loadLoan()
    showToast('Repayment recorded successfully.')
    setActionPending(false)
  }

  const repaymentAmount = Number(repaymentForm.amount)
  const outstandingAmount = Number(loan?.outstanding ?? 0)
  const repaymentExceedsBalance = Number.isFinite(repaymentAmount) && repaymentAmount > outstandingAmount

  const handleTransition = async (action: 'submit' | 'review' | 'activate', label: string) => {
    if (actionPending) return
    setActionPending(true)
    setError('')
    const response = await fetch(`/api/loans/${id}/${action}`, { method: 'POST' })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload.error || `Unable to ${label.toLowerCase()} the loan.`)
      setActionPending(false)
      return
    }
    await loadLoan()
    setActionPending(false)
  }

  const handleRollover = async () => {
    if (!loan || actionPending) return
    setActionPending(true)
    setError('')
    const response = await fetch(`/api/loans/${id}/rollover`, { method: 'POST' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to request the rollover.')
      setShowRolloverConfirm(false)
      setActionPending(false)
      return
    }
    setShowRolloverConfirm(false)
    await loadLoan()
    showToast(`Rollover requested as ${payload.loanNumber}.`)
    setActionPending(false)
  }

  if (loading) {
    return (
      <main className="loan-details-page">
        <div className="directory-empty">Loading loan details...</div>
      </main>
    )
  }

  if (!loan) {
    return (
      <main className="loan-details-page">
        <div className="directory-empty">Loan not found.</div>
      </main>
    )
  }

  const statusClass = loan.status.toLowerCase().replace(/_/g, '-')
  const openDisbursement = () => {
    setShowDisbursementDialog(true)
    setError('')
    setDisbursementForm((current) => ({ ...current, amount: loan.approvedAmount ?? loan.requestedAmount }))
  }

  return (
    <main className="loan-details-page">
      <header className="loan-details-header">
        <div>
          <Link href="/loans" className="back-link"><ArrowLeft size={15} /> Loans</Link>
          <p className="eyebrow">Loan details</p>
          <h1>{loan.loanNumber}</h1>
          <p className="settings-copy">{loan.customer.name} · {loan.loanType}</p>
        </div>
        <div className="loan-details-header-actions">
          <button type="button" className="loan-print-button" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <span className={`loan-status-badge status ${statusClass}`}>{loan.status.replace('_', ' ')}</span>
        </div>
      </header>

      <section className="loan-print-document" aria-label="Printable loan details">
        <header className="loan-print-header">
          <p>Loan repayment statement</p>
          <h1>{loan.loanNumber}</h1>
          <time dateTime={new Date().toISOString()}>{formatDate(new Date().toISOString())}</time>
        </header>
        <dl className="loan-print-summary">
          <div><dt>Customer name</dt><dd>{loan.customer.name}</dd></div>
          <div><dt>Customer phone</dt><dd>{loan.customer.phone}</dd></div>
          <div><dt>Customer ID</dt><dd>{loan.customer.customerNumber}</dd></div>
          <div><dt>Loan number</dt><dd>{loan.loanNumber}</dd></div>
          <div><dt>Loan ID</dt><dd>{loan.id}</dd></div>
          <div><dt>Current loan status</dt><dd>{loan.status.replace(/_/g, ' ')}</dd></div>
          <div><dt>Loan amount</dt><dd>{money(loan.approvedAmount ?? loan.requestedAmount)}</dd></div>
          <div><dt>Outstanding balance</dt><dd>{money(loan.outstanding)}</dd></div>
        </dl>
        <h2>Repayment schedule</h2>
        {schedule.length ? (
          <table className="loan-print-schedule">
            <thead><tr><th>Payment</th><th>Due date</th><th>Expected</th><th>Principal</th><th>Interest</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead>
            <tbody>{schedule.map((item) => <tr key={item.installmentNumber}><td>{item.installmentNumber}</td><td>{formatDate(item.dueDate)}</td><td>{money(item.expectedAmount)}</td><td>{money(item.principalAmount)}</td><td>{money(item.interestAmount)}</td><td>{money(item.amountPaid)}</td><td>{money(item.remainingAmount)}</td><td>{item.status.replace(/_/g, ' ')}</td></tr>)}</tbody>
          </table>
        ) : <p>No repayment schedule has been generated yet.</p>}
      </section>

      <section className="panel loan-details-panel">
        <div className="directory-toolbar" style={{ padding: 0, border: 'none', marginBottom: 8 }}>
          <div>
            <strong>{loan.customer.customerNumber}</strong>
          </div>
        </div>

        <div className="loan-actions">
          {loan.status === 'COMPLETED' && Number(loan.outstanding) === 0 && !loan.rolloverToLoan ? <button type="button" className="primary" disabled={actionPending} onClick={() => setShowRolloverConfirm(true)}><RefreshCw size={15} aria-hidden="true" /> Request rollover</button> : null}
          {loan.rolloverToLoan ? <Link className="rollover-loan-link" href={`/loans/${loan.rolloverToLoan.id}`}>Rollover: {loan.rolloverToLoan.loanNumber} · {loan.rolloverToLoan.status.replaceAll('_', ' ')}</Link> : null}
          <div ref={menuRef} className={`loan-action-menu ${menuOpen ? 'is-open' : ''}`}>
            <button type="button" className="primary" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((current) => !current)}>
              <span>Loan actions</span><ChevronDown size={16} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="loan-action-menu-list" role="menu">
                {loan.status === 'DRAFT' ? <button type="button" disabled={actionPending} onClick={() => { setMenuOpen(false); void handleTransition('submit', 'submit') }}>{actionPending ? 'Submitting...' : 'Submit for review'}</button> : null}
                {loan.status === 'PENDING' ? <button type="button" disabled={actionPending} onClick={() => { setMenuOpen(false); void handleTransition('review', 'start review') }}>{actionPending ? 'Opening...' : 'Start review'}</button> : null}
                {loan.status === 'UNDER_REVIEW' ? <><button type="button" disabled={actionPending} onClick={() => { setMenuOpen(false); void handleApprove() }}>{actionPending ? 'Approving...' : 'Approve loan'}</button><button type="button" onClick={() => { setMenuOpen(false); setRejecting(true); setError('') }}>Reject loan</button></> : null}
                {loan.status === 'APPROVED' ? <button type="button" onClick={() => { setMenuOpen(false); openDisbursement() }}>Disburse loan</button> : null}
                {loan.status === 'DISBURSED' ? <button type="button" disabled={actionPending} onClick={() => { setMenuOpen(false); void handleTransition('activate', 'activate') }}>{actionPending ? 'Activating...' : 'Activate loan'}</button> : null}
                {loan.status === 'ACTIVE' ? <button type="button" onClick={() => { setMenuOpen(false); setShowRepaymentDialog(true); setRepaymentError(null) }}>Record repayment</button> : null}
                <Link href="/loans" onClick={() => setMenuOpen(false)}>Back to loans</Link>
              </div>
            ) : null}
          </div>
        </div>

        <ConfirmDialog open={showRolloverConfirm} title="Request loan rollover" message={`Request a new draft for ${loan.loanNumber} using the same amount and terms? The existing loan will remain completed, and the new loan will need review and approval.`} confirmLabel={actionPending ? 'Requesting...' : 'Request rollover'} onConfirm={() => void handleRollover()} onCancel={() => { if (!actionPending) setShowRolloverConfirm(false) }} />

        {showDisbursementDialog ? (
          <Modal open title="Disburse loan" className="loan-form-dialog" onClose={() => { setShowDisbursementDialog(false); setError('') }}>
            <strong>Confirm disbursement</strong>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Disbursement amount</span>
                <input type="number" min="0.01" step="0.01" value={disbursementForm.amount} onChange={(event) => setDisbursementForm((current) => ({ ...current, amount: event.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Date</span>
                <input type="date" value={disbursementForm.disbursementDate} onChange={(event) => setDisbursementForm((current) => ({ ...current, disbursementDate: event.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Payment method</span>
                <select value={disbursementForm.paymentMethod} onChange={(event) => setDisbursementForm((current) => ({ ...current, paymentMethod: event.target.value }))}>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                  <option value="CARD">CARD</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reference number</span>
                <input value={disbursementForm.referenceNumber} onChange={(event) => setDisbursementForm((current) => ({ ...current, referenceNumber: event.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Notes</span>
                <textarea rows={3} value={disbursementForm.notes} onChange={(event) => setDisbursementForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>
            <div className="loan-actions" style={{ marginTop: 12 }}>
              <button type="button" className="primary" disabled={actionPending} onClick={() => setShowDisbursementConfirm(true)}>{actionPending ? 'Disbursing...' : 'Continue'}</button>
              <button type="button" onClick={() => { setShowDisbursementDialog(false); setError('') }}>Cancel</button>
            </div>
          </Modal>
        ) : null}

        {showRepaymentDialog ? (
          <Modal open title="Record repayment" className="loan-form-dialog" onClose={() => { setShowRepaymentDialog(false); setRepaymentError(null) }}>
            <strong>Record repayment</strong>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Loan</span>
                <input value={loan.loanNumber} readOnly />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Customer</span>
                <input value={`${loan.customer.name} (${loan.customer.customerNumber})`} readOnly />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Amount</span>
                <input type="number" min="0.01" max={loan.outstanding} step="0.01" value={repaymentForm.amount} aria-invalid={Boolean(repaymentError)} onChange={(event) => {
                  const value = event.target.value
                  const numericValue = Number(value)
                  if (value && Number.isFinite(numericValue) && numericValue > outstandingAmount) {
                    setRepaymentForm((current) => ({ ...current, amount: loan.outstanding }))
                    setRepaymentError({ title: 'Please enter a lower amount', message: `Enter ${money(loan.outstanding)} or less to match the remaining balance.` })
                    return
                  }
                  setRepaymentForm((current) => ({ ...current, amount: value }))
                  setRepaymentError(null)
                }} />
                <small className="outstanding-balance"><span>Outstanding balance</span><strong>{money(loan.outstanding)}</strong></small>
                {repaymentError ? <div className="repayment-validation-message" role="alert"><strong>{repaymentError.title}</strong><span>{repaymentError.message}</span></div> : null}
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Payment date</span>
                <input type="date" value={repaymentForm.paymentDate} onChange={(event) => setRepaymentForm((current) => ({ ...current, paymentDate: event.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Payment method</span>
                <select value={repaymentForm.paymentMethod} onChange={(event) => setRepaymentForm((current) => ({ ...current, paymentMethod: event.target.value }))}>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                  <option value="CARD">CARD</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reference number</span>
                <input value={repaymentForm.referenceNumber} onChange={(event) => setRepaymentForm((current) => ({ ...current, referenceNumber: event.target.value }))} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Notes</span>
                <textarea rows={3} value={repaymentForm.notes} onChange={(event) => setRepaymentForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>
            <div className="loan-actions" style={{ marginTop: 12 }}>
              <button type="button" className="primary" disabled={actionPending || repaymentExceedsBalance} onClick={handleRepayment}>{actionPending ? 'Saving...' : 'Save repayment'}</button>
              <button type="button" onClick={() => { setShowRepaymentDialog(false); setRepaymentError(null) }}>Cancel</button>
            </div>
          </Modal>
        ) : null}

        {rejecting ? (
          <Modal open title="Rejection reason" className="loan-form-dialog" onClose={() => { setRejecting(false); setRejectionReason(''); setError('') }}>
            <strong>Rejection reason</strong>
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Provide a reason for rejecting this loan" rows={4} />
            <div className="loan-actions" style={{ marginTop: 12 }}>
              <button type="button" className="primary" disabled={actionPending} onClick={() => setShowRejectConfirm(true)}>{actionPending ? 'Submitting...' : 'Continue'}</button>
              <button type="button" onClick={() => { setRejecting(false); setRejectionReason(''); setError('') }}>Cancel</button>
            </div>
          </Modal>
        ) : null}

        <ConfirmDialog open={showDisbursementConfirm} title="Confirm disbursement" message={`Disburse ${money(disbursementForm.amount)} to ${loan.customer.name} for loan ${loan.loanNumber} on ${formatDate(disbursementForm.disbursementDate)} via ${disbursementForm.paymentMethod.replace('_', ' ')}?`} confirmLabel="Disburse loan" onConfirm={() => void handleDisburse()} onCancel={() => setShowDisbursementConfirm(false)} />
        <ConfirmDialog open={showRejectConfirm} title="Reject loan" message={`Are you sure you want to reject loan ${loan.loanNumber} for ${loan.customer.name}? The reason is: "${rejectionReason.trim()}"`} confirmLabel="Reject loan" onConfirm={() => void handleReject()} onCancel={() => setShowRejectConfirm(false)} />

        {error ? <div className="loan-warning" style={{ marginTop: 16 }}><strong>Action required</strong><span>{error}</span></div> : null}

        {loan.status === 'REJECTED' && loan.rejectionReason ? (
          <div className="loan-warning">
            <strong>Rejection reason</strong>
            <span>{loan.rejectionReason}</span>
          </div>
        ) : null}

        <div className="loan-summary-grid" style={{ marginTop: 20 }}>
          <div className="loan-summary-item"><span>Customer information</span><strong>{loan.customer.name}</strong><small>{loan.customer.phone} · {loan.customer.email ?? 'No email'}</small></div>
          <div className="loan-summary-item"><span>Requested amount</span><strong>{money(loan.requestedAmount)}</strong></div>
          <div className="loan-summary-item"><span>Loan type</span><strong>{loan.loanType}</strong></div>
          <div className="loan-summary-item"><span>Interest</span><strong>{loan.interestRate}</strong></div>
          <div className="loan-summary-item"><span>Term</span><strong>{loan.term}</strong></div>
          <div className="loan-summary-item"><span>Total repayment</span><strong>{money(loan.totalRepayment)}</strong></div>
          <div className="loan-summary-item"><span>Loan purpose</span><strong>{loan.purpose ?? '—'}</strong></div>
          <div className="loan-summary-item"><span>Repayment schedule</span><strong>{schedule.length ? `${schedule.length} installments` : 'Not generated yet'}</strong></div>
          <div className="loan-summary-item"><span>Application date</span><strong>{formatDate(loan.applicationDate)}</strong></div>
          <div className="loan-summary-item"><span>Approval date</span><strong>{formatDate(loan.approvalDate)}</strong></div>
          <div className="loan-summary-item"><span>Disbursement date</span><strong>{formatDate(loan.disbursementDate)}</strong></div>
          <div className="loan-summary-item"><span>Maturity date</span><strong>{formatDate(loan.maturityDate)}</strong></div>
        </div>

        {schedule.length ? (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Repayment Schedule</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Due date</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Expected</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Principal</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Interest</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Paid</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Remaining</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ece8e2' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.installmentNumber}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{item.installmentNumber}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{formatDate(item.dueDate)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{money(item.expectedAmount)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{money(item.principalAmount)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{money(item.interestAmount)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{money(item.amountPaid)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}>{money(item.remainingAmount)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2efe9' }}><span className={`status ${item.status.toLowerCase()}`}>{item.status.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
