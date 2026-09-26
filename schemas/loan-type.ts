import { z } from 'zod'

const loanTypeFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).optional(),
  defaultInterestRate: z.number().min(0).max(100),
  defaultTerm: z.number().int().positive().max(120),
  defaultTermUnit: z.enum(['DAY', 'WEEK', 'MONTH']),
  repaymentFrequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']),
  minimumAmount: z.number().nonnegative(),
  maximumAmount: z.number().positive(),
}

export const loanTypeCreateSchema = z.object(loanTypeFields).refine((data) => data.maximumAmount >= data.minimumAmount, { message: 'Maximum amount must be greater than or equal to minimum amount', path: ['maximumAmount'] })
export const loanTypeUpdateSchema = loanTypeCreateSchema.extend({ status: z.enum(['ACTIVE', 'INACTIVE']) })
