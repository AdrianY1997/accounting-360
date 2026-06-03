/**
 * Organization roles (Better Auth `member.role`). `owner` is the empresa
 * creator; the rest are assigned to staff. Admin-tier roles may manage config,
 * staff, and destructive actions; others are operational only.
 */
export const ROLES = ["owner", "admin", "manager", "cashier", "staff"] as const;
export type Role = (typeof ROLES)[number];

/** Roles an admin can assign to staff (owner is reserved for the creator). */
export const ASSIGNABLE_ROLES = [
  "admin",
  "manager",
  "cashier",
  "staff",
] as const;

export const roleLabels: Record<Role, string> = {
  owner: "Dueño",
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Cajero",
  staff: "Estilista",
};

const ADMIN_ROLES: readonly string[] = ["owner", "admin"];

/** True for config / staff / destructive privileges. */
export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}
