import { z } from 'zod'
import { amountSchema, referenceSchema } from './common'

export const disbursementCreateSchema = z.object({
  amount: amountSchema,
  disbursementDate: z.coerce.date().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER']),
  referenceNumber: referenceSchema,
  notes: z.string().trim().max(5000).optional(),
})