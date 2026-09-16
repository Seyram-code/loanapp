import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { hashPassword } from '../lib/password'
import { adminUserCreateSchema, adminUserUpdateSchema } from '../schemas/admin-user'

const adminWhere: Prisma.UserWhereInput = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }

export async function listAdminUsers(page = 1, pageSize = 10) {
  page = Math.max(1, page)
  pageSize = Math.min(50, Math.max(5, pageSize))
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where: adminWhere, select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true }, orderBy: [{ status: 'asc' }, { name: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.user.count({ where: adminWhere }),
  ])
  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function createAdminUser(input: unknown, actorId: string) {
  const data = adminUserCreateSchema.parse(input)
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({ data: { name: data.name, email: data.email, passwordHash: hashPassword(data.password), role: data.role, status: 'ACTIVE' }, select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true } })
    await recordAudit(transaction, { userId: actorId, action: 'ADMIN_USER_CREATED', entity: 'User', entityId: user.id, description: `Admin user ${user.email} was created`, metadata: { role: user.role } })
    return user
  })
}

export async function updateAdminUser(id: string, input: unknown, actorId: string) {
  const data = adminUserUpdateSchema.parse(input)
  if (id === actorId && data.status === 'INACTIVE') throw new Error('You cannot deactivate your own account')
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!existing || !['ADMIN', 'SUPER_ADMIN'].includes(existing.role)) throw new Error('Admin user not found')
    const user = await transaction.user.update({ where: { id }, data: { name: data.name, email: data.email, role: data.role, status: data.status, ...(data.password ? { passwordHash: hashPassword(data.password) } : {}) }, select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true } })
    await recordAudit(transaction, { userId: actorId, action: 'ADMIN_USER_UPDATED', entity: 'User', entityId: user.id, description: `Admin user ${user.email} was updated`, metadata: { role: user.role, status: user.status, passwordChanged: Boolean(data.password) } })
    return user
  })
}
