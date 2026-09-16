import { z } from 'zod'
import { nonNegativeAmountSchema, optionalDateSchema, optionalEmailSchema, optionalPhoneSchema, phoneSchema } from './common'

export const customerCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: optionalDateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phone: phoneSchema,
  alternatePhone: optionalPhoneSchema,
  email: optionalEmailSchema,
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).default('Ghana'),
  nationalId: z.string().trim().max(64).optional(),
  occupation: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  monthlyIncome: nonNegativeAmountSchema.optional(),
  emergencyContactName: z.string().trim().max(160).optional(),
  emergencyContactPhone: optionalPhoneSchema,
  emergencyContactRelationship: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(5000).optional(),
})

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>
