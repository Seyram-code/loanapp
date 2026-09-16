import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { repaymentCreateSchema } from '../schemas/repayment'
import { calculateOutstandingBalance } from './financial-calculation-service'

async function nextRepaymentNumber(transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const sequence = await transaction.numberSequence.upsert({
    where: { key: 'repayment' },
    create: { key: 'repayment', nextValue: 2 },
    update: { nextValue: { increment: 1 } },
  })
  return `PAY-${String(sequence.nextValue - 1).padStart(6, '0')}`
}

export async function listRepayments(options: { query?: string; paymentMethod?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10))
  const query = options.query?.trim()
  const where: Prisma.RepaymentWhereInput = {
    ...(query ? { OR: [{ repaymentNumber: { contains: query } }, { loan: { loanNumber: { contains: query } } }, { customer: { firstName: { contains: query } } }, { customer: { lastName: { contains: query } } }, { referenceNumber: { contains: query } }, { recordedBy: { name: { contains: query } } }] } : {}),
    ...(options.paymentMethod ? { paymentMethod: options.paymentMethod as never } : {}),
    ...(options.startDate || options.endDate ? { paymentDate: { ...(options.startDate ? { gte: new Date(`${options.startDate}T00:00:00.000Z`) } : {}), ...(options.endDate ? { lte: new Date(`${options.endDate}T23:59:59.999Z`) } : {}) } } : {}),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.repayment.findMany({
      where,
      select: { id: true, repaymentNumber: true, amount: true, paymentDate: true, paymentMethod: true, referenceNumber: true, loan: { select: { loanNumber: true } }, customer: { select: { firstName: true, lastName: true } }, recordedBy: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.repayment.count({ where }),
  ])

  return {
    repayments: rows.map((repayment) => ({
      id: repayment.id,
      repaymentNumber: repayment.repaymentNumber,
      customer: `${repayment.customer.firstName} ${repayment.customer.lastName}`.trim(),
      loanNumber: repayment.loan.loanNumber,
      amount: repayment.amount.toFixed(2),
      paymentDate: repayment.paymentDate.toISOString(),
      paymentMethod: repayment.paymentMethod,
      reference: repayment.referenceNumber ?? '—',
      recordedBy: repayment.recordedBy.name,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function createRepayment(input: unknown, userId: string) {
  const data = repaymentCreateSchema.parse(input)
  const amount = new Prisma.Decimal(String(data.amount))
  return prisma.$transaction(async (transaction) => {
    const loan = await transaction.loan.findUnique({
      where: { id: data.loanId },
      select: { id: true, customerId: true, loanNumber: true, status: true },
    })
    if (!loan || loan.customerId !== data.customerId) throw new Error('Loan does not belong to customer')
    if (loan.status === 'COMPLETED') throw new Error('Completed loans cannot accept repayments')
    if (!['ACTIVE', 'DISBURSED'].includes(loan.status)) throw new Error('Loan is not open for repayment')

    const schedules = await transaction.loanRepaymentSchedule.findMany({
      where: { loanId: loan.id, remainingAmount: { gt: 0 } },
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    })
    const outstanding = calculateOutstandingBalance(schedules)
    if (amount.gt(outstanding)) throw new Error('Repayment exceeds the outstanding balance')

    const repaymentNumber = await nextRepaymentNumber(transaction)
    const repayment = await transaction.repayment.create({ data: { ...data, amount, repaymentNumber, recordedById: userId, status: 'PAID' } })

    let unapplied = amount
    for (const schedule of schedules) {
      if (unapplied.isZero()) break
      const applied = Prisma.Decimal.min(unapplied, schedule.remainingAmount)
      const amountPaid = schedule.amountPaid.add(applied)
      const remainingAmount = schedule.remainingAmount.sub(applied).toDecimalPlaces(2)
      const status = remainingAmount.isZero() ? 'PAID' : schedule.dueDate < data.paymentDate ? 'OVERDUE' : amountPaid.gt(0) ? 'PARTIALLY_PAID' : schedule.status
      await transaction.loanRepaymentSchedule.update({
        where: { id: schedule.id },
        data: { amountPaid, remainingAmount, status, paidDate: status === 'PAID' ? data.paymentDate : null },
      })
      unapplied = unapplied.sub(applied)
    }

    const remainingSchedules = await transaction.loanRepaymentSchedule.findMany({ where: { loanId: loan.id }, select: { remainingAmount: true, dueDate: true } })
    const remainingBalance = calculateOutstandingBalance(remainingSchedules)
    const loanStatus = remainingBalance.isZero() ? 'COMPLETED' : 'ACTIVE'
    const transition = await transaction.loan.updateMany({ where: { id: loan.id, status: { in: ['ACTIVE', 'DISBURSED'] } }, data: { status: loanStatus } })
    if (transition.count !== 1) throw new Error('Loan is no longer open for repayment')

    await recordAudit(transaction, { userId, action: 'REPAYMENT_RECORDED', entity: 'Repayment', entityId: repayment.id, description: `Repayment ${repaymentNumber} was recorded`, metadata: { repaymentNumber, loanId: data.loanId, amount: amount.toString(), outstandingBalance: remainingBalance.toString(), loanStatus } })
    await transaction.notification.create({ data: { userId, title: 'Repayment recorded', message: `Repayment ${repaymentNumber} was recorded for loan ${loan.loanNumber}.`, type: 'REPAYMENT' } })
    return repayment
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
