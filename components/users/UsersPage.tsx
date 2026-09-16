'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Check, Pencil, Plus, ShieldCheck, UserRoundX, X } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from '@/components/Pagination'
import { notifyToast } from '@/components/ui/toast-events'
import { formatDate } from '@/utils/date-format'

type AdminUser = { id: string; name: string; email: string; role: 'ADMIN' | 'SUPER_ADMIN'; status: 'ACTIVE' | 'INACTIVE'; lastLoginAt: string | null; createdAt: string }
type UserResponse = { users: AdminUser[]; total: number; page: number; pageSize: number; totalPages: number }
type UserForm = { name: string; email: string; password: string; role: 'ADMIN' | 'SUPER_ADMIN'; status: 'ACTIVE' | 'INACTIVE' }
const emptyForm: UserForm = { name: '', email: '', password: '', role: 'ADMIN', status: 'ACTIVE' }
const date = (value: string | null) => formatDate(value, undefined, 'Never')

export default function UsersPage() {
  const [data, setData] = useState<UserResponse | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const users = data?.users ?? []

  const load = useCallback(async () => {
    setLoading(true)
    const response = await fetch(`/api/users?page=${page}&pageSize=${pageSize}`)
    if (response.ok) setData(await response.json())
    else setError('Unable to load admin users.')
    setLoading(false)
  }, [page, pageSize])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])
  function update(field: keyof UserForm, value: string) { setForm((current) => ({ ...current, [field]: value } as UserForm)); setError('') }
  function startCreate() { setEditingId(null); setForm(emptyForm); setError(''); setShowForm(true) }
  function startEdit(user: AdminUser) { setEditingId(user.id); setForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status }); setError(''); setShowForm(true) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('')
    const response = await fetch(editingId ? `/api/users/${editingId}` : '/api/users', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...(editingId && !form.password ? { password: undefined } : {}) }) })
    if (!response.ok) { const payload = await response.json().catch(() => ({})); setError(payload.error || 'Unable to save admin user.'); setPending(false); return }
    setShowForm(false); setForm(emptyForm); setPending(false); await load()
  }

  async function toggleStatus(user: AdminUser) {
    if (pending || statusPendingId) return
    if (user.status === 'ACTIVE' && !window.confirm(`Are you sure you want to deactivate ${user.name} (${user.email})? They will no longer be able to sign in.`)) return
    setStatusPendingId(user.id)
    const response = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: user.name, email: user.email, role: user.role, status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }) })
    if (!response.ok) { const payload = await response.json().catch(() => ({})); setError(payload.error || 'Unable to update user status.'); setStatusPendingId(null); return }
    await load(); notifyToast(user.status === 'ACTIVE' ? 'Admin deactivated successfully.' : 'Admin activated successfully.'); setStatusPendingId(null)
  }

  return <main className="users-page"><header className="users-header"><div><Link href="/settings" className="back-link">Settings</Link><p className="eyebrow">Access control</p><h1>Admin users</h1><p className="settings-copy">Create and manage the administrators who can access the workspace.</p></div><button className="primary-button" type="button" disabled={pending || Boolean(statusPendingId)} onClick={startCreate}><Plus size={16} /> Add admin user</button></header>{error ? <div className="loan-warning users-message"><strong>Action required</strong><span>{error}</span></div> : null}<section className="users-panel panel"><div className="users-panel-heading"><div><h2>Administrator accounts</h2><p>{data?.total ?? 0} admin users · customer accounts are not managed here</p></div><ShieldCheck size={21} /></div><div className="users-table">{loading ? <div className="directory-empty loading-state">Loading admin users...</div> : users.length === 0 ? <div className="directory-empty">No admin users found.</div> : users.map((user) => <div className="user-row" key={user.id}><div className="user-identity"><span className="user-avatar small">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div><span className="user-role">{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</span><span className={`status ${user.status.toLowerCase()}`}>{user.status}</span><span className="user-last-login">{date(user.lastLoginAt)}</span><div className="user-actions"><button type="button" disabled={Boolean(statusPendingId)} onClick={() => startEdit(user)} aria-label={`Edit ${user.name}`}><Pencil size={15} /></button><button type="button" disabled={Boolean(statusPendingId)} onClick={() => void toggleStatus(user)} aria-label={`${user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${user.name}`}>{statusPendingId === user.id ? <span className="loading-spinner small" /> : user.status === 'ACTIVE' ? <UserRoundX size={15} /> : <Check size={15} />}</button></div></div>)}</div>{data ? <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} /> : null}</section>{showForm ? <div className="modal-backdrop" role="presentation"><form className="user-form panel" onSubmit={submit}><div className="users-panel-heading"><div><p className="eyebrow">{editingId ? 'Edit account' : 'New account'}</p><h2>{editingId ? 'Edit admin user' : 'Create admin user'}</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18} /></button></div><label>Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><div className="settings-form-row"><label>Role<select value={form.role} onChange={(event) => update('role', event.target.value)}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label><label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label></div><label>{editingId ? 'New password (optional)' : 'Password'}<input {...(editingId ? {} : { required: true })} type="password" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} /></label><div className="user-form-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={pending}>{pending ? 'Saving...' : editingId ? 'Save changes' : 'Create user'}</button></div></form></div> : null}</main>
}
