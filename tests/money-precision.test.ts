import test from 'node:test'
import assert from 'node:assert/strict'

import { amountSchema, nonNegativeAmountSchema } from '../schemas/common'

test('persisted monetary values accept cents and reject fractional cents', () => {
  assert.equal(amountSchema.safeParse(10).success, true)
  assert.equal(amountSchema.safeParse(10.25).success, true)
  assert.equal(amountSchema.safeParse(10.251).success, false)
  assert.equal(nonNegativeAmountSchema.safeParse(0).success, true)
  assert.equal(nonNegativeAmountSchema.safeParse(10.25).success, true)
  assert.equal(nonNegativeAmountSchema.safeParse(10.251).success, false)
})