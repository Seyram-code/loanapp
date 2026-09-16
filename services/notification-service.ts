import { prisma } from '../lib/prisma'

export async function listNotifications(userId: string, unreadOnly = false, page = 1, pageSize = 10) {
  page = Math.max(1, page)
  pageSize = Math.min(50, Math.max(5, pageSize))
  const where = { userId, ...(unreadOnly ? { read: false } : {}) }
  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])
  return { notifications, unreadCount, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
}

export async function deleteNotification(userId: string, id: string) {
  return prisma.notification.deleteMany({ where: { id, userId } })
}

export async function clearReadNotifications(userId: string) {
  return prisma.notification.deleteMany({ where: { userId, read: true } })
}

export async function createNotification(input: { userId: string; title: string; message: string; type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'LOAN' | 'REPAYMENT' | 'SYSTEM' }) {
  return prisma.notification.create({ data: input })
}
