import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  member,
  memberPermission,
  organization,
  team,
  teamMember,
} from "@/db/schema";
import { requireSession } from "@/lib/session";
import { isAdmin, type Permission } from "@/lib/roles";

export const ACTIVE_SALON_COOKIE = "activeSalonId";
export const ACTIVE_ORG_COOKIE = "activeOrgId";

export type SalonContext = {
  userId: string;
  organizationId: string;
  salonId: string;
  role: string;
  /** Granular permissions for non-owner members (owners get all via `can`). */
  permissions: Permission[];
  /** True when a platform admin is operating an org they don't belong to. */
  impersonating: boolean;
};

/**
 * Resolves the acting user's active salón context (organization + salón + role).
 *
 * Normal users: active org/salón come from cookies (then Better Auth active
 * org/team, then first membership / first assigned salón). Platform admins may
 * also **impersonate** any org via the `activeOrgId` cookie even without a
 * membership (role = `admin`), to support client companies. Throws if no valid
 * scope can be resolved — every accounting query depends on it.
 */
export async function requireSalonContext(): Promise<SalonContext> {
  const { user, session } = await requireSession();
  const cookieStore = await cookies();
  const platformAdmin = Boolean(
    (user as { platformAdmin?: boolean }).platformAdmin,
  );

  const findMembership = (orgId: string) =>
    db.query.member.findFirst({
      where: and(eq(member.userId, user.id), eq(member.organizationId, orgId)),
    });

  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const cookieSalon = cookieStore.get(ACTIVE_SALON_COOKIE)?.value;

  let organizationId: string | undefined;
  let role: string | undefined;
  let memberId: string | undefined;
  let impersonating = false;

  // An explicit org cookie wins: use the membership if any, else (platform
  // admin) impersonate. Do NOT fall back to another org when a cookie is set —
  // that would silently ignore the requested company.
  if (cookieOrg) {
    const m = await findMembership(cookieOrg);
    if (m) {
      organizationId = cookieOrg;
      role = m.role;
      memberId = m.id;
    } else if (platformAdmin) {
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, cookieOrg),
      });
      if (org) {
        organizationId = cookieOrg;
        role = "admin";
        impersonating = true;
      }
    }
  }

  // No (valid) cookie: Better Auth active org, then first membership.
  if (!organizationId) {
    const m =
      (session.activeOrganizationId
        ? await findMembership(session.activeOrganizationId)
        : undefined) ??
      (await db.query.member.findFirst({ where: eq(member.userId, user.id) }));
    if (!m) throw new Error("El usuario no pertenece a ninguna empresa");
    organizationId = m.organizationId;
    role = m.role;
    memberId = m.id;
  }

  // Permissions: owners/admins get all (via `can`); others, the explicit set.
  let permissions: Permission[] = [];
  if (memberId && !isAdmin(role ?? "")) {
    const rows = await db
      .select({ permission: memberPermission.permission })
      .from(memberPermission)
      .where(eq(memberPermission.memberId, memberId));
    permissions = rows.map((r) => r.permission as Permission);
  }

  // Salón: assigned salones (normal) or all org salones (impersonation).
  const orgSalons = impersonating
    ? await db
        .select({ teamId: team.id })
        .from(team)
        .where(eq(team.organizationId, organizationId))
    : await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .innerJoin(team, eq(team.id, teamMember.teamId))
        .where(
          and(
            eq(teamMember.userId, user.id),
            eq(team.organizationId, organizationId),
          ),
        );

  const salonId =
    orgSalons.find((a) => a.teamId === cookieSalon)?.teamId ??
    orgSalons.find((a) => a.teamId === session.activeTeamId)?.teamId ??
    orgSalons[0]?.teamId;

  if (!salonId) {
    throw new Error("El usuario no tiene ningún salón asignado");
  }

  return {
    userId: user.id,
    organizationId,
    salonId,
    role: role!,
    permissions,
    impersonating,
  };
}
