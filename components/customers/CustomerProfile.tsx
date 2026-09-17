'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock3, Mail, Phone, Printer, UserRound } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'

type CustomerRecord = { firstName: string; middleName: string | null; lastName: string; customerNumber: string; status: string; phone: string; email: string | null; dateOfBirth: string | null; gender: string | null; alternatePhone: string | null; nationalId: string | null; address: string | null; city: string | null; region: string | null; country: string | null; occupation: string | null; employer: string | null; monthlyIncome: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null; notes: string | null }
type CustomerLoan = { id: string; loanNumber: string; loanType: { name: string }; requestedAmount: string; disbursed: string; status: string; createdAt: string }
type CustomerRepayment = { id: string; repaymentNumber: string; loan: { loanNumber: string }; amount: string; paymentMethod: string; paymentDate: string; recordedBy: { name: string } }
type ReferredLoan = { id: string; loanNumber: string; customer: { name: string; customerNumber: string }; loanType: string; requestedAmount: string; disbursed: string; outstanding: string; status: string; createdAt: string; repayments: Array<{ id: string; repaymentNumber: string; amount: string; paymentMethod: string; paymentDate: string; recordedBy: { name: string } }> }
type Profile = { customer: CustomerRecord; summary: { totalBorrowed: string; totalRepaid: string; outstandingBalance: string; overdueAmount: string; activeLoans: number; completedLoans: number }; loans: CustomerLoan[]; referredLoans: ReferredLoan[]; repayments: CustomerRepayment[]; activity: Array<{ action: string; description: string; admin: string; createdAt: string }> }

const money = (value: string) => `GHS ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CustomerProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}/profile`).then((response) => response.ok ? response.json() : null).then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [id])

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
            <div>
              <p className="eyebrow">Customer profile</p>
              <h1>{name}</h1>
              <p className="profile-number">{customer.customerNumber} · <span className={`status ${customer.status.toLowerCase()}`}>{customer.status}</span></p>
            </div>
          </div>
        </div>
        <div className="profile-header-actions">
          <div className="profile-contact"><span><Phone size={14} /> {customer.phone}</span><span><Mail size={14} /> {customer.email || 'No email'}</span></div>
          <button type="button" className="secondary-button" onClick={() => window.print()} aria-label="Print customer form">
            <Printer size={14} /> Print form
          </button>
        </div>
      </header>

      <section className="printable-customer-form panel">
        <div className="print-form-header">
          <div>
            <p className="eyebrow">Customer form</p>
            <h2>{name}</h2>
            <p>{customer.customerNumber} · <span className={`status ${customer.status.toLowerCase()}`}>{customer.status}</span></p>
          </div>
          <button type="button" className="secondary-button" onClick={() => window.print()} aria-label="Print customer form">
            <Printer size={14} /> Print form
          </button>
        </div>

        <div className="print-form-grid">
          <div className="print-form-card">
            <h3>Personal information</h3>
            <dl className="print-form-list">
              <PrintDetail label="Full name" value={name} />
              <PrintDetail label="Date of birth" value={customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '—'} />
              <PrintDetail label="Gender" value={customer.gender || '—'} />
              <PrintDetail label="National ID" value={customer.nationalId || '—'} />
              <PrintDetail label="Phone" value={customer.phone || '—'} />
              <PrintDetail label="Alternate phone" value={customer.alternatePhone || '—'} />
              <PrintDetail label="Email" value={customer.email || '—'} />
              <PrintDetail label="Address" value={[customer.address, customer.city, customer.region, customer.country].filter(Boolean).join(', ') || '—'} />
            </dl>
          </div>

          <div className="print-form-card">
            <h3>Employment and contacts</h3>
            <dl className="print-form-list">
              <PrintDetail label="Occupation" value={customer.occupation || '—'} />
              <PrintDetail label="Employer" value={customer.employer || '—'} />
              <PrintDetail label="Monthly income" value={customer.monthlyIncome ? money(customer.monthlyIncome) : '—'} />
              <PrintDetail label="Emergency contact" value={customer.emergencyContactName ? `${customer.emergencyContactName} · ${customer.emergencyContactPhone || ''}` : '—'} />
              <PrintDetail label="Notes" value={customer.notes || '—'} />
              <PrintDetail label="Active loans" value={String(summary.activeLoans)} />
              <PrintDetail label="Outstanding balance" value={money(summary.outstandingBalance)} />
              <PrintDetail label="Overdue amount" value={money(summary.overdueAmount)} />
            </dl>
          </div>
        </div>
      </section>

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
          <ActivityList activity={profile.activity} />
        </article>
      </section>

      {showActivity ? <Modal open title={`${name} activity`} className="profile-activity-modal" onClose={() => setShowActivity(false)}><div className="profile-activity-scroll"><ActivityList activity={profile.activity} /></div></Modal> : null}

      <article className="profile-section panel">
        <SectionTitle title="Loans" />
        <div className="profile-table">
          <div className="profile-table-row profile-table-head"><span>Loan number</span><span>Type</span><span>Requested</span><span>Disbursed</span><span>Status</span><span>Created</span></div>
          {profile.loans.length ? profile.loans.map((loan) => <div className="profile-table-row" key={loan.id}><strong>{loan.loanNumber}</strong><span>{loan.loanType.name}</span><span>{money(loan.requestedAmount)}</span><span>{money(loan.disbursed)}</span><span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span><span>{new Date(loan.createdAt).toLocaleDateString()}</span></div>) : <div className="directory-empty">No loans recorded.</div>}
        </div>
      </article>

      <article className="profile-section panel">
        <SectionTitle title="Referred loans" />
        <p className="profile-section-copy">Track loans and repayments from customers referred by {name}.</p>
        {profile.referredLoans.length ? profile.referredLoans.map((loan) => (
          <div className="referred-loan-card" key={loan.id}>
            <div className="referred-loan-header"><div><strong>{loan.loanNumber}</strong><span>{loan.customer.name} · {loan.customer.customerNumber}</span></div><span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span></div>
            <div className="referred-loan-summary"><span>Loan type<strong>{loan.loanType}</strong></span><span>Disbursed<strong>{money(loan.disbursed)}</strong></span><span>Outstanding<strong>{money(loan.outstanding)}</strong></span></div>
            <div className="profile-table">
              <div className="profile-table-row repayment-head"><span>Repayment number</span><span>Amount</span><span>Method</span><span>Payment date</span><span>Recorded by</span></div>
              {loan.repayments.length ? loan.repayments.map((repayment) => <div className="profile-table-row repayment-head" key={repayment.id}><strong>{repayment.repaymentNumber}</strong><span>{money(repayment.amount)}</span><span>{repayment.paymentMethod.replaceAll('_', ' ')}</span><span>{new Date(repayment.paymentDate).toLocaleDateString()}</span><span>{repayment.recordedBy.name}</span></div>) : <div className="directory-empty">No repayments recorded for this loan.</div>}
            </div>
          </div>
        )) : <div className="directory-empty">No referred loans recorded.</div>}
      </article>

      <article className="profile-section panel">
        <SectionTitle title="Repayments" />
        <div className="profile-table">
          <div className="profile-table-row repayment-head"><span>Repayment number</span><span>Loan</span><span>Amount</span><span>Method</span><span>Payment date</span><span>Recorded by</span></div>
          {profile.repayments.length ? profile.repayments.map((repayment) => <div className="profile-table-row repayment-head" key={repayment.id}><strong>{repayment.repaymentNumber}</strong><span>{repayment.loan.loanNumber}</span><span>{money(repayment.amount)}</span><span>{repayment.paymentMethod.replaceAll('_', ' ')}</span><span>{new Date(repayment.paymentDate).toLocaleDateString()}</span><span>{repayment.recordedBy.name}</span></div>) : <div className="directory-empty">No repayments recorded.</div>}
        </div>
      </article>
    </main>
  )
}

function ActivityList({ activity }: { activity: Profile['activity'] }) {
  return <div className="profile-activity profile-activity-preview">{activity.length ? activity.map((item, index) => <div className="profile-activity-item" key={`${item.createdAt}-${index}`}><span className="activity-dot blue" /><div><strong>{item.action}</strong><p>{item.description}</p><small>{item.admin} · {new Date(item.createdAt).toLocaleString()}</small></div></div>) : <div className="directory-empty">No activity recorded.</div>}</div>
}

function Summary({ label, value, icon, negative }: { label: string; value: string; icon: React.ReactNode; negative?: boolean }) { return <article className={`profile-summary-card ${negative ? 'negative-card' : ''}`}><span>{icon}</span><small>{label}</small><strong>{value}</strong></article> }
function SectionTitle({ title }: { title: string }) { return <div className="profile-section-title"><h2>{title}</h2></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
function PrintDetail({ label, value }: { label: string; value: string }) { return <div className="print-form-item"><dt>{label}</dt><dd>{value}</dd></div> }
