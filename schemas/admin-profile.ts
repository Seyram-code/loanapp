import { z } from 'zod'
import { optionalEmailSchema } from './common'

export const adminProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: optionalEmailSchema.pipe(z.string().min(1, 'Email is required')),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
}).superRefine((data, context) => {
  if (data.newPassword && !data.currentPassword) {
    context.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Current password is required to set a new password' })
  }
})
