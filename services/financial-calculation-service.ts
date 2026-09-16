import { Prisma } from '@prisma/client'

export type InterestMethod = 'FLAT' | 'REDUCING_BALANCE'
export type RepaymentFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'
export type LoanTermUnit = 'WEEK' | 'MONTH'

export type FinancialLoanTerms = {
  requestedAmount: Prisma.Decimal
  approvedAmount: Prisma.Decimal | null
  interestRate: Prisma.Decimal
  interestType: InterestMethod
  term: number
  termUnit: LoanTermUnit
  repaymentFrequency: RepaymentFrequency
}

export type RepaymentScheduleCalculation = {
  installmentNumber: number
  dueDate: Date
  expectedAmount: Prisma.Decimal
  principalAmount: Prisma.Decimal
  interestAmount: Prisma.Decimal
  amountPaid: Prisma.Decimal
  remainingAmount: Prisma.Decimal
}

const periodsPerYear: Record<RepaymentFrequency, number> = {
  DAILY: 365,
  WEEKLY: 52,
  BIWEEKLY: 26,
  MONTHLY: 12,
  QUARTERLY: 4,
}

const zero = () => new Prisma.Decimal(0)
const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2)

function addPeriod(date: Date, frequency: RepaymentFrequency) {
  const next = new Date(date)
  if (frequency === 'DAILY') next.setUTCDate(next.getUTCDate() + 1)
  if (frequency === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7)
  if (frequency === 'BIWEEKLY') next.setUTCDate(next.getUTCDate() + 14)
  if (frequency === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + 1)
  if (frequency === 'QUARTERLY') next.setUTCMonth(next.getUTCMonth() + 3)
  return next
}

export function principalAmount(terms: FinancialLoanTerms) {
  return terms.approvedAmount ?? terms.requestedAmount
}

export function calculateFlatInterest(principal: Prisma.Decimal, rate: Prisma.Decimal) {
  return money(principal.mul(rate).div(100))
}

export function calculateReducingInstallment(principal: Prisma.Decimal, annualRate: Prisma.Decimal, term: number, frequency: RepaymentFrequency) {
  const periodicRate = annualRate.div(100).div(periodsPerYear[frequency])
  if (periodicRate.isZero()) return money(principal.div(term))
  const growth = new Prisma.Decimal(1).add(periodicRate).pow(term)
  return money(principal.mul(periodicRate).mul(growth).div(growth.sub(1)))
}

export function calculateInstallmentAmount(terms: FinancialLoanTerms) {
  const principal = principalAmount(terms)
  if (terms.interestType === 'FLAT') return money(principal.add(calculateFlatInterest(principal, terms.interestRate)).div(terms.term))
  return calculateReducingInstallment(principal, terms.interestRate, terms.term, terms.repaymentFrequency)
}

export function calculateLoanFinancials(terms: FinancialLoanTerms) {
  const principal = principalAmount(terms)
  const installment = calculateInstallmentAmount(terms)
  const totalRepayment = terms.interestType === 'FLAT'
    ? money(principal.add(calculateFlatInterest(principal, terms.interestRate)))
    : money(installment.mul(terms.term))
  return { principal: money(principal), interest: money(totalRepayment.sub(principal)), totalRepayment, installment }
}

export function buildRepaymentSchedule(terms: FinancialLoanTerms, startDate: Date) {
  const principal = principalAmount(terms)
  const rows: RepaymentScheduleCalculation[] = []
  let principalBalance = principal
  const installment = calculateInstallmentAmount(terms)
  const flatInterest = terms.interestType === 'FLAT' ? calculateFlatInterest(principal, terms.interestRate) : zero()
  const regularPrincipal = money(principal.div(terms.term))
  const regularInterest = terms.interestType === 'FLAT' ? money(flatInterest.div(terms.term)) : zero()
  const periodicRate = terms.interestRate.div(100).div(periodsPerYear[terms.repaymentFrequency])

  for (let number = 1; number <= terms.term; number += 1) {
    const isLast = number === terms.term
    const principalPart = terms.interestType === 'FLAT'
      ? isLast ? principalBalance : regularPrincipal
      : isLast ? principalBalance : money(installment.sub(principalBalance.mul(periodicRate)))
    const interestPart = terms.interestType === 'FLAT'
      ? isLast ? flatInterest.sub(regularInterest.mul(terms.term - 1)) : regularInterest
      : money(principalBalance.mul(periodicRate))
    const expectedAmount = money(principalPart.add(interestPart))
    principalBalance = money(principalBalance.sub(principalPart))
    rows.push({ installmentNumber: number, dueDate: addPeriod(rows.at(-1)?.dueDate ?? startDate, terms.repaymentFrequency), expectedAmount, principalAmount: money(principalPart), interestAmount: interestPart, amountPaid: zero(), remainingAmount: expectedAmount })
  }
  return rows
}

export function calculatePaidAmount(repayments: Array<{ amount: Prisma.Decimal }>) {
  return repayments.reduce((total, repayment) => total.add(repayment.amount), zero())
}

export function calculateOutstandingBalance(schedules: Array<{ remainingAmount: Prisma.Decimal }>) {
  return schedules.reduce((total, schedule) => total.add(schedule.remainingAmount), zero())
}

export function calculateOverdueAmount(schedules: Array<{ remainingAmount: Prisma.Decimal; dueDate: Date; status?: string }>, asOf = new Date()) {
  return schedules.filter((schedule) => schedule.remainingAmount.gt(0) && schedule.dueDate < asOf).reduce((total, schedule) => total.add(schedule.remainingAmount), zero())
}

export function calculateTotalRepayment(schedules: Array<{ expectedAmount: Prisma.Decimal }>) {
  return schedules.reduce((total, schedule) => total.add(schedule.expectedAmount), zero())
}
