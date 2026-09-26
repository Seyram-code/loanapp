import test from 'node:test'
import assert from 'node:assert/strict'
import { Prisma } from '@prisma/client'

import { buildRepaymentSchedule, calculateLoanFinancials } from '../services/financial-calculation-service'

const dailyTerms = {
  requestedAmount: new Prisma.Decimal(500),
  approvedAmount: null,
  interestRate: new Prisma.Decimal(7),
  interestType: 'FLAT' as const,
  term: 6,
  termUnit: 'DAY' as const,
  repaymentFrequency: 'DAILY' as const,
}

test('daily flat interest applies once for each day in the term', () => {
  const result = calculateLoanFinancials(dailyTerms)

  assert.equal(result.interest.toFixed(2), '210.00')
  assert.equal(result.totalRepayment.toFixed(2), '710.00')
  assert.equal(result.installment.toFixed(2), '118.33')
})

test('daily flat repayment schedule totals the daily-interest loan amount', () => {
  const schedule = buildRepaymentSchedule(dailyTerms, new Date('2026-09-26T00:00:00.000Z'))

  assert.equal(schedule.length, 6)
  assert.equal(schedule.reduce((total, row) => total.add(row.expectedAmount), new Prisma.Decimal(0)).toFixed(2), '710.00')
  assert.equal(schedule.reduce((total, row) => total.add(row.interestAmount), new Prisma.Decimal(0)).toFixed(2), '210.00')
  assert.deepEqual(schedule.map((row) => row.dueDate.toISOString().slice(0, 10)), [
    '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02',
  ])
})