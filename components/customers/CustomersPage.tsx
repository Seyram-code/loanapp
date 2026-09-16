'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, Search, UserRoundX } from 'lucide-react'
import Link from 'next/link'
import type { CustomerPage } from '@/types/customer'
import CustomerForm from './CustomerForm'
import { notifyToast } from '@/components/ui/toast-events'

export default function CustomersPage() {
  const [data, setData] = useState<CustomerPage | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string>()
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '10', sort, direction })
    if (query) params.set('query', query)
    if (status) params.set('status', status)
    const response = await fetch(`/api/customers?${params}`)
    if (response.ok) setData(await response.json())
    setLoading(false)
  }, [query, status, sort, direction, page])

  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void load() }, [load])

  function toggleSort(field: string) {
    if (sort === field) setDirection(direction === 'asc' ? 'desc' : 'asc')
    else { setSort(field); setDirection('asc') }
    setPage(1)
  }

  async function toggleStatus(customer: CustomerPage['customers'][number]) {
    if (customer.status === 'ACTIVE' && !window.confirm(`Are you sure you want to deactivate ${customer.name} (${customer.customerNumber})? Existing loan records will be retained.`)) return
    const response = await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    })
    if (response.ok) notifyToast(customer.status === 'ACTIVE' ? 'Customer deactivated successfully.' : 'Customer activated successfully.')
    await load()
  }

  function openCreate() {
    setEditingCustomerId(undefined)
    setShowForm(true)
  }

  function openEdit(customerId: string) {
    setEditingCustomerId(customerId)
    setShowForm(true)
  }

  return (
    <main className="directory-page">
      <header className="directory-header">
        <div>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
          <p className="eyebrow">Customer management</p>
          <h1>Customers</h1>
          <p className="settings-copy">Manage customer records, lending relationships, and account status.</p>
        </div>
        <button className="primary-button" onClick={openCreate}><Plus size={17} /> Add customer</button>
      </header>

      {success && <div className="customer-success"><CheckIcon /> {success}</div>}

      <section className="directory-panel panel">
        <div className="directory-toolbar">
          <div className="search-box directory-search">
            <Search size={17} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search number, name, phone, or email" aria-label="Search customers" />
          </div>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter customer status">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <span className="directory-count">{data?.total ?? 0} customers</span>
        </div>

        <div className="customer-table">
          <div className="customer-row customer-head">
            <button onClick={() => toggleSort('customerNumber')}>Customer number</button>
            <button onClick={() => toggleSort('name')}>Name</button>
            <span>Phone</span><span>Email</span><span>Occupation</span><span>Active loans</span><span>Outstanding</span>
            <button onClick={() => toggleSort('status')}>Status</button>
            <button onClick={() => toggleSort('createdAt')}>Created</button>
            <span>Actions</span>
          </div>

          {loading ? <div className="directory-empty">Loading customers...</div> : data?.customers.map((customer) => (
            <div className="customer-row" key={customer.id}>
              <span className="customer-number">{customer.customerNumber}</span>
              <strong>{customer.name}</strong>
              <span>{customer.phone}</span>
              <span>{customer.email || '—'}</span>
              <span>{customer.occupation || '—'}</span>
              <span>{customer.activeLoans}</span>
              <span>GHS {Number(customer.totalOutstanding).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className={`status ${customer.status.toLowerCase()}`}>{customer.status}</span>
              <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
              <div className="customer-actions">
                <Link href={`/customers/${customer.id}`} className="icon-button" aria-label={`View ${customer.name}`} title="View customer profile"><Eye size={15} /></Link>
                <button aria-label={`Edit ${customer.name}`} title="Edit customer" onClick={() => openEdit(customer.id)}><Pencil size={15} /></button>
                <button aria-label={`${customer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${customer.name}`} onClick={() => void toggleStatus(customer)}>{customer.status === 'ACTIVE' ? <UserRoundX size={15} /> : <CheckIcon />}</button>
                <button aria-label="More actions"><MoreHorizontal size={15} /></button>
              </div>
            </div>
          ))}

          {!loading && !data?.customers.length && <div className="directory-empty">No customers match the current filters.</div>}
        </div>

        <footer className="directory-footer">
          <span>Page {data?.page ?? 1} of {data?.totalPages || 1}</span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <button disabled={!data || page >= data.totalPages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </footer>
      </section>

      {showForm && <CustomerForm customerId={editingCustomerId} onClose={() => setShowForm(false)} onCreated={(customerNumber) => { setShowForm(false); setSuccess(`Customer ${customerNumber} ${editingCustomerId ? 'updated' : 'created'} successfully.`); setPage(1); void load() }} />}
    </main>
  )
}

function CheckIcon() { return <span className="check-icon">✓</span> }
