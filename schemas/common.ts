import { z } from 'zod'

export const idSchema = z.string().trim().min(1).max(64)
export const amountSchema = z.number().finite().positive()
export const nonNegativeAmountSchema = z.number().finite().nonnegative()
export const percentageSchema = z.number().finite().min(0).max(100)
export const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,30}$/, 'Enter a valid phone number')
export const optionalPhoneSchema = phoneSchema.optional().or(z.literal(''))
export const optionalEmailSchema = z.email().optional().or(z.literal(''))
export const optionalDateSchema = z.coerce.date().optional()
export const referenceSchema = z.string().trim().min(1).max(100).optional().or(z.literal(''))
