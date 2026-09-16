import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { verifyPassword, hashPassword } from '../lib/password'
import { adminProfileSchema } from '../schemas/admin-profile'

export async function getAdminProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } })
}

export async function updateAdminProfile(userId: string, input: unknown) {
  const data = adminProfileSchema.parse(input)
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } })
    if (!user) throw new Error('Admin profile not found')
    if (data.newPassword && !(await verifyPassword(data.currentPassword ?? '', user.passwordHash))) throw new Error('Current password is incorrect')

    const updated = await transaction.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email, ...(data.newPassword ? { passwordHash: hashPassword(data.newPassword) } : {}) },
      select: { id: true, name: true, email: true, role: true },
    })
    await recordAudit(transaction, { userId, action: 'ADMIN_PROFILE_UPDATED', entity: 'User', entityId: userId, description: 'Administrator profile was updated', metadata: { email: updated.email, passwordChanged: Boolean(data.newPassword) } })
    return updated
  })
}
