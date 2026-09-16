import { getSession, type Session } from './auth'
import { isAdminRole, type Role } from './roles'

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin.access',
  CUSTOMERS_MANAGE: 'customers.manage',
  LOANS_READ: 'loans.read',
  LOANS_CREATE: 'loans.create',
  LOANS_APPROVE: 'loans.approve',
  LOANS_DISBURSE: 'loans.disburse',
  LOAN_SCHEDULES_READ: 'loan_schedules.read',
  REPAYMENTS_MANAGE: 'repayments.manage',
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  SETTINGS_MANAGE: 'settings.manage',
  LOAN_APPLICATIONS_MANAGE: 'loan_applications.manage',
  CUSTOMER_PORTAL: 'customer.portal',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
const allAdminPermissions = Object.values(PERMISSIONS)

const rolePermissions: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: allAdminPermissions,
  ADMIN: allAdminPermissions,
  LOAN_OFFICER: [PERMISSIONS.LOANS_READ, PERMISSIONS.LOANS_CREATE, PERMISSIONS.LOAN_APPLICATIONS_MANAGE, PERMISSIONS.LOAN_SCHEDULES_READ],
  ACCOUNTANT: [PERMISSIONS.LOANS_READ, PERMISSIONS.REPAYMENTS_MANAGE],
  MANAGER: [PERMISSIONS.LOANS_READ, PERMISSIONS.LOANS_APPROVE, PERMISSIONS.LOAN_SCHEDULES_READ],
  CUSTOMER: [PERMISSIONS.CUSTOMER_PORTAL],
}

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission)
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth()
  if (!roles.includes(session.role)) throw new Error('Forbidden')
  return session
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth()
  if (!hasPermission(session.role, permission)) throw new Error('Forbidden')
  return session
}

export function canAccessAdminPermission(session: Session | null, permission: Permission) {
  return session !== null && isAdminRole(session.role) && hasPermission(session.role, permission)
}
