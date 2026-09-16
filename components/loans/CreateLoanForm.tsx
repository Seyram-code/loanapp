'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import Decimal from 'decimal.js'
import './create-loan.css'

type Customer = { id: string; name: string; customerNumber: string }
type LoanType = { id: string; name: string; defaultInterestRate: string; defaultTerm: number; repaymentFrequency: string; minimumAmount: string; maximumAmount: string }
type FormState = { customerId: string; loanTypeId: string; requestedAmount: string; interestRate: string; interestType: 'FLAT' | 'REDUCING_BALANCE'; term: string; termUnit: 'WEEK' | 'MONTH'; repaymentFrequency: string; purpose: string; applicationDate: string; notes: string }

const initialForm: FormState = { customerId: '', loanTypeId: '', requestedAmount: '', interestRate: '', interestType: 'FLAT', term: '', termUnit: 'MONTH', repaymentFrequency: 'MONTHLY', purpose: '', applicationDate: new Date().toISOString().slice(0, 10), notes: '' }

async function logoutOnSessionExpiry() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.assign('/login?next=/loans/new')
}

function calculate(amount: string, rate: string, term: string, interestType: FormState['interestType'], repaymentFrequency: string) {
  const principal = new Decimal(amount || 0)
  const installments = new Decimal(term || 0)
  if (principal.isZero() || installments.isZero()) return { interest: '0.00', total: '0.00', installment: '0.00' }
  const percentage = new Decimal(rate || 0).div(100)
  const periodsPerYear: Record<string, number> = { DAILY: 365, WEEKLY: 52, BIWEEKLY: 26, MONTHLY: 12, QUARTERLY: 4 }
  const periodicRate = percentage.div(periodsPerYear[repaymentFrequency] ?? 12)
  const interest = interestType === 'FLAT' ? principal.mul(percentage) : principal.mul(periodicRate.add(1).pow(installments).sub(1))
  const total = principal.add(interest)
  return { interest: interest.toFixed(2), total: total.toFixed(2), installment: total.div(installments).toFixed(2) }
}

export default function CreateLoanForm() {
  const [form, setForm] = useState(initialForm)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/customers?pageSize=50'), fetch('/api/settings/loan-types')]).then(async ([customerResponse, typeResponse]) => {
      if (customerResponse.status === 401 || typeResponse.status === 401) {
        void logoutOnSessionExpiry()
        return null
      }
      return Promise.all([customerResponse.json(), typeResponse.json()])
    }).then((result) => {
      if (!result) return
      const [customerData, typeData] = result
      setCustomers(customerData.customers ?? [])
      setLoanTypes(typeData ?? [])
    })
  }, [])

  const selectedType = loanTypes.find((type) => type.id === form.loanTypeId)
  const estimate = useMemo(() => calculate(form.requestedAmount, form.interestRate, form.term, form.interestType, form.repaymentFrequency), [form.requestedAmount, form.interestRate, form.term, form.interestType, form.repaymentFrequency])

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    const response = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, requestedAmount: Number(form.requestedAmount), interestRate: Number(form.interestRate), term: Number(form.term), applicationDate: new Date(form.applicationDate) }) })
    const result = await response.json()
    if (!response.ok) {
      if (response.status === 401) {
        await logoutOnSessionExpiry()
        return
      }
      setError(result.error || 'Please check the loan details.')
      setPending(false)
      return
    }
    setSuccess(`Loan ${result.loanNumber} created successfully.`)
    setPending(false)
    setForm(initialForm)
  }

  return <main className="create-loan-page">
    <header className="create-loan-header"><div><Link href="/loans" className="back-link"><ArrowLeft size={15} /> Loans</Link><p className="eyebrow">Loan application</p><h1>Create loan</h1><p className="settings-copy">Create a loan on behalf of a customer.</p></div></header>
    {success && <div className="customer-success"><Check size={15} /> {success}</div>}
    <div className="create-loan-grid">
      <form className="create-loan-form panel" onSubmit={submit}>
        <div className="settings-section-title"><div><h2>Loan details</h2><p>Review the estimate before submitting.</p></div></div>
        <label>Customer<select required value={form.customerId} onChange={(event) => update('customerId', event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customerNumber} - {customer.name}</option>)}</select></label>
        <label>Loan type<select required value={form.loanTypeId} onChange={(event) => { const type = loanTypes.find((item) => item.id === event.target.value); update('loanTypeId', event.target.value); if (type) setForm((current) => ({ ...current, loanTypeId: type.id, interestRate: String(type.defaultInterestRate), term: String(type.defaultTerm), repaymentFrequency: type.repaymentFrequency })) }}><option value="">Select loan type</option>{loanTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
        <div className="settings-form-row"><label>Requested amount<input required type="number" min="100" max={selectedType?.maximumAmount} step="0.01" value={form.requestedAmount} onChange={(event) => update('requestedAmount', event.target.value)} /></label><label>Application date<input required type="date" value={form.applicationDate} onChange={(event) => update('applicationDate', event.target.value)} /></label></div>
        <div className="settings-form-row"><label>Interest rate (%)<input required type="number" min="0" max="100" step="0.01" value={form.interestRate} onChange={(event) => update('interestRate', event.target.value)} /></label><label>Interest type<select value={form.interestType} onChange={(event) => update('interestType', event.target.value)}><option value="FLAT">Flat</option><option value="REDUCING_BALANCE">Reducing balance</option></select></label></div>
        <div className="settings-form-row"><label>Payment term<input required type="number" min="1" max="120" value={form.term} onChange={(event) => update('term', event.target.value)} /></label><label>Term unit<select value={form.termUnit} onChange={(event) => update('termUnit', event.target.value)}><option value="WEEK">Week</option><option value="MONTH">Month</option></select></label></div>
        <label>Repayment frequency<select value={form.repaymentFrequency} onChange={(event) => update('repaymentFrequency', event.target.value)}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="BIWEEKLY">Biweekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option></select></label>
        <label>Purpose<input value={form.purpose} onChange={(event) => update('purpose', event.target.value)} maxLength={255} /></label>
        <label>Notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={3} /></label>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={pending}>{pending ? 'Creating...' : 'Create loan'} <Check size={16} /></button>
      </form>
      <aside className="loan-estimate panel"><p className="eyebrow">Before submission</p><h2>Repayment estimate</h2><div className="estimate-list"><div><span>Interest amount</span><strong>GHS {estimate.interest}</strong></div><div><span>Total repayment</span><strong>GHS {estimate.total}</strong></div><div className="estimate-highlight"><span>Estimated installment</span><strong>GHS {estimate.installment}</strong><small>Per {form.repaymentFrequency.toLowerCase()}</small></div></div><p className="estimate-note">Final amounts are generated from the approved loan terms and repayment schedule.</p></aside>
    </div>
  </main>
}
