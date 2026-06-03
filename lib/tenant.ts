import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { member, team, teamMember } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const ACTIVE_SALON_COOKIE = "activeSalonId";
export const ACTIVE_ORG_COOKIE = "activeOrgId";

export type SalonContext = {
  userId: string;
  organizationId: string;
  salonId: string;
  role: string;
};

/**
 * Resolves the acting user's active salón context (organization + salón + role).
 *
 * Prefers the Better Auth active org/team on the session; falls back to the
 * user's first membership / first salón in that organization. Throws if the
 * user has no organization or no salón — every accounting query depends on this
 * scope, so callers must have a valid tenant context.
 */
export async function requireSalonContext(): Promise<SalonContext> {
  const { user, session } = await requireSession();
  const cookieStore = await cookies();

  // Active organization: explicit cookie > Better Auth active org > first.
  const findMembership = (orgId: string) =>
    db.query.member.findFirst({
      where: and(
        eq(member.userId, user.id),
        eq(member.organizationId, orgId),
      ),
    });
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const membership =
    (cookieOrg ? await findMembership(cookieOrg) : undefined) ??
    (session.activeOrganizationId
      ? await findMembership(session.activeOrganizationId)
      : undefined) ??
    (await db.query.member.findFirst({ where: eq(member.userId, user.id) }));

  if (!membership) {
    throw new Error("El usuario no pertenece a ninguna empresa");
  }
  const organizationId = membership.organizationId;

  // Salones the user is assigned to within this organization.
  const assigned = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(
      and(
        eq(teamMember.userId, user.id),
        eq(team.organizationId, organizationId),
      ),
    );

  // Active salón: explicit cookie selection > Better Auth active team > first.
  const cookieSalon = cookieStore.get(ACTIVE_SALON_COOKIE)?.value;
  const salonId =
    assigned.find((a) => a.teamId === cookieSalon)?.teamId ??
    assigned.find((a) => a.teamId === session.activeTeamId)?.teamId ??
    assigned[0]?.teamId;

  if (!salonId) {
    throw new Error("El usuario no tiene ningún salón asignado");
  }

  return { userId: user.id, organizationId, salonId, role: membership.role };
}
