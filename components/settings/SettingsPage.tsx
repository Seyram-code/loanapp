'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Building2, ChevronRight, LockKeyhole, Settings2, ShieldCheck, UserRound } from 'lucide-react'
import Link from 'next/link'
import { notifyToast } from '@/components/ui/toast-events'

type Profile = { name: string; email: string; role: string }

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', role: 'ADMIN' })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetch('/api/settings/profile').then((response) => response.ok ? response.json() : null).then((data: Profile | null) => { if (data) setProfile(data) }).catch(() => setError('Unable to load your profile.'))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setSaved(false)
    setError('')
    const response = await fetch('/api/settings/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profile.name, email: profile.email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }) })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload.error || 'Unable to update your profile.')
      setPending(false)
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setSaved(true)
    notifyToast('Settings updated successfully.')
    setPending(false)
  }

  return <main className="settings-page"><header className="settings-header"><div><Link href="/dashboard" className="back-link">Dashboard</Link><p className="eyebrow">Workspace configuration</p><h1>Settings</h1><p className="settings-copy">Manage organization defaults, lending products, and your administrator profile.</p></div><span className="settings-icon"><Settings2 size={20} /></span></header><div className="settings-hub-grid"><section className="settings-links panel"><div className="settings-section-title"><div><h2>Configuration</h2><p>Control how Lendgh operates across your team.</p></div></div><Link className="settings-link-card" href="/settings/system"><span className="settings-link-icon"><Building2 size={18} /></span><span><strong>Organization and system</strong><small>Name, logo, contact details, currency, and date format</small></span><ChevronRight size={17} /></Link><Link className="settings-link-card" href="/settings/loan-types"><span className="settings-link-icon"><Settings2 size={18} /></span><span><strong>Loan types</strong><small>Interest defaults, loan terms, amounts, and repayment frequencies</small></span><ChevronRight size={17} /></Link><Link className="settings-link-card" href="/users"><span className="settings-link-icon"><ShieldCheck size={18} /></span><span><strong>Admin users</strong><small>Create administrators, assign roles, and manage account access</small></span><ChevronRight size={17} /></Link></section><form className="settings-form panel" onSubmit={submit}><div className="settings-section-title"><div><h2>Admin profile</h2><p>Only authorized administrators can change sensitive account details.</p></div>{saved ? <span className="saved-state">Saved</span> : null}</div><label>Name<input required value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></label><label>Email<input required type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label><div className="profile-role"><UserRound size={15} /><span>Role</span><strong>{profile.role.replace('_', ' ')}</strong></div><div className="settings-divider"><LockKeyhole size={15} /><span>Password</span></div><label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Required only to change password" /></label><label>New password<input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" /></label>{error ? <p className="login-error">{error}</p> : null}<button className="primary-button" type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save profile'}</button></form></div></main>
}
