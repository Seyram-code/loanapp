import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { systemSettingSchema } from '../schemas/system-setting'

export async function getSystemSettings() {
  return prisma.systemSetting.upsert({ where: { id: 'default' }, create: { id: 'default' }, update: {} })
}

export async function updateSystemSettings(input: unknown, userId: string) {
  const data = systemSettingSchema.parse(input)
  const settings = await prisma.systemSetting.upsert({ where: { id: 'default' }, create: { id: 'default', ...data }, update: data })
  await recordAudit(prisma, { userId, action: 'SETTINGS_UPDATED', entity: 'SystemSetting', entityId: settings.id, description: 'System settings were updated', metadata: { organizationName: settings.organizationName, currency: settings.currency } })
  return settings
}
