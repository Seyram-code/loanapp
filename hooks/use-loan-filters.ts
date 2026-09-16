import { useEffect, useState } from 'react'
import type { LoanStatus, LoanSummary } from '../types/loan'
import { formatDate } from '../utils/date-format'

export function useLoanFilters() {
  const [status, setStatus] = useState<LoanStatus | 'All loans'>('All loans')
  const [search, setSearch] = useState('')
  const [loans, setLoans] = useState<LoanSummary[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const params = new URLSearchParams({ page: '1', pageSize: '5', sort: 'createdAt', direction: 'desc' })
    if (search) params.set('query', search)
    if (status !== 'All loans') params.set('status', status === 'Overdue' ? 'OVERDUE' : status.toUpperCase())
    // The effect synchronizes the dashboard with the authenticated API response.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    fetch(`/api/loans?${params}`).then((response) => response.ok ? response.json() : { loans: [] }).then((data: { loans?: Array<{ id: string; loanNumber: string; customer: string; loanType: string; amount: string; outstanding: string; dueDate: string | null; status: string }> }) => {
      setLoans((data.loans ?? []).map((loan, index) => ({ id: loan.loanNumber, customer: loan.customer, initials: loan.customer.split(' ').map((part) => part[0]).join('').slice(0, 2), type: loan.loanType, amount: `GHS ${Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, progress: Math.max(0, Math.min(100, Math.round((1 - Number(loan.outstanding) / Math.max(Number(loan.amount), 1)) * 100))), nextPayment: formatDate(loan.dueDate), status: (loan.status === 'UNDER_REVIEW' ? 'Pending' : loan.status.charAt(0) + loan.status.slice(1).toLowerCase()) as LoanStatus, accent: ['gold', 'coral', 'blue', 'plum', 'mint'][index % 5] })))
      setLoading(false)
    }).catch(() => { setLoans([]); setLoading(false) })
  }, [search, status])
  return { loans, loading, search, setSearch, status, setStatus }
}
