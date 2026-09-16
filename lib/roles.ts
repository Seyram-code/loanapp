export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'ACCOUNTANT', 'MANAGER', 'CUSTOMER'] as const
export type Role = (typeof ROLES)[number]

export const ACTIVE_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const
export type ActiveAdminRole = (typeof ACTIVE_ADMIN_ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function isAdminRole(role: Role): role is ActiveAdminRole {
  return (ACTIVE_ADMIN_ROLES as readonly string[]).includes(role)
}

export function hasAnyRole(role: Role, allowedRoles: readonly Role[]) {
  return allowedRoles.includes(role)
}