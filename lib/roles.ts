/**
 * Access model. `member.role` keeps `owner` for the empresa creator (implicit
 * full access); everyone else gets an explicit, fully-custom permission set
 * (table `member_permission`). There is no fixed role→permission matrix.
 */
export const ROLES = ["owner", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const roleLabels: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  staff: "Personal",
};

const ADMIN_ROLES: readonly string[] = ["owner", "admin"];

/** Owner/admin: implicit full access (config, staff, everything). */
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

/** All assignable permissions (owner can grant any of these). */
export const ALL_PERMISSIONS: Permission[] = [
  "clients:write",
  "catalog:write",
  "sales:write",
  "payments:write",
  "sales:void",
  "cash:manage",
  "expenses:write",
  "reports:view",
  "commissions:manage",
  "settings:manage",
  "salon:manage",
  "staff:manage",
];

export const permissionLabels: Record<Permission, string> = {
  "clients:write": "Clientes (crear/editar)",
  "catalog:write": "Catálogo (productos/servicios)",
  "sales:write": "Registrar ventas",
  "payments:write": "Registrar pagos",
  "sales:void": "Anular ventas",
  "cash:manage": "Caja (abrir/cerrar/movimientos)",
  "expenses:write": "Gastos",
  "reports:view": "Reportes y comisiones",
  "commissions:manage": "Configurar reglas de comisión",
  "settings:manage": "Configuración del salón",
  "salon:manage": "Crear salones",
  "staff:manage": "Gestionar personal",
};

export type AccessContext = { role: string; permissions: readonly Permission[] };

/** Whether the context may perform a capability. Owners/admins always can. */
export function can(ctx: AccessContext, permission: Permission): boolean {
  if (isAdmin(ctx.role)) return true;
  return ctx.permissions.includes(permission);
}
