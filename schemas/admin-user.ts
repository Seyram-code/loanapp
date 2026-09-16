import { z } from 'zod'

const adminRole = z.enum(['ADMIN', 'SUPER_ADMIN'])

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  password: z.string().min(8).max(128),
  role: adminRole,
})

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  role: adminRole,
  status: z.enum(['ACTIVE', 'INACTIVE']),
  password: z.string().min(8).max(128).optional(),
})
