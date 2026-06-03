import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { account, member, team, teamMember, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { SalonContext } from "@/lib/tenant";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "@/lib/validations/staff";

export type StaffRow = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

/** Members of the caller's organization. */
export async function listStaff(ctx: SalonContext): Promise<StaffRow[]> {
  return db
    .select({
      memberId: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, ctx.organizationId))
    .orderBy(member.createdAt);
}

/**
 * Admin-provisions a staff account (public sign-up is disabled): creates the
 * user + credential account via Better Auth internals, an org membership with
 * the given role, and assigns them to the current salón. Returns null if the
 * email already exists.
 */
export async function createStaff(ctx: SalonContext, input: CreateStaffInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) return null;

  const authCtx = await auth.$context;
  const created = await authCtx.internalAdapter.createUser({
    email,
    name: input.name.trim(),
    emailVerified: true,
  });
  await authCtx.internalAdapter.createAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await authCtx.password.hash(input.password),
  });

  const now = new Date();
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: ctx.organizationId,
    userId: created.id,
    role: input.role,
    createdAt: now,
  });
  await db.insert(teamMember).values({
    id: crypto.randomUUID(),
    teamId: ctx.salonId,
    userId: created.id,
    createdAt: now,
  });
  return { id: created.id };
}

/** Resolves a membership in the caller's org, or null. */
async function findMember(ctx: SalonContext, memberId: string) {
  return db.query.member.findFirst({
    where: and(
      eq(member.id, memberId),
      eq(member.organizationId, ctx.organizationId),
    ),
  });
}

export async function updateStaff(
  ctx: SalonContext,
  memberId: string,
  input: UpdateStaffInput,
) {
  const m = await findMember(ctx, memberId);
  if (!m) return null;

  if (input.role) {
    await db
      .update(member)
      .set({ role: input.role })
      .where(eq(member.id, memberId));
  }
  if (input.password) {
    const authCtx = await auth.$context;
    const accounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, m.userId),
          eq(account.providerId, "credential"),
        ),
      );
    const hash = await authCtx.password.hash(input.password);
    if (accounts.length > 0) {
      await db
        .update(account)
        .set({ password: hash })
        .where(eq(account.id, accounts[0].id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: m.userId,
        providerId: "credential",
        accountId: m.userId,
        password: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  return { id: memberId };
}

/** Removes a member from the org (membership + salón assignments). The user
 * record is kept. Refuses to remove the last owner or oneself. */
export async function removeStaff(ctx: SalonContext, memberId: string) {
  const m = await findMember(ctx, memberId);
  if (!m) return { ok: false as const, reason: "not_found" };
  if (m.userId === ctx.userId) {
    return { ok: false as const, reason: "self" };
  }
  if (m.role === "owner") {
    return { ok: false as const, reason: "owner" };
  }

  // Salón ids of this org to clean team_member rows.
  const teams = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.organizationId, ctx.organizationId));
  const teamIds = teams.map((t) => t.id);
  if (teamIds.length > 0) {
    await db
      .delete(teamMember)
      .where(
        and(
          eq(teamMember.userId, m.userId),
          inArray(teamMember.teamId, teamIds),
        ),
      );
  }
  await db.delete(member).where(eq(member.id, memberId));
  return { ok: true as const };
}
