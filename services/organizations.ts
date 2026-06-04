import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { member, organization } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";

export type OrgOption = { id: string; name: string };

/** Organizations the user is a member of. */
export async function listUserOrganizations(
  ctx: SalonContext,
): Promise<OrgOption[]> {
  return db
    .select({ id: organization.id, name: organization.name })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, ctx.userId))
    .orderBy(organization.name);
}

/**
 * Organizations the user can switch into from the header: their memberships,
 * or every company for a platform admin (who switches via impersonation).
 */
export async function listSwitchableOrganizations(
  ctx: SalonContext,
  platformAdmin: boolean,
): Promise<OrgOption[]> {
  if (platformAdmin) {
    return db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .orderBy(organization.name);
  }
  return listUserOrganizations(ctx);
}

export async function isOrgMember(ctx: SalonContext, organizationId: string) {
  const found = await db.query.member.findFirst({
    where: and(
      eq(member.userId, ctx.userId),
      eq(member.organizationId, organizationId),
    ),
  });
  return Boolean(found);
}
