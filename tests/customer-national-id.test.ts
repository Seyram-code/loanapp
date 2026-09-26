import test from 'node:test'
import assert from 'node:assert/strict'

import { customerCreateSchema, formatGhanaNationalId, isValidGhanaNationalId } from '../schemas/customer'

test('formats Ghana card IDs with a fixed GHA prefix and trailing check digit', () => {
  assert.equal(formatGhanaNationalId('1234567891'), 'GHA-123456789-1')
  assert.equal(formatGhanaNationalId('gha-123456789-1'), 'GHA-123456789-1')
  assert.equal(formatGhanaNationalId('123456789'), 'GHA-123456789')
})

test('accepts only the required Ghana card pattern', () => {
  assert.equal(isValidGhanaNationalId('GHA-123456789-1'), true)
  assert.equal(isValidGhanaNationalId('GHA-123456789'), false)
  assert.equal(isValidGhanaNationalId('1234567891'), false)
  assert.equal(isValidGhanaNationalId('GHA-'), false)
})

test('customer phone number must contain exactly 10 digits', () => {
  const validCustomer = { firstName: 'Ama', lastName: 'Mensah' }

  assert.equal(customerCreateSchema.safeParse({ ...validCustomer, phone: '0241234567' }).success, true)
  assert.equal(customerCreateSchema.safeParse({ ...validCustomer, phone: '024123456' }).success, false)
  assert.equal(customerCreateSchema.safeParse({ ...validCustomer, phone: '02412345678' }).success, false)
  assert.equal(customerCreateSchema.safeParse({ ...validCustomer, phone: '+233241234567' }).success, false)
})
