import { prisma } from '../lib/prisma'

export async function listAuditLogs(page = 1, pageSize = 10) {
  page = Math.max(1, page)
  pageSize = Math.min(50, Math.max(5, pageSize))
  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ where: {}, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.auditLog.count(),
  ])
  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
