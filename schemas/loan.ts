import { z } from 'zod'
import { loanStatuses } from '../types/loan'
import { amountSchema, idSchema, percentageSchema, optionalDateSchema } from './common'

export const loanStatusSchema = z.enum(loanStatuses)

export const loanFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.union([z.literal('All loans'), loanStatusSchema]).optional(),
})

export const loanCreateSchema = z.object({
  customerId: idSchema,
  referredByCustomerId: idSchema.optional().or(z.literal('')),
  loanTypeId: idSchema,
  requestedAmount: amountSchema.min(100, 'Requested amount must be at least 100'),
  approvedAmount: amountSchema.optional(),
  interestRate: percentageSchema,
  interestType: z.enum(['FLAT', 'REDUCING_BALANCE']),
  term: z.number().int().positive().max(120),
  termUnit: z.enum(['WEEK', 'MONTH']),
  repaymentFrequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']),
  purpose: z.string().trim().max(255).optional(),
  applicationDate: optionalDateSchema,
  maturityDate: optionalDateSchema,
  notes: z.string().trim().max(5000).optional(),
}).superRefine((data, context) => {
  if (data.approvedAmount !== undefined && data.approvedAmount > data.requestedAmount) context.addIssue({ code: 'custom', path: ['approvedAmount'], message: 'Approved amount cannot exceed requested amount' })
  if (data.maturityDate && data.applicationDate && data.maturityDate < data.applicationDate) context.addIssue({ code: 'custom', path: ['maturityDate'], message: 'Maturity date cannot be before application date' })
})
