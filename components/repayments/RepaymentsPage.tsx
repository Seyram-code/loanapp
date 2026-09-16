'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DirectoryFilters } from '@/components/DirectoryFilters'
import { Pagination } from '@/components/Pagination'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { DateDisplay } from '@/components/ui/DateDisplay'
import { EmptyState } from '@/components/ui/StateViews'
import '@/components/loans/loans-page.css'

type Repayment = {
  id: string
  repaymentNumber: string
  customer: string
  loanNumber: string
  amount: string
  paymentDate: string
  paymentMethod: string
  reference: string
  recordedBy: string
}

type RepaymentPage = {
  repayments: Repayment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}


export default function RepaymentsPage() {
  const [data, setData] = useState<RepaymentPage | null>(null)
  const [query, setQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (query) params.set('query', query)
    if (paymentMethod) params.set('paymentMethod', paymentMethod)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    const response = await fetch(`/api/repayments?${params}`)
    if (response.ok) setData(await response.json())
    setLoading(false)
  }, [query, paymentMethod, startDate, endDate, page, pageSize])

  useEffect(() => {
    // The effect intentionally synchronizes remote data with local state.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  return (
    <main className="directory-page">
      <header className="directory-header">
        <div>
          <Link href="/dashboard" className="back-link">Dashboard</Link>
          <p className="eyebrow">Payment tracking</p>
          <h1>Repayments</h1>
          <p className="settings-copy">Review payment activity, filters, and outstanding borrower records.</p>
        </div>
      </header>

      <section className="directory-panel panel">
        <DirectoryFilters query={query} onQueryChange={(value) => { setQuery(value); setPage(1) }} queryPlaceholder="Search payment number, loan, or customer" queryLabel="Search repayments" selects={[{ value: paymentMethod, label: 'Payment method', ariaLabel: 'Filter repayment method', options: [{ value: '', label: 'All payment methods' }, { value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }, { value: 'MOBILE_MONEY', label: 'Mobile money' }, { value: 'CARD', label: 'Card' }, { value: 'OTHER', label: 'Other' }], onChange: (value) => { setPaymentMethod(value); setPage(1) }}]} dates={[{ value: startDate, ariaLabel: 'Filter repayments from date', onChange: (value) => { setStartDate(value); setPage(1) } }, { value: endDate, ariaLabel: 'Filter repayments to date', onChange: (value) => { setEndDate(value); setPage(1) }}]} resultCount={data?.total ?? 0} resultLabel="repayments" onClear={() => { setQuery(''); setPaymentMethod(''); setStartDate(''); setEndDate(''); setPage(1) }} />

        <div className="customer-table">
          <div className="loan-directory-row customer-head">
            <span>Payment number</span>
            <span>Customer</span>
            <span>Loan number</span>
            <span>Amount</span>
            <span>Payment date</span>
            <span>Method</span>
            <span>Reference</span>
            <span>Recorded by</span>
          </div>

          {loading ? (
            <div className="directory-empty">Loading repayments...</div>
          ) : data?.repayments.length ? (
            data.repayments.map((repayment) => (
              <div className="loan-directory-row" key={repayment.id}>
                <strong className="customer-number">{repayment.repaymentNumber}</strong>
                <span>{repayment.customer}</span>
                <span>{repayment.loanNumber}</span>
                <CurrencyDisplay value={repayment.amount} decimals={2} />
                <DateDisplay value={repayment.paymentDate} />
                <span>{repayment.paymentMethod.replace('_', ' ')}</span>
                <span>{repayment.reference}</span>
                <span>{repayment.recordedBy}</span>
              </div>
            ))
          ) : (
            <EmptyState title={query || paymentMethod || startDate || endDate ? 'No repayments found' : 'No repayments yet'} message={query || paymentMethod || startDate || endDate ? 'Try clearing a filter or changing your search.' : 'Recorded repayments will appear here as customers make payments.'} />
          )}
        </div>

        {data ? <Pagination page={data.page} total={data.total} totalPages={data.totalPages} pageSize={data.pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} /> : null}
      </section>
    </main>
  )
}
