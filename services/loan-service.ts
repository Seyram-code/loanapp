import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { loanCreateSchema } from '../schemas/loan'
import { disbursementCreateSchema } from '../schemas/disbursement'
import { generateRepaymentSchedule } from './repayment-schedule-service'
import { calculateLoanFinancials, calculateOutstandingBalance, calculatePaidAmount, calculateTotalRepayment } from './financial-calculation-service'
import { calculateRepaymentDueDates } from '../utils/repayment-dates'

async function nextLoanNumber(transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const sequence = await transaction.numberSequence.upsert({
    where: { key: 'loan' },
    create: { key: 'loan', nextValue: 2 },
    update: { nextValue: { increment: 1 } },
  })
  return `LN-${String(sequence.nextValue - 1).padStart(6, '0')}`
}

export async function listLoans() {
  return prisma.loan.findMany({ include: { customer: true, loanType: true, repayments: true, disbursements: true }, orderBy: { createdAt: 'desc' } })
}

export async function searchLoans(options: { query?: string; status?: string; loanTypeId?: string; startDate?: string; endDate?: string; sort?: string; direction?: 'asc' | 'desc'; page?: number; pageSize?: number }) {
  const page = Math.max(1, options.page ?? 1); const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10)); const query = options.query?.trim(); const virtualOverdue = options.status === 'OVERDUE'
  const statusMap: Record<string, string> = { PENDING: 'PENDING', 'UNDER REVIEW': 'UNDER_REVIEW', APPROVED: 'APPROVED', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', REJECTED: 'REJECTED', DEFAULTED: 'DEFAULTED' }
  const where: Prisma.LoanWhereInput = { ...(virtualOverdue ? { repaymentSchedules: { some: { status: 'OVERDUE' } } } : options.status && statusMap[options.status] ? { status: statusMap[options.status] as never } : {}), ...(options.loanTypeId ? { loanTypeId: options.loanTypeId } : {}), ...(options.startDate || options.endDate ? { applicationDate: { ...(options.startDate ? { gte: new Date(`${options.startDate}T00:00:00.000Z`) } : {}), ...(options.endDate ? { lte: new Date(`${options.endDate}T23:59:59.999Z`) } : {}) } } : {}), ...(query ? { OR: [{ loanNumber: { contains: query } }, { customer: { firstName: { contains: query } } }, { customer: { lastName: { contains: query } } }, { loanType: { name: { contains: query } } }] } : {}) }
  const orderBy = options.sort === 'amount' ? { requestedAmount: options.direction ?? 'desc' as const } : options.sort === 'status' ? { status: options.direction ?? 'asc' as const } : { createdAt: options.direction ?? 'desc' as const }
  const [rows, total] = await prisma.$transaction([prisma.loan.findMany({ where, select: { id: true, loanNumber: true, requestedAmount: true, approvedAmount: true, interestRate: true, term: true, termUnit: true, repaymentFrequency: true, applicationDate: true, status: true, createdAt: true, maturityDate: true, customer: { select: { firstName: true, lastName: true } }, loanType: { select: { name: true } }, repaymentSchedules: { select: { remainingAmount: true, dueDate: true, status: true } } }, orderBy, skip: (page - 1) * pageSize, take: pageSize }), prisma.loan.count({ where })])
  return { loans: rows.map((loan) => {
    const scheduledFinalDate = [...loan.repaymentSchedules].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0]?.dueDate
    const projectedFinalDate = calculateRepaymentDueDates(loan.applicationDate, loan.term, loan.repaymentFrequency).at(-1)
    const finalDueDate = scheduledFinalDate ?? loan.maturityDate ?? projectedFinalDate ?? null
    return { id: loan.id, loanNumber: loan.loanNumber, customer: [loan.customer.firstName, loan.customer.lastName].join(' '), loanType: loan.loanType.name, amount: (loan.approvedAmount ?? loan.requestedAmount).toFixed(2), interest: `${loan.interestRate.toFixed(2)}%`, term: `${loan.term} ${loan.termUnit === 'DAY' ? (loan.term === 1 ? 'day' : 'days') : loan.termUnit === 'WEEK' ? (loan.term === 1 ? 'wk' : 'wks') : (loan.term === 1 ? 'mo' : 'mos')}`, outstanding: loan.repaymentSchedules.reduce((sum, schedule) => sum.add(schedule.remainingAmount), new Prisma.Decimal(0)).toFixed(2), dueDate: finalDueDate?.toISOString() ?? null, isDueDateProjected: !scheduledFinalDate && !loan.maturityDate, status: virtualOverdue || loan.repaymentSchedules.some((schedule) => schedule.status === 'OVERDUE') ? 'OVERDUE' : loan.status, createdAt: loan.createdAt.toISOString() }
  }), total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getLoanById(id: string) {
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      customer: true,
      loanType: true,
      repayments: true,
      disbursements: true,
      repaymentSchedules: true,
      rolloverToLoan: { select: { id: true, loanNumber: true, status: true } },
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      disbursedBy: { select: { name: true } },
    },
  })

  if (!loan) return null

  const principal = loan.approvedAmount ?? loan.requestedAmount
  const scheduledMaturityDate = loan.repaymentSchedules.reduce<Date | null>((latest, schedule) => !latest || schedule.dueDate > latest ? schedule.dueDate : latest, null)
  const maturityDate = scheduledMaturityDate ?? loan.maturityDate
  const calculatedFinancials = calculateLoanFinancials(loan)
  const scheduledTotal = calculateTotalRepayment(loan.repaymentSchedules)
  const totalRepayment = loan.repaymentSchedules.length > 0 ? scheduledTotal : calculatedFinancials.totalRepayment
  const amountPaid = calculatePaidAmount(loan.repayments)
  const outstanding = loan.repaymentSchedules.length > 0 ? calculateOutstandingBalance(loan.repaymentSchedules) : totalRepayment
  const interest = totalRepayment.gt(0) ? totalRepayment.sub(principal) : new Prisma.Decimal(0)

  return {
    id: loan.id,
    loanNumber: loan.loanNumber,
    customer: {
      id: loan.customer.id,
      name: [loan.customer.firstName, loan.customer.middleName, loan.customer.lastName].filter(Boolean).join(' '),
      customerNumber: loan.customer.customerNumber,
      phone: loan.customer.phone,
      email: loan.customer.email,
    },
    loanType: loan.loanType.name,
    requestedAmount: loan.requestedAmount.toFixed(2),
    approvedAmount: loan.approvedAmount?.toFixed(2) ?? null,
    interestRate: `${loan.interestRate.toFixed(2)}%`,
    interest: interest.toFixed(2),
    totalRepayment: totalRepayment.toFixed(2),
    amountPaid: amountPaid.toFixed(2),
    outstanding: outstanding.toFixed(2),
    term: `${loan.term} ${loan.termUnit === 'DAY' ? (loan.term === 1 ? 'day' : 'days') : loan.termUnit === 'WEEK' ? (loan.term === 1 ? 'week' : 'weeks') : (loan.term === 1 ? 'month' : 'months')}`,
    repaymentFrequency: loan.repaymentFrequency.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    applicationDate: loan.applicationDate.toISOString(),
    approvalDate: loan.approvalDate?.toISOString() ?? null,
    disbursementDate: loan.disbursementDate?.toISOString() ?? null,
    maturityDate: maturityDate?.toISOString() ?? null,
    status: loan.status,
    rolloverToLoan: loan.rolloverToLoan,
    rejectionReason: loan.rejectionReason ?? null,
    purpose: loan.purpose ?? null,
    notes: loan.notes ?? null,
    createdBy: loan.createdBy.name,
    approvedBy: loan.approvedBy?.name ?? null,
    disbursedBy: loan.disbursedBy?.name ?? null,
  }
}

export async function createLoan(input: unknown, userId: string) {
  const data = loanCreateSchema.parse(input)
  return prisma.$transaction(async (transaction) => {
    const [customer, loanType] = await Promise.all([
      transaction.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }),
      transaction.loanType.findUnique({ where: { id: data.loanTypeId }, select: { id: true, minimumAmount: true, maximumAmount: true } }),
    ])
    if (!customer) throw new Error('Selected customer was not found')
    if (!loanType) throw new Error('Selected loan type was not found')
    const requestedAmount = new Prisma.Decimal(data.requestedAmount)
    if (requestedAmount.lt(loanType.minimumAmount) || requestedAmount.gt(loanType.maximumAmount)) {
      throw new Error(`Requested amount must be between ${loanType.minimumAmount.toFixed(2)} and ${loanType.maximumAmount.toFixed(2)} for the selected loan type`)
    }
    const loanNumber = await nextLoanNumber(transaction)
    const loan = await transaction.loan.create({ data: { ...data, loanNumber, createdById: userId } })
    await recordAudit(transaction, { userId, action: 'LOAN_CREATED', entity: 'Loan', entityId: loan.id, description: `Loan ${loanNumber} was created`, metadata: { loanNumber } })
    return loan
  })
}

export async function requestLoanRollover(loanId: string, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const source = await transaction.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        loanNumber: true,
        customerId: true,
        loanTypeId: true,
        requestedAmount: true,
        interestRate: true,
        interestType: true,
        term: true,
        termUnit: true,
        repaymentFrequency: true,
        purpose: true,
        status: true,
        rolloverToLoan: { select: { id: true, loanNumber: true } },
        repaymentSchedules: { select: { remainingAmount: true } },
      },
    })
    if (!source) throw new Error('Loan not found')
    if (source.status !== 'COMPLETED' || source.repaymentSchedules.length === 0 || source.repaymentSchedules.some((item) => item.remainingAmount.gt(0))) {
      throw new Error('Only fully paid loans can be rolled over')
    }
    if (source.rolloverToLoan) throw new Error('A rollover has already been requested for this loan')

    const sequence = await transaction.numberSequence.upsert({
      where: { key: 'loan' },
      create: { key: 'loan', nextValue: 2 },
      update: { nextValue: { increment: 1 } },
    })
    const loanNumber = `LN-${String(sequence.nextValue - 1).padStart(6, '0')}`
    const rollover = await transaction.loan.create({
      data: {
        loanNumber,
        customerId: source.customerId,
        loanTypeId: source.loanTypeId,
        requestedAmount: source.requestedAmount,
        interestRate: source.interestRate,
        interestType: source.interestType,
        term: source.term,
        termUnit: source.termUnit,
        repaymentFrequency: source.repaymentFrequency,
        purpose: source.purpose,
        rolloverFromLoanId: source.id,
        createdById: userId,
      },
    })
    await recordAudit(transaction, {
      userId,
      action: 'LOAN_ROLLOVER_REQUESTED',
      entity: 'Loan',
      entityId: rollover.id,
      description: `Rollover of loan ${source.loanNumber} requested as ${loanNumber}`,
      metadata: { sourceLoanId: source.id, sourceLoanNumber: source.loanNumber, rolloverLoanNumber: loanNumber },
    })
    return rollover
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

async function transitionLoan(loanId: string, from: Prisma.LoanWhereInput['status'], to: Prisma.LoanUpdateInput['status'], action: string, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const loan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, loanNumber: true, status: true } })
    if (!loan) throw new Error('Loan not found')
    const transition = await transaction.loan.updateMany({ where: { id: loanId, status: from }, data: { status: to } })
    if (transition.count !== 1) throw new Error(`Invalid loan transition from ${loan.status}`)
    const updatedLoan = await transaction.loan.findUniqueOrThrow({ where: { id: loanId } })
    await recordAudit(transaction, { userId, action, entity: 'Loan', entityId: loan.id, description: `Loan ${loan.loanNumber} changed from ${loan.status} to ${to}`, metadata: { from: loan.status, to } })
    return updatedLoan
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function submitLoan(loanId: string, userId: string) {
  return transitionLoan(loanId, 'DRAFT', 'PENDING', 'LOAN_SUBMITTED', userId)
}

export function startLoanReview(loanId: string, userId: string) {
  return transitionLoan(loanId, 'PENDING', 'UNDER_REVIEW', 'LOAN_REVIEW_STARTED', userId)
}

export function activateLoan(loanId: string, userId: string) {
  return transitionLoan(loanId, 'DISBURSED', 'ACTIVE', 'LOAN_ACTIVATED', userId)
}

export async function defaultLoan(loanId: string, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const loan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, loanNumber: true, status: true } })
    if (!loan) throw new Error('Loan not found')
    if (loan.status !== 'ACTIVE') throw new Error('Only active loans can be defaulted')
    const overdue = await transaction.loanRepaymentSchedule.count({ where: { loanId, dueDate: { lt: new Date() }, remainingAmount: { gt: 0 } } })
    if (overdue === 0) throw new Error('Loan has no overdue balance')
    await transaction.loan.updateMany({ where: { id: loanId, status: 'ACTIVE' }, data: { status: 'DEFAULTED' } })
    const updatedLoan = await transaction.loan.findUniqueOrThrow({ where: { id: loanId } })
    await recordAudit(transaction, { userId, action: 'LOAN_DEFAULTED', entity: 'Loan', entityId: loan.id, description: `Loan ${loan.loanNumber} was defaulted`, metadata: { previousStatus: loan.status } })
    return updatedLoan
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function approveLoan(loanId: string, approvedAmount: unknown, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const existingLoan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, requestedAmount: true, status: true, loanNumber: true } })
    if (!existingLoan) throw new Error('Loan not found')
    if (existingLoan.status !== 'UNDER_REVIEW') throw new Error('Loan is not under review')

    const amount = approvedAmount === undefined || approvedAmount === null
      ? existingLoan.requestedAmount
      : new Prisma.Decimal(String(loanCreateSchema.shape.requestedAmount.parse(approvedAmount)))

    const transition = await transaction.loan.updateMany({ where: { id: loanId, status: 'UNDER_REVIEW' }, data: { approvedAmount: amount, status: 'APPROVED', approvalDate: new Date(), approvedById: userId, rejectionReason: null } })
    if (transition.count !== 1) throw new Error('Loan is not under review')
    const loan = await transaction.loan.findUniqueOrThrow({ where: { id: loanId } })
    await recordAudit(transaction, { userId, action: 'LOAN_APPROVED', entity: 'Loan', entityId: loan.id, description: `Loan ${loan.loanNumber} was approved`, metadata: { approvedAmount: amount, approvedById: userId } })
    await transaction.notification.create({ data: { userId, title: 'Loan approved', message: `Loan ${loan.loanNumber} was approved.`, type: 'LOAN' } })
    return loan
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function rejectLoan(loanId: string, rejectionReason: unknown, userId: string) {
  const reason = typeof rejectionReason === 'string' ? rejectionReason.trim() : ''
  if (!reason) throw new Error('Rejection reason is required')

  return prisma.$transaction(async (transaction) => {
    const loan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, loanNumber: true, status: true } })
    if (!loan) throw new Error('Loan not found')
    if (loan.status !== 'UNDER_REVIEW') throw new Error('Loan is not under review')

    const transition = await transaction.loan.updateMany({ where: { id: loanId, status: 'UNDER_REVIEW' }, data: { status: 'REJECTED', rejectionReason: reason, approvalDate: null, approvedById: null } })
    if (transition.count !== 1) throw new Error('Loan is not under review')
    const updatedLoan = await transaction.loan.findUniqueOrThrow({ where: { id: loanId } })
    await recordAudit(transaction, { userId, action: 'LOAN_REJECTED', entity: 'Loan', entityId: loan.id, description: `Loan ${loan.loanNumber} was rejected`, metadata: { rejectionReason: reason, rejectedById: userId } })
    await transaction.notification.create({ data: { userId, title: 'Loan rejected', message: `Loan ${loan.loanNumber} was rejected.`, type: 'LOAN' } })
    return updatedLoan
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function disburseLoan(loanId: string, input: unknown, userId: string) {
  const data = disbursementCreateSchema.parse(input)
  const amount = new Prisma.Decimal(String(data.amount))

  return prisma.$transaction(async (transaction) => {
    const loan = await transaction.loan.findUnique({ where: { id: loanId }, select: { id: true, status: true, approvedAmount: true, loanNumber: true } })
    if (!loan || loan.status !== 'APPROVED' || !loan.approvedAmount) throw new Error('Loan is not approved for disbursement')

    const previous = await transaction.loanDisbursement.aggregate({ where: { loanId }, _sum: { amount: true } })
    const totalDisbursed = (previous._sum.amount ?? new Prisma.Decimal(0)).add(amount)
    if (totalDisbursed.gt(loan.approvedAmount)) throw new Error('Disbursement exceeds approved amount')

    const disbursementDate = data.disbursementDate ?? new Date()
    const disbursement = await transaction.loanDisbursement.create({ data: { ...data, amount, disbursementDate, loanId, disbursedById: userId } })

    const transition = await transaction.loan.updateMany({ where: { id: loanId, status: 'APPROVED' }, data: { status: 'DISBURSED', disbursementDate, disbursedById: userId } })
    if (transition.count !== 1) throw new Error('Loan is not approved for disbursement')
    const updatedLoan = await transaction.loan.findUniqueOrThrow({ where: { id: loanId } })

    const schedule = await generateRepaymentSchedule(transaction, updatedLoan.id, disbursementDate)
    const maturityDate = schedule.at(-1)?.dueDate
    const disbursedLoan = maturityDate
      ? await transaction.loan.update({ where: { id: loanId }, data: { maturityDate } })
      : updatedLoan

    await recordAudit(transaction, {
      userId,
      action: 'LOAN_DISBURSED',
      entity: 'Loan',
      entityId: loanId,
      description: `Loan ${loan.loanNumber} was disbursed`,
      metadata: {
        disbursementId: disbursement.id,
        amount: amount.toString(),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber ?? null,
        disbursementDate,
      },
    })

    await transaction.notification.create({
      data: {
        userId,
        title: 'Loan disbursement recorded',
        message: `Loan ${loan.loanNumber} was disbursed successfully.`,
        type: 'LOAN',
      },
    })

    return disbursedLoan
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
