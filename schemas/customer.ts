import { z } from 'zod'
import { nonNegativeAmountSchema, optionalDateSchema, optionalEmailSchema, optionalPhoneSchema } from './common'

export const GHANA_NATIONAL_ID_PREFIX = 'GHA-'
export const GHANA_NATIONAL_ID_PATTERN = /^GHA-\d{9}-\d$/

export function formatGhanaNationalId(value: string) {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 10)

  if (digits.length <= 9) {
    return `${GHANA_NATIONAL_ID_PREFIX}${digits}`
  }

  return `${GHANA_NATIONAL_ID_PREFIX}${digits.slice(0, 9)}-${digits[9]}`
}

export function isValidGhanaNationalId(value?: string | null) {
  if (!value) return false
  const normalized = value.trim().toUpperCase()
  return GHANA_NATIONAL_ID_PATTERN.test(normalized)
}

const ghanaNationalIdSchema = z
  .string()
  .trim()
  .transform((value) => formatGhanaNationalId(value))
  .refine((value) => isValidGhanaNationalId(value), {
    message: 'National ID must match GHA-123456789-1 format',
  })

export const customerCreateSchema = z.object({
  referredByCustomerId: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: optionalDateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  alternatePhone: optionalPhoneSchema,
  email: optionalEmailSchema,
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).default('Ghana'),
  nationalId: ghanaNationalIdSchema.optional(),
  occupation: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  monthlyIncome: nonNegativeAmountSchema.optional(),
  emergencyContactName: z.string().trim().max(160).optional(),
  emergencyContactPhone: optionalPhoneSchema,
  emergencyContactRelationship: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(5000).optional(),
})

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>
