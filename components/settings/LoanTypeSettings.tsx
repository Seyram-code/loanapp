'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Check, Plus, Settings2 } from 'lucide-react'
import Link from 'next/link'

type LoanType = { id: string; name: string; description: string | null; defaultInterestRate: string; defaultTerm: number; defaultTermUnit: 'DAY' | 'WEEK' | 'MONTH'; repaymentFrequency: string; minimumAmount: string; maximumAmount: string; status: 'ACTIVE' | 'INACTIVE' }
type FormState = { name: string; description: string; defaultInterestRate: string; defaultTerm: string; defaultTermUnit: 'DAY' | 'WEEK' | 'MONTH'; repaymentFrequency: string; minimumAmount: string; maximumAmount: string }
const emptyForm: FormState = { name: '', description: '', defaultInterestRate: '', defaultTerm: '', defaultTermUnit: 'MONTH', repaymentFrequency: 'MONTHLY', minimumAmount: '', maximumAmount: '' }

export default function LoanTypeSettings() {
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function loadLoanTypes() {
    const response = await fetch('/api/settings/loan-types')
    if (response.ok) {
      // oxlint-disable-next-line react/set-state-in-effect
      setLoanTypes(await response.json())
    }
  }
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void loadLoanTypes() }, [])

  function updateField(field: keyof FormState, value: string) { setForm((current) => ({ ...current, [field]: value })) }
  function editLoanType(loanType: LoanType) { setEditingId(loanType.id); setForm({ name: loanType.name, description: loanType.description ?? '', defaultInterestRate: String(loanType.defaultInterestRate), defaultTerm: String(loanType.defaultTerm), defaultTermUnit: loanType.defaultTermUnit, repaymentFrequency: loanType.repaymentFrequency, minimumAmount: String(loanType.minimumAmount), maximumAmount: String(loanType.maximumAmount) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function resetForm() { setEditingId(null); setForm(emptyForm); setError('') }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('')
    const payload = { ...form, defaultInterestRate: Number(form.defaultInterestRate), defaultTerm: Number(form.defaultTerm), minimumAmount: Number(form.minimumAmount), maximumAmount: Number(form.maximumAmount), status: 'ACTIVE' }
    const response = await fetch(editingId ? `/api/settings/loan-types/${editingId}` : '/api/settings/loan-types', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) {
      const result = await response.json().catch(() => null)
      setError(result?.error || 'Unable to save loan type. Please try again.')
      setPending(false)
      return
    }
    await loadLoanTypes(); resetForm(); setPending(false)
  }

  return <main className="settings-page"><header className="settings-header"><div><Link href="/" className="back-link"><ArrowLeft size={15} /> Dashboard</Link><p className="eyebrow">System settings</p><h1>Loan types</h1><p className="settings-copy">Configure the products your team can use when creating loans.</p></div><span className="settings-icon"><Settings2 size={20} /></span></header><section className="settings-grid"><form className="settings-form panel" onSubmit={submit}><div className="settings-section-title"><div><h2>{editingId ? 'Edit loan type' : 'Add loan type'}</h2><p>Defaults can be adjusted on individual loans later.</p></div>{editingId && <button type="button" className="text-button" onClick={resetForm}>Cancel</button>}</div><label>Name<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="e.g. Personal Loan" /></label><label>Description<textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Short internal description" rows={3} /></label><div className="settings-form-row"><label>Interest rate (%)<input required type="number" min="0" max="100" step="0.01" value={form.defaultInterestRate} onChange={(event) => updateField('defaultInterestRate', event.target.value)} /></label><label>Term<input required type="number" min="1" max="120" value={form.defaultTerm} onChange={(event) => updateField('defaultTerm', event.target.value)} /></label></div><label>Term unit<select value={form.defaultTermUnit} onChange={(event) => updateField('defaultTermUnit', event.target.value)}><option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option></select></label><label>Repayment frequency<select value={form.repaymentFrequency} onChange={(event) => updateField('repaymentFrequency', event.target.value)}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="BIWEEKLY">Biweekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option></select></label><div className="settings-form-row"><label>Minimum amount<input required type="number" min="0" step="0.01" value={form.minimumAmount} onChange={(event) => updateField('minimumAmount', event.target.value)} /></label><label>Maximum amount<input required type="number" min="0" step="0.01" value={form.maximumAmount} onChange={(event) => updateField('maximumAmount', event.target.value)} /></label></div>{error && <p className="login-error">{error}</p>}<button className="primary-button" type="submit" disabled={pending}>{editingId ? <Check size={17} /> : <Plus size={17} />}{pending ? 'Saving...' : editingId ? 'Save changes' : 'Add loan type'}</button></form><section className="loan-types-list panel"><div className="settings-section-title"><div><h2>Configured types</h2><p>{loanTypes.length} available products</p></div></div>{loanTypes.length === 0 ? <div className="settings-empty">No loan types configured yet.</div> : <div className="loan-type-items">{loanTypes.map((loanType) => <article className="loan-type-item" key={loanType.id}><div><div className="loan-type-name"><strong>{loanType.name}</strong><span className={`settings-status ${loanType.status.toLowerCase()}`}>{loanType.status}</span></div><p>{loanType.description || 'No description provided.'}</p><small>{loanType.defaultInterestRate}% · {loanType.defaultTerm} {loanType.defaultTermUnit === 'DAY' ? 'day' : loanType.defaultTermUnit === 'WEEK' ? 'week' : 'month'}{loanType.defaultTerm === 1 ? '' : 's'} · {loanType.repaymentFrequency.toLowerCase()} · GHS {Number(loanType.minimumAmount).toLocaleString()} - GHS {Number(loanType.maximumAmount).toLocaleString()}</small></div><div className="loan-type-actions"><button type="button" className="text-button" onClick={() => editLoanType(loanType)}>Edit</button></div></article>)}</div>}</section></section></main>
}
