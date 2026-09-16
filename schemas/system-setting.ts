import { z } from 'zod'

export const systemSettingSchema = z.object({
  organizationName: z.string().trim().min(1).max(160),
  organizationLogoUrl: z.union([z.url(), z.literal('')]).optional(),
  address: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.email().optional().or(z.literal('')),
  currency: z.string().trim().min(1).max(8),
  dateFormat: z.string().trim().min(1).max(32),
  defaultInterestRate: z.number().min(0).max(100),
  defaultLoanTerm: z.number().int().positive().max(120),
  defaultRepaymentFrequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']),
})
