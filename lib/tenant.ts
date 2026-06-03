import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { member, organization, team, teamMember } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const ACTIVE_SALON_COOKIE = "activeSalonId";
export const ACTIVE_ORG_COOKIE = "activeOrgId";

export type SalonContext = {
  userId: string;
  organizationId: string;
  salonId: string;
  role: string;
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

  const membership =
    (cookieOrg ? await findMembership(cookieOrg) : undefined) ??
    (session.activeOrganizationId
      ? await findMembership(session.activeOrganizationId)
      : undefined) ??
    (await db.query.member.findFirst({ where: eq(member.userId, user.id) }));

  let organizationId: string;
  let role: string;
  let impersonating = false;

  if (membership) {
    organizationId = membership.organizationId;
    role = membership.role;
  } else if (platformAdmin && cookieOrg) {
    // Impersonation: the org must exist; platform admin operates it as admin.
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, cookieOrg),
    });
    if (!org) throw new Error("Empresa no encontrada");
    organizationId = cookieOrg;
    role = "admin";
    impersonating = true;
  } else {
    throw new Error("El usuario no pertenece a ninguna empresa");
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

  return { userId: user.id, organizationId, salonId, role, impersonating };
}
