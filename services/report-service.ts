import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

type ReportOptions = {
  startDate?: string
  endDate?: string
  loanTypeId?: string
  loanStatus?: string
}

const startOfDay = (value: string) => new Date(`${value}T00:00:00.000Z`)
const endOfDay = (value: string) => new Date(`${value}T23:59:59.999Z`)

function dateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined
  return {
    ...(startDate ? { gte: startOfDay(startDate) } : {}),
    ...(endDate ? { lte: endOfDay(endDate) } : {}),
  }
}

function money(value: Prisma.Decimal | null | undefined) {
  return (value ?? new Prisma.Decimal(0)).toFixed(2)
}

export async function getReports(options: ReportOptions = {}) {
  const applicationDate = dateRange(options.startDate, options.endDate)
  const loanWhere: Prisma.LoanWhereInput = {
    ...(applicationDate ? { applicationDate } : {}),
    ...(options.loanTypeId ? { loanTypeId: options.loanTypeId } : {}),
    ...(options.loanStatus ? { status: options.loanStatus as never } : {}),
  }
  const eventDate = dateRange(options.startDate, options.endDate)
  const customerWhere: Prisma.CustomerWhereInput = eventDate ? { createdAt: eventDate } : {}
  const disbursementWhere: Prisma.LoanDisbursementWhereInput = {
    ...(eventDate ? { disbursementDate: eventDate } : {}),
    loan: loanWhere,
  }
  const repaymentWhere: Prisma.RepaymentWhereInput = {
    ...(eventDate ? { paymentDate: eventDate } : {}),
    loan: loanWhere,
  }
  const scheduleWhere: Prisma.LoanRepaymentScheduleWhereInput = { loan: loanWhere }

  const [
    totalCustomers,
    newCustomers,
    activeCustomers,
    inactiveCustomers,
    totalLoans,
    loanStatusCounts,
    loanAmounts,
    disbursed,
    repaid,
    scheduleTotals,
    overdueSchedules,
    loanTypes,
  ] = await prisma.$transaction([
    prisma.customer.count({ where: customerWhere }),
    prisma.customer.count({ where: customerWhere }),
    prisma.customer.count({ where: { ...customerWhere, status: 'ACTIVE' } }),
    prisma.customer.count({ where: { ...customerWhere, status: 'INACTIVE' } }),
    prisma.loan.count({ where: loanWhere }),
    prisma.loan.groupBy({ by: ['status'], where: loanWhere, _count: { _all: true } }),
    prisma.loan.aggregate({ where: loanWhere, _sum: { requestedAmount: true, approvedAmount: true } }),
    prisma.loanDisbursement.aggregate({ where: disbursementWhere, _sum: { amount: true } }),
    prisma.repayment.aggregate({ where: repaymentWhere, _sum: { amount: true } }),
    prisma.loanRepaymentSchedule.aggregate({ where: scheduleWhere, _sum: { expectedAmount: true, remainingAmount: true } }),
    prisma.loanRepaymentSchedule.aggregate({ where: { ...scheduleWhere, dueDate: { lt: new Date() }, remainingAmount: { gt: 0 } }, _sum: { remainingAmount: true } }),
    prisma.loanType.findMany({ where: { loans: { some: loanWhere } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const requested = loanAmounts._sum.requestedAmount ?? new Prisma.Decimal(0)
  const approved = loanAmounts._sum.approvedAmount ?? new Prisma.Decimal(0)
  const expected = scheduleTotals._sum.expectedAmount ?? new Prisma.Decimal(0)
  const totalInterest = expected.sub(approved)
  const statusCounts = Object.fromEntries(loanStatusCounts.map(({ status, _count }) => [status, _count._all]))

  return {
    filters: { startDate: options.startDate ?? '', endDate: options.endDate ?? '', loanTypeId: options.loanTypeId ?? '', loanStatus: options.loanStatus ?? '' },
    loanTypes,
    customers: { total: totalCustomers, new: newCustomers, active: activeCustomers, inactive: inactiveCustomers },
    loans: {
      total: totalLoans,
      pending: (statusCounts.PENDING ?? 0) + (statusCounts.UNDER_REVIEW ?? 0),
      approved: statusCounts.APPROVED ?? 0,
      active: (statusCounts.ACTIVE ?? 0) + (statusCounts.DISBURSED ?? 0),
      completed: statusCounts.COMPLETED ?? 0,
      rejected: statusCounts.REJECTED ?? 0,
      defaulted: statusCounts.DEFAULTED ?? 0,
    },
    financial: {
      totalRequested: money(requested),
      totalApproved: money(approved),
      totalDisbursed: money(disbursed._sum.amount),
      totalRepaid: money(repaid._sum.amount),
      totalInterest: money(totalInterest),
      outstanding: money(scheduleTotals._sum.remainingAmount),
      overdue: money(overdueSchedules._sum.remainingAmount),
    },
  }
}

export function reportsCsv(report: Awaited<ReturnType<typeof getReports>>) {
  const rows = [
    ['Report', 'Metric', 'Value'],
    ['Customer Report', 'Total customers', report.customers.total],
    ['Customer Report', 'New customers', report.customers.new],
    ['Customer Report', 'Active customers', report.customers.active],
    ['Customer Report', 'Inactive customers', report.customers.inactive],
    ['Loan Report', 'Total loans', report.loans.total],
    ['Loan Report', 'Pending', report.loans.pending],
    ['Loan Report', 'Approved', report.loans.approved],
    ['Loan Report', 'Active', report.loans.active],
    ['Loan Report', 'Completed', report.loans.completed],
    ['Loan Report', 'Rejected', report.loans.rejected],
    ['Loan Report', 'Defaulted', report.loans.defaulted],
    ['Financial Report', 'Total requested', report.financial.totalRequested],
    ['Financial Report', 'Total approved', report.financial.totalApproved],
    ['Financial Report', 'Total disbursed', report.financial.totalDisbursed],
    ['Financial Report', 'Total repaid', report.financial.totalRepaid],
    ['Financial Report', 'Total interest', report.financial.totalInterest],
    ['Financial Report', 'Outstanding', report.financial.outstanding],
    ['Financial Report', 'Overdue', report.financial.overdue],
  ]
  return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
}
