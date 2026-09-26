'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock3, Eye, Phone, Mail, UserRound } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

type CustomerRecord = { firstName: string; middleName: string | null; lastName: string; customerNumber: string; status: string; phone: string; email: string | null; dateOfBirth: string | null; gender: string | null; alternatePhone: string | null; nationalId: string | null; address: string | null; city: string | null; region: string | null; country: string | null; occupation: string | null; employer: string | null; monthlyIncome: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null; notes: string | null }
type CustomerLoan = { id: string; loanNumber: string; loanType: { name: string }; requestedAmount: string; disbursed: string; outstanding: string; status: string; rolloverFromLoanId: string | null; rolloverToLoan: { id: string; loanNumber: string; status: string } | null; createdAt: string }
type CustomerRepayment = { id: string; repaymentNumber: string; loan: { loanNumber: string }; amount: string; paymentMethod: string; paymentDate: string; recordedBy: { name: string } }
type ReferralSchedule = { installmentNumber: number; expectedAmount: string; amountPaid: string; remainingAmount: string; dueDate: string; status: string }
type ReferralRepayment = { id: string; repaymentNumber: string; amount: string; paymentDate: string; paymentMethod: string }
type ReferredCustomer = { id: string; customerNumber: string; name: string; phone: string; status: string; loans: Array<{ id: string; loanNumber: string; loanType: string; requestedAmount: string; approvedAmount: string | null; disbursed: string; outstanding: string; status: string; createdAt: string; schedules: ReferralSchedule[]; repayments: ReferralRepayment[] }> }
type Profile = { customer: CustomerRecord; summary: { totalBorrowed: string; totalRepaid: string; outstandingBalance: string; overdueAmount: string; activeLoans: number; completedLoans: number }; loans: CustomerLoan[]; repayments: CustomerRepayment[]; referredCustomers: ReferredCustomer[]; activity: Array<{ action: string; description: string; admin: string; createdAt: string }> }
const money = (value: string) => `GHS ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CustomerProfile({ id }: { id: string }) {
  const { showToast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [viewingReferral, setViewingReferral] = useState<ReferredCustomer | null>(null)
  const [rolloverLoan, setRolloverLoan] = useState<CustomerLoan | null>(null)
  const [rolloverPending, setRolloverPending] = useState(false)
  const [rolloverError, setRolloverError] = useState('')

  useEffect(() => {
    fetch(`/api/customers/${id}/profile`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { setProfile(data); setLoading(false) })
  }, [id])

  async function requestRollover() {
    if (!rolloverLoan || rolloverPending) return
    setRolloverPending(true)
    setRolloverError('')
    try {
      const response = await fetch(`/api/loans/${rolloverLoan.id}/rollover`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        setRolloverError(result.error || 'Unable to request the rollover.')
        return
      }
      const refreshed = await fetch(`/api/customers/${id}/profile`).then((profileResponse) => profileResponse.ok ? profileResponse.json() : null)
      if (refreshed) setProfile(refreshed)
      showToast(`Rollover requested as ${result.loanNumber}.`)
      setRolloverLoan(null)
    } catch {
      setRolloverError('Unable to request the rollover. Check your connection and try again.')
    } finally {
      setRolloverPending(false)
    }
  }

  if (loading) return <main className="profile-page"><div className="directory-empty">Loading customer profile...</div></main>
  if (!profile) return <main className="profile-page"><div className="directory-empty">Customer not found.</div></main>

  const { customer, summary } = profile
  const name = [customer.firstName, customer.middleName, customer.lastName].filter(Boolean).join(' ')

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <Link href="/customers" className="back-link"><ArrowLeft size={15} /> Customers</Link>
          <div className="profile-title">
            <div className="profile-avatar">{customer.firstName[0]}{customer.lastName[0]}</div>
            <div><p className="eyebrow">Customer profile</p><h1>{name}</h1><p className="profile-number">{customer.customerNumber} · <span className={`status ${customer.status.toLowerCase()}`}>{customer.status}</span></p></div>
          </div>
        </div>
        <div className="profile-contact"><span><Phone size={14} /> {customer.phone}</span><span><Mail size={14} /> {customer.email || 'No email'}</span></div>
      </header>

      <section className="profile-summary-grid">
        <Summary label="Total borrowed" value={money(summary.totalBorrowed)} icon={<CircleDollarSign size={17} />} />
        <Summary label="Total repaid" value={money(summary.totalRepaid)} icon={<CircleDollarSign size={17} />} />
        <Summary label="Outstanding balance" value={money(summary.outstandingBalance)} icon={<Clock3 size={17} />} />
        <Summary label="Active loans" value={String(summary.activeLoans)} icon={<UserRound size={17} />} />
        <Summary label="Completed loans" value={String(summary.completedLoans)} icon={<CalendarDays size={17} />} />
        <Summary label="Overdue amount" value={money(summary.overdueAmount)} icon={<Clock3 size={17} />} negative />
      </section>

      <section className="profile-grid">
        <article className="profile-section panel">
          <SectionTitle title="Personal information" />
          <dl className="profile-details">
            <Detail label="Date of birth" value={customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '—'} />
            <Detail label="Gender" value={customer.gender || '—'} />
            <Detail label="Alternate phone" value={customer.alternatePhone || '—'} />
            <Detail label="National ID" value={customer.nationalId || '—'} />
            <Detail label="Address" value={[customer.address, customer.city, customer.region, customer.country].filter(Boolean).join(', ') || '—'} />
            <Detail label="Occupation" value={customer.occupation || '—'} />
            <Detail label="Employer" value={customer.employer || '—'} />
            <Detail label="Monthly income" value={customer.monthlyIncome ? money(customer.monthlyIncome) : '—'} />
            <Detail label="Emergency contact" value={customer.emergencyContactName ? `${customer.emergencyContactName} · ${customer.emergencyContactPhone || ''}` : '—'} />
            <Detail label="Notes" value={customer.notes || '—'} />
          </dl>
        </article>
        <article className="profile-section panel">
          <div className="profile-section-title"><div><h2>Activity</h2><p>Recent customer and loan events.</p></div><button type="button" className="profile-activity-button" onClick={() => setShowActivity(true)}>View all activity</button></div>
          <div className="profile-activity profile-activity-preview">{profile.activity.length ? profile.activity.map((item, index) => <div className="profile-activity-item" key={`${item.createdAt}-${index}`}><span className="activity-dot blue" /><div><strong>{item.action}</strong><p>{item.description}</p><small>{item.admin} · {new Date(item.createdAt).toLocaleString()}</small></div></div>) : <div className="directory-empty">No activity recorded.</div>}</div>
        </article>
      </section>

      {showActivity ? <Modal open title={`${name} activity`} className="profile-activity-modal" onClose={() => setShowActivity(false)}><div className="profile-activity-scroll">{profile.activity.length ? profile.activity.map((item, index) => <div className="profile-activity-item" key={`${item.createdAt}-${index}`}><span className="activity-dot blue" /><div><strong>{item.action}</strong><p>{item.description}</p><small>{item.admin} · {new Date(item.createdAt).toLocaleString()}</small></div></div>) : <div className="directory-empty">No activity recorded.</div>}</div></Modal> : null}

      <article className="profile-section panel">
        <SectionTitle title="Loans" />
        <div className="profile-table"><div className="profile-table-row profile-table-head customer-loan-row"><span>Loan number</span><span>Type</span><span>Requested</span><span>Disbursed</span><span>Status</span><span>Created</span><span>Rollover</span></div>{profile.loans.length ? profile.loans.map((loan) => <div className="profile-table-row customer-loan-row" key={loan.id}><strong>{loan.loanNumber}</strong><span>{loan.loanType.name}</span><span>{money(loan.requestedAmount)}</span><span>{money(loan.disbursed)}</span><span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span><span>{new Date(loan.createdAt).toLocaleDateString()}</span><span>{loan.rolloverToLoan ? <span>Requested: {loan.rolloverToLoan.loanNumber}</span> : loan.rolloverFromLoanId ? <span>Rollover</span> : loan.status === 'COMPLETED' && Number(loan.outstanding) === 0 ? <button type="button" className="profile-rollover-button" onClick={() => { setRolloverError(''); setRolloverLoan(loan) }}>Request rollover</button> : '—'}</span></div>) : <div className="directory-empty">No loans recorded.</div>}</div>
      </article>

      <ConfirmDialog open={Boolean(rolloverLoan)} title="Request loan rollover" message={rolloverLoan ? `Create a new draft for ${rolloverLoan.loanNumber} using its previous amount and terms? The existing loan will remain completed, and the new loan must still be reviewed and approved.` : ''} confirmLabel={rolloverPending ? 'Requesting...' : 'Request rollover'} onConfirm={() => void requestRollover()} onCancel={() => { if (!rolloverPending) setRolloverLoan(null) }} />
      {rolloverError ? <div className="loan-warning" role="alert"><strong>Rollover not created</strong><span>{rolloverError}</span></div> : null}

      <article className="profile-section panel">
        <SectionTitle title="Repayments" />
        <div className="profile-table"><div className="profile-table-row repayment-head"><span>Repayment number</span><span>Loan</span><span>Amount</span><span>Method</span><span>Payment date</span><span>Recorded by</span></div>{profile.repayments.length ? profile.repayments.map((repayment) => <div className="profile-table-row repayment-head" key={repayment.id}><strong>{repayment.repaymentNumber}</strong><span>{repayment.loan.loanNumber}</span><span>{money(repayment.amount)}</span><span>{repayment.paymentMethod.replaceAll('_', ' ')}</span><span>{new Date(repayment.paymentDate).toLocaleDateString()}</span><span>{repayment.recordedBy.name}</span></div>) : <div className="directory-empty">No repayments recorded.</div>}</div>
      </article>

      <article className="profile-section panel">
        <SectionTitle title={`Referred customers (${profile.referredCustomers.length})`} />
        {profile.referredCustomers.length ? profile.referredCustomers.map((referredCustomer) => (
          <div className="referred-customer referred-customer-row" key={referredCustomer.id}>
            <header className="referred-customer-header"><div><h3>{referredCustomer.name}</h3><p>{referredCustomer.customerNumber} · {referredCustomer.phone}</p></div><div className="referred-customer-actions"><span className={`status ${referredCustomer.status.toLowerCase()}`}>{referredCustomer.status}</span><button type="button" className="referred-view-button" onClick={() => setViewingReferral(referredCustomer)}><Eye size={14} aria-hidden="true" /> View</button></div></header>
          </div>
        )) : <div className="directory-empty">No referred customers yet.</div>}
      </article>

      {viewingReferral ? <Modal open title={`${viewingReferral.name} · ${viewingReferral.customerNumber}`} className="referred-customer-modal" onClose={() => setViewingReferral(null)}>
        <div className="referred-customer-modal-body">
        <div className="referred-modal-heading"><span>{viewingReferral.phone}</span><span className={`status ${viewingReferral.status.toLowerCase()}`}>{viewingReferral.status}</span></div>
        {viewingReferral.loans.length ? viewingReferral.loans.map((loan) => (
          <section className="referred-loan" key={loan.id}>
            <header><div><strong>{loan.loanNumber}</strong><span>{loan.loanType}</span></div><span className={`status ${loan.status.toLowerCase()}`}>{loan.status.replaceAll('_', ' ')}</span></header>
            <div className="referred-loan-summary"><span>Requested <strong>{money(loan.requestedAmount)}</strong></span><span>Disbursed <strong>{money(loan.disbursed)}</strong></span><span>Outstanding <strong>{money(loan.outstanding)}</strong></span></div>
            {loan.schedules.length ? <div className="profile-table referred-schedule"><div className="profile-table-row"><span>Payment</span><span>Due date</span><span>Expected</span><span>Paid</span><span>Remaining</span><span>Status</span></div>{loan.schedules.map((schedule) => <div className="profile-table-row" key={schedule.installmentNumber}><strong>{schedule.installmentNumber}</strong><span>{new Date(schedule.dueDate).toLocaleDateString()}</span><span>{money(schedule.expectedAmount)}</span><span>{money(schedule.amountPaid)}</span><span>{money(schedule.remainingAmount)}</span><span className={`status ${schedule.status.toLowerCase()}`}>{schedule.status.replaceAll('_', ' ')}</span></div>)}</div> : <p className="directory-empty">No repayment schedule generated yet.</p>}
            {loan.repayments.length ? <div className="referred-payment-list"><strong>Recorded payments</strong>{loan.repayments.map((repayment) => <div key={repayment.id}><span>{repayment.repaymentNumber} · {repayment.paymentMethod.replaceAll('_', ' ')}</span><span>{money(repayment.amount)} · {new Date(repayment.paymentDate).toLocaleDateString()}</span></div>)}</div> : <p className="referred-no-payments">No payments recorded yet.</p>}
          </section>
        )) : <div className="directory-empty">No loans recorded for this referred customer.</div>}
        </div>
      </Modal> : null}
    </main>
  )
}

function Summary({ label, value, icon, negative }: { label: string; value: string; icon: React.ReactNode; negative?: boolean }) { return <article className={`profile-summary-card ${negative ? 'negative-card' : ''}`}><span>{icon}</span><small>{label}</small><strong>{value}</strong></article> }
function SectionTitle({ title }: { title: string }) { return <div className="profile-section-title"><h2>{title}</h2></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
