'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Check, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { notifyToast } from '@/components/ui/toast-events'

type Settings = { organizationName: string; organizationLogoUrl: string | null; address: string | null; phone: string | null; email: string | null; currency: string; dateFormat: string; defaultInterestRate: string; defaultLoanTerm: number; defaultRepaymentFrequency: string }
type FormState = Omit<Settings, 'organizationLogoUrl' | 'address' | 'phone' | 'email' | 'defaultInterestRate' | 'defaultLoanTerm'> & { organizationLogoUrl: string; address: string; phone: string; email: string; defaultInterestRate: string; defaultLoanTerm: string }
const emptyForm: FormState = { organizationName: '', organizationLogoUrl: '', address: '', phone: '', email: '', currency: 'GHS', dateFormat: 'DD/MM/YYYY', defaultInterestRate: '0', defaultLoanTerm: '12', defaultRepaymentFrequency: 'MONTHLY' }

export default function SystemSettings() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/settings/system')
      if (response.ok) {
        const settings: Settings = await response.json()
        window.localStorage.setItem('lendgh-date-format', settings.dateFormat)
        setForm({ organizationName: settings.organizationName, organizationLogoUrl: settings.organizationLogoUrl ?? '', address: settings.address ?? '', phone: settings.phone ?? '', email: settings.email ?? '', currency: settings.currency, dateFormat: settings.dateFormat, defaultInterestRate: String(settings.defaultInterestRate), defaultLoanTerm: String(settings.defaultLoanTerm), defaultRepaymentFrequency: settings.defaultRepaymentFrequency })
      }
    }
    void load()
  }, [])

  function updateField(field: keyof FormState, value: string) { setForm((current) => ({ ...current, [field]: value })); setSaved(false) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(''); setSaved(false)
    const response = await fetch('/api/settings/system', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, defaultInterestRate: Number(form.defaultInterestRate), defaultLoanTerm: Number(form.defaultLoanTerm) }) })
    if (!response.ok) { setError('Please check the values and try again.'); setPending(false); return }
    window.localStorage.setItem('lendgh-date-format', form.dateFormat)
    setSaved(true); notifyToast('Settings updated successfully.'); setPending(false)
  }

  return <main className="settings-page"><header className="settings-header"><div><Link href="/" className="back-link"><ArrowLeft size={15} /> Dashboard</Link><p className="eyebrow">System settings</p><h1>Organization settings</h1><p className="settings-copy">Configure the identity and default lending rules for your workspace.</p></div><span className="settings-icon"><Settings2 size={20} /></span></header><form className="system-settings-form panel" onSubmit={submit}><div className="settings-section-title"><div><h2>General configuration</h2><p>These values are used across admin operations and generated records.</p></div>{saved && <span className="saved-state"><Check size={14} /> Saved</span>}</div><div className="settings-form-row"><label>Organization name<input required value={form.organizationName} onChange={(event) => updateField('organizationName', event.target.value)} /></label><label>Currency<input required value={form.currency} onChange={(event) => updateField('currency', event.target.value)} /></label></div><label>Logo URL<input type="url" value={form.organizationLogoUrl} onChange={(event) => updateField('organizationLogoUrl', event.target.value)} placeholder="https://..." /></label><label>Address<textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} rows={2} /></label><div className="settings-form-row"><label>Phone<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label><label>Email<input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label></div><div className="settings-form-row"><label>Date format<select value={form.dateFormat} onChange={(event) => updateField('dateFormat', event.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label><label>Default interest rate (%)<input required type="number" min="0" max="100" step="0.01" value={form.defaultInterestRate} onChange={(event) => updateField('defaultInterestRate', event.target.value)} /></label></div><div className="settings-form-row"><label>Default loan term (months)<input required type="number" min="1" max="120" value={form.defaultLoanTerm} onChange={(event) => updateField('defaultLoanTerm', event.target.value)} /></label><label>Default repayment frequency<select value={form.defaultRepaymentFrequency} onChange={(event) => updateField('defaultRepaymentFrequency', event.target.value)}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="BIWEEKLY">Biweekly</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option></select></label></div>{error && <p className="login-error">{error}</p>}<button className="primary-button" type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save settings'} <Check size={17} /></button></form></main>
}
