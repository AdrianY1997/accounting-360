import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { salonSettings, team, teamMember } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type { CreateSalonInput } from "@/lib/validations/salon";

export type SalonOption = { id: string; name: string };

/** Salones (teams) in the org the user is assigned to. */
export async function listSalons(ctx: SalonContext): Promise<SalonOption[]> {
  return db
    .select({ id: team.id, name: team.name })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(
      and(
        eq(teamMember.userId, ctx.userId),
        eq(team.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(team.createdAt);
}

export async function isAssigned(ctx: SalonContext, salonId: string) {
  const found = await db.query.teamMember.findFirst({
    where: and(
      eq(teamMember.userId, ctx.userId),
      eq(teamMember.teamId, salonId),
    ),
  });
  return Boolean(found);
}

/** Creates a salón (team) + its settings and assigns the creator. Admin only. */
export async function createSalon(ctx: SalonContext, input: CreateSalonInput) {
  const now = new Date();
  const teamId = crypto.randomUUID();
  await db.insert(team).values({
    id: teamId,
    name: input.name.trim(),
    organizationId: ctx.organizationId,
    createdAt: now,
  });
  await db.insert(teamMember).values({
    id: crypto.randomUUID(),
    teamId,
    userId: ctx.userId,
    createdAt: now,
  });
  await db.insert(salonSettings).values({
    teamId,
    currency: "USD",
    taxRate: "0",
    timezone: "UTC",
  });
  return { id: teamId };
}
