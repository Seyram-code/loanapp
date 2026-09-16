import type { Prisma } from '@prisma/client'

type AuditWriter = { auditLog: { create: (args: Prisma.AuditLogCreateArgs) => Promise<unknown> } }

type AuditInput = {
  userId: string
  action: string
  entity: string
  entityId?: string
  description: string
  ipAddress?: string
  userAgent?: string
  metadata?: Prisma.InputJsonValue
}

export function recordAudit(writer: AuditWriter, input: AuditInput) {
  return writer.auditLog.create({ data: input })
}