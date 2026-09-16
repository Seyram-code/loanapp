import { z } from 'zod'
import { amountSchema, idSchema, referenceSchema } from './common'

export const repaymentCreateSchema = z.object({
  loanId: idSchema,
  customerId: idSchema,
  amount: amountSchema,
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']),
  referenceNumber: referenceSchema,
  notes: z.string().trim().max(5000).optional(),
})
