import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateRepaymentDueDates } from '../utils/repayment-dates'

test('calculates each daily repayment date after the start date', () => {
  const dueDates = calculateRepaymentDueDates(new Date('2026-09-26T00:00:00.000Z'), 6, 'DAILY')

  assert.deepEqual(dueDates.map((date) => date.toISOString().slice(0, 10)), [
    '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02',
  ])
})

test('keeps monthly repayments on the end of shorter calendar months', () => {
  const dueDates = calculateRepaymentDueDates(new Date('2026-01-31T00:00:00.000Z'), 3, 'MONTHLY')

  assert.deepEqual(dueDates.map((date) => date.toISOString().slice(0, 10)), [
    '2026-02-28', '2026-03-28', '2026-04-28',
  ])
})