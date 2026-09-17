import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function badRequestResponse(message = 'Invalid request') {
  return NextResponse.json({ error: message }, { status: 400 })
}

const safeMessages = new Set([
  'Loan does not belong to customer',
  'Loan is not open for repayment',
  'Repayment exceeds the outstanding balance',
  'Completed loans cannot accept repayments',
  'Loan is no longer open for repayment',
  'Loan is not pending approval',
  'Loan is not under review',
  'Loan is not approved for disbursement',
  'Invalid loan transition from DRAFT',
  'Invalid loan transition from PENDING',
  'Invalid loan transition from DISBURSED',
  'Only active loans can be defaulted',
  'Loan has no overdue balance',
  'Disbursement exceeds approved amount',
  'Rejection reason is required',
  'Selected customer was not found',
  'Selected referring customer was not found',
  'A customer cannot refer themselves',
  'Selected loan type was not found',
  'Current password is incorrect',
  'You cannot deactivate your own account',
])

export function logServerError(context: string, error: unknown) {
  console.error(`[${context}]`, error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error: String(error), details: JSON.stringify(error) })
}

export function safeErrorResponse(error: unknown, context: string) {
  logServerError(context, error)
  if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse()
  if (error instanceof Error && error.message === 'Forbidden') return forbiddenResponse()
  if (error instanceof ZodError || error instanceof SyntaxError) return badRequestResponse('Please check the submitted values.')
  if (error instanceof Error && safeMessages.has(error.message)) return badRequestResponse(error.message)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
