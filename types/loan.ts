export const loanStatuses = ['Active', 'Pending', 'Overdue', 'Completed'] as const
export type LoanStatus = (typeof loanStatuses)[number]

export type LoanSummary = {
  id: string
  customer: string
  initials: string
  type: string
  amount: string
  progress: number
  nextPayment: string
  status: LoanStatus
  accent: string
}

