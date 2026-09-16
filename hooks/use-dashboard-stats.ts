import { useCallback, useEffect, useState } from 'react'

export type DashboardStats = { totalCustomers: number; activeCustomers: number; totalLoans: number; pendingApplications: number; approvedLoans: number; activeLoans: number; completedLoans: number; overdueLoans: number; totalDisbursed: string; totalRepaid: string; outstandingBalance: string; interestProfit: string; loanStatuses: Record<string, number>; monthlyActivity: Array<{ month: string; applications: number; approvals: number; disbursements: number; repayments: number }>; repaymentOverview: { expected: string; paid: string; outstanding: string; overdue: string }; activity: Array<{ action: string; related: string; admin: string; date: string; description: string }> }

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchStats = useCallback(() => {
    let cancelled = false

    fetch('/api/dashboard/stats')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Dashboard request failed')
        }

        const data = await response.json() as DashboardStats | null
        if (!cancelled) {
          setStats(data)
          setStatus(data ? 'ready' : 'error')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refetch = useCallback(() => {
    setStatus('loading')
    return fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const cancel = fetchStats()
    return () => cancel()
  }, [fetchStats])

  return {
    stats,
    loading: status === 'loading',
    error: status === 'error',
    refetch,
  }
}
