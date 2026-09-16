'use client'

import { useCallback, useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import './loans-page.css'
import { DirectoryFilters } from '@/components/DirectoryFilters'
import { Pagination } from '@/components/Pagination'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { DateDisplay } from '@/components/ui/DateDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/StateViews'

type Loan = { id: string; loanNumber: string; customer: string; loanType: string; amount: string; interest: string; term: string; outstanding: string; dueDate: string | null; status: string; createdAt: string }
type Page = { loans: Loan[]; total: number; page: number; pageSize: number; totalPages: number }

const tabs = ['ALL', 'PENDING', 'UNDER REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'OVERDUE', 'DEFAULTED']

export default function LoansPage() {
  const [data, setData] = useState<Page | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loanTypeId, setLoanTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loanTypes, setLoanTypes] = useState<Array<{ id: string; name: string }>>([])
  const [sort, setSort] = useState('createdAt')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, direction })
    if (query) params.set('query', query)
    if (status !== 'ALL') params.set('status', status)
    if (loanTypeId) params.set('loanTypeId', loanTypeId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const response = await fetch(`/api/loans?${params}`)
    if (response.ok) setData(await response.json())
    setLoading(false)
  }, [query, status, loanTypeId, startDate, endDate, sort, direction, page, pageSize])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])
  useEffect(() => { fetch('/api/loan-types').then((response) => response.ok ? response.json() : []).then(setLoanTypes) }, [])

  function sortBy(field: string) {
    if (sort === field) setDirection(direction === 'asc' ? 'desc' : 'asc')
    else {
      setSort(field)
      setDirection('asc')
    }
    setPage(1)
  }

  return (
    <main className="directory-page">
      <header className="directory-header">
        <div>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
          <p className="eyebrow">Loan management</p>
          <h1>Loans</h1>
          <p className="settings-copy">Review applications, approvals, balances, and loan performance.</p>
        </div>
        <Link href="/loans/new" className="primary-button">+ New loan</Link>
      </header>

      <section className="directory-panel panel">
        <div className="loan-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={status === tab ? 'active' : ''}
              onClick={() => {
                setStatus(tab)
                setPage(1)
              }}
            >
              {tab.replace('UNDER REVIEW', 'Under review').replace('ALL', 'All').replace('PENDING', 'Pending').replace('APPROVED', 'Approved').replace('ACTIVE', 'Active').replace('COMPLETED', 'Completed').replace('REJECTED', 'Rejected').replace('OVERDUE', 'Overdue').replace('DEFAULTED', 'Defaulted')}
            </button>
          ))}
        </div>

        <DirectoryFilters query={query} onQueryChange={(value) => { setQuery(value); setPage(1) }} queryPlaceholder="Search loan number or customer" queryLabel="Search loans" selects={[{ value: loanTypeId, label: 'Loan type', ariaLabel: 'Filter loan type', options: [{ value: '', label: 'All loan types' }, ...loanTypes.map((type) => ({ value: type.id, label: type.name }))], onChange: (value) => { setLoanTypeId(value); setPage(1) }}]} dates={[{ value: startDate, ariaLabel: 'Filter loans from date', onChange: (value) => { setStartDate(value); setPage(1) } }, { value: endDate, ariaLabel: 'Filter loans to date', onChange: (value) => { setEndDate(value); setPage(1) }}]} resultCount={data?.total ?? 0} resultLabel="loans" onClear={() => { setQuery(''); setLoanTypeId(''); setStartDate(''); setEndDate(''); setPage(1) }} />

        <div className="customer-table">
          <div className="loan-directory-row customer-head">
            <button onClick={() => sortBy('loanNumber')}>Loan number</button>
            <button onClick={() => sortBy('customer')}>Customer</button>
            <span>Loan type</span>
            <button onClick={() => sortBy('amount')}>Amount</button>
            <span>Interest</span>
            <span>Term</span>
            <span>Outstanding</span>
            <span>Due date</span>
            <button onClick={() => sortBy('status')}>Status</button>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="directory-empty">Loading loans...</div>
          ) : data?.loans.length ? (
            data.loans.map((loan) => (
              <div className="loan-directory-row" key={loan.id}>
                <strong className="customer-number">{loan.loanNumber}</strong>
                <span>{loan.customer}</span>
                <span>{loan.loanType}</span>
                <CurrencyDisplay value={loan.amount} decimals={2} />
                <span>{loan.interest}</span>
                <span>{loan.term}</span>
                <CurrencyDisplay value={loan.outstanding} decimals={2} />
                <DateDisplay value={loan.dueDate} />
                <StatusBadge status={loan.status} />
                <div className="customer-actions">
                  <Link href={`/loans/${loan.id}`} aria-label={`View ${loan.loanNumber}`}>
                    <Eye size={15} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title={query || status !== 'ALL' || loanTypeId || startDate || endDate ? 'No loans found' : 'No loans yet'} message={query || status !== 'ALL' || loanTypeId || startDate || endDate ? 'Try clearing a filter or changing your search.' : 'Create your first loan application to begin managing the portfolio.'} action={!query && status === 'ALL' && !loanTypeId && !startDate && !endDate ? { label: 'Create loan', href: '/loans/new' } : undefined} />
          )}
        </div>

        {data ? <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} /> : null}
      </section>
    </main>
  )
}
