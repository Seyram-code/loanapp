import { z } from 'zod'

export const idSchema = z.string().trim().min(1).max(64)
const hasCentPrecision = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
export const amountSchema = z.number().finite().positive().refine(hasCentPrecision, 'Amount cannot have more than two decimal places')
export const nonNegativeAmountSchema = z.number().finite().nonnegative().refine(hasCentPrecision, 'Amount cannot have more than two decimal places')
export const percentageSchema = z.number().finite().min(0).max(100)
export const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,30}$/, 'Enter a valid phone number')
export const optionalPhoneSchema = phoneSchema.optional().or(z.literal(''))
export const optionalEmailSchema = z.email().optional().or(z.literal(''))
export const optionalDateSchema = z.coerce.date().optional()
export const referenceSchema = z.string().trim().min(1).max(100).optional().or(z.literal(''))
