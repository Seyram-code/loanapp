import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function getDashboardStats() {
  const [totalCustomers, activeCustomers, totalLoans, pendingApplications, approvedLoans, activeLoans, completedLoans, overdueLoans, disbursed, repaid, loanStatuses, applications, approvals, disbursements, repayments, scheduleTotals, schedulesForProfit, auditLogs] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count(),
    prisma.loan.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    prisma.loan.count({ where: { status: 'APPROVED' } }),
    prisma.loan.count({ where: { status: { in: ['DISBURSED', 'ACTIVE'] } } }),
    prisma.loan.count({ where: { status: 'COMPLETED' } }),
    prisma.loan.count({ where: { repaymentSchedules: { some: { status: 'OVERDUE' } } } }),
    prisma.loanDisbursement.aggregate({ _sum: { amount: true } }),
    prisma.repayment.aggregate({ _sum: { amount: true } }),
    prisma.loan.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.loan.findMany({ where: { applicationDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } }, select: { applicationDate: true } }),
    prisma.loan.findMany({ where: { approvalDate: { not: null, gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } }, select: { approvalDate: true } }),
    prisma.loanDisbursement.findMany({ where: { disbursementDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } }, select: { disbursementDate: true } }),
    prisma.repayment.findMany({ where: { paymentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } }, select: { paymentDate: true } }),
    prisma.loanRepaymentSchedule.aggregate({ _sum: { expectedAmount: true, amountPaid: true, remainingAmount: true } }),
    prisma.loanRepaymentSchedule.findMany({ where: { amountPaid: { gt: 0 } }, select: { interestAmount: true, amountPaid: true, expectedAmount: true } }),
    prisma.auditLog.findMany({ where: { action: { in: ['CUSTOMER_CREATED', 'LOAN_CREATED', 'LOAN_APPROVED', 'LOAN_DISBURSED', 'REPAYMENT_RECORDED'] } }, select: { action: true, entity: true, entityId: true, description: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ])
  const totalDisbursed = disbursed._sum.amount ?? new Prisma.Decimal(0)
  const totalRepaid = repaid._sum.amount ?? new Prisma.Decimal(0)
  const interestProfit = schedulesForProfit.reduce((total, schedule) => {
    const paidRatio = Prisma.Decimal.min(schedule.amountPaid.div(schedule.expectedAmount), new Prisma.Decimal(1))
    return total.add(schedule.interestAmount.mul(paidRatio))
  }, new Prisma.Decimal(0)).toDecimalPlaces(2)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(monthStart.getFullYear(), monthStart.getMonth() + index, 1); return { key: `${date.getFullYear()}-${date.getMonth()}`, month: date.toLocaleString('en', { month: 'short' }), applications: 0, approvals: 0, disbursements: 0, repayments: 0 } })
  const bucket = (date: Date | null) => date ? months.find((month) => month.key === `${date.getFullYear()}-${date.getMonth()}`) : undefined
  applications.forEach(({ applicationDate }) => { const month = bucket(applicationDate); if (month) month.applications += 1 })
  approvals.forEach(({ approvalDate }) => { const month = bucket(approvalDate); if (month) month.approvals += 1 })
  disbursements.forEach(({ disbursementDate }) => { const month = bucket(disbursementDate); if (month) month.disbursements += 1 })
  repayments.forEach(({ paymentDate }) => { const month = bucket(paymentDate); if (month) month.repayments += 1 })
  const statusCounts = Object.fromEntries(loanStatuses.map(({ status, _count }) => [status, _count._all]))
  const customerIds = auditLogs.filter((log) => log.entity === 'Customer' && log.entityId).map((log) => log.entityId as string)
  const loanIds = auditLogs.filter((log) => log.entity === 'Loan' && log.entityId).map((log) => log.entityId as string)
  const repaymentIds = auditLogs.filter((log) => log.entity === 'Repayment' && log.entityId).map((log) => log.entityId as string)
  const [activityCustomers, activityLoans, activityRepayments] = await Promise.all([
    prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, firstName: true, lastName: true, customerNumber: true } }),
    prisma.loan.findMany({ where: { id: { in: loanIds } }, select: { id: true, loanNumber: true } }),
    prisma.repayment.findMany({ where: { id: { in: repaymentIds } }, select: { id: true, repaymentNumber: true } }),
  ])
  const customerById = new Map(activityCustomers.map((customer) => [customer.id, `${customer.firstName} ${customer.lastName} · ${customer.customerNumber}`]))
  const loanById = new Map(activityLoans.map((loan) => [loan.id, loan.loanNumber]))
  const repaymentById = new Map(activityRepayments.map((repayment) => [repayment.id, repayment.repaymentNumber]))
  const activity = auditLogs.map((log) => {
    let related = log.entityId ?? 'System'
    if (log.entity === 'Customer' && log.entityId) related = customerById.get(log.entityId) ?? related
    if (log.entity === 'Loan' && log.entityId) related = loanById.get(log.entityId) ?? related
    if (log.entity === 'Repayment' && log.entityId) related = repaymentById.get(log.entityId) ?? related
    return { action: log.action.replaceAll('_', ' '), related, admin: log.user.name, date: log.createdAt.toISOString(), description: log.description }
  })
  const outstandingBalance = scheduleTotals._sum.remainingAmount ?? new Prisma.Decimal(0)
  return { totalCustomers, activeCustomers, totalLoans, pendingApplications, approvedLoans, activeLoans, completedLoans, overdueLoans, totalDisbursed: totalDisbursed.toFixed(2), totalRepaid: totalRepaid.toFixed(2), outstandingBalance: outstandingBalance.toFixed(2), interestProfit: interestProfit.toFixed(2), loanStatuses: statusCounts, monthlyActivity: months.map(({ key: _key, ...month }) => month), repaymentOverview: { expected: (scheduleTotals._sum.expectedAmount ?? new Prisma.Decimal(0)).toFixed(2), paid: (scheduleTotals._sum.amountPaid ?? new Prisma.Decimal(0)).toFixed(2), outstanding: outstandingBalance.toFixed(2), overdue: (await prisma.loanRepaymentSchedule.aggregate({ where: { status: 'OVERDUE' }, _sum: { remainingAmount: true } }))._sum.remainingAmount?.toFixed(2) ?? '0.00' }, activity }
}
