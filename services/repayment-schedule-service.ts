import { prisma } from '../lib/prisma'
import { buildRepaymentSchedule } from './financial-calculation-service'

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export async function generateRepaymentSchedule(transaction: Transaction, loanId: string, startDate = new Date()) {
  const loan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, customerId: true, requestedAmount: true, approvedAmount: true, interestRate: true, interestType: true, term: true, termUnit: true, repaymentFrequency: true } })
  if (!loan) throw new Error('Loan not found')
  const schedule = buildRepaymentSchedule(loan, startDate)
  await transaction.loanRepaymentSchedule.deleteMany({ where: { loanId } })
  await transaction.loanRepaymentSchedule.createMany({ data: schedule.map((row) => ({ ...row, loanId })) })
  return schedule
}

export async function listRepaymentSchedule(loanId: string) {
  const schedules = await prisma.loanRepaymentSchedule.findMany({ where: { loanId }, orderBy: { installmentNumber: 'asc' } })
  const now = new Date()

  return schedules.map((schedule) => ({
    installmentNumber: schedule.installmentNumber,
    dueDate: schedule.dueDate.toISOString(),
    expectedAmount: schedule.expectedAmount.toFixed(2),
    principalAmount: schedule.principalAmount.toFixed(2),
    interestAmount: schedule.interestAmount.toFixed(2),
    amountPaid: schedule.amountPaid.toFixed(2),
    remainingAmount: schedule.remainingAmount.toFixed(2),
    status: schedule.remainingAmount.isZero()
      ? 'PAID'
      : schedule.dueDate < now
        ? 'OVERDUE'
        : schedule.amountPaid.gt(0)
          ? 'PARTIALLY_PAID'
          : 'PENDING',
  }))
}
