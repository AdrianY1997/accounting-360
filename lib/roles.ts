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

/** Granular capabilities, checked on the server and used to gate UI. */
export type Permission =
  | "clients:write"
  | "catalog:write"
  | "sales:write"
  | "sales:void"
  | "payments:write"
  | "expenses:write"
  | "cash:manage"
  | "commissions:manage"
  | "reports:view"
  | "settings:manage"
  | "staff:manage"
  | "salon:manage";

const ALL: Permission[] = [
  "clients:write",
  "catalog:write",
  "sales:write",
  "sales:void",
  "payments:write",
  "expenses:write",
  "cash:manage",
  "commissions:manage",
  "reports:view",
  "settings:manage",
  "staff:manage",
  "salon:manage",
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL,
  admin: ALL,
  manager: [
    "clients:write",
    "catalog:write",
    "sales:write",
    "sales:void",
    "payments:write",
    "expenses:write",
    "cash:manage",
    "reports:view",
  ],
  cashier: ["clients:write", "sales:write", "payments:write", "cash:manage"],
  staff: ["sales:write", "payments:write"],
};

/** Whether a role may perform a capability. Unknown roles get nothing. */
export function can(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as Role];
  return perms ? perms.includes(permission) : false;
}
