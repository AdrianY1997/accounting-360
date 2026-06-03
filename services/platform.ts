import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  member,
  organization,
  salonSettings,
  team,
  teamMember,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import type { CreateCompanyInput } from "@/lib/validations/platform";

/** Returns the session if the user is a platform super admin, else null. */
export async function getPlatformSession() {
  const session = await getSession();
  const isPlatform = Boolean(
    (session?.user as { platformAdmin?: boolean } | undefined)?.platformAdmin,
  );
  return isPlatform ? session : null;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Suffix keeps the unique slug constraint safe across same-named companies.
  return `${base || "empresa"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function listAllOrganizations() {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      salons: sql<number>`(select count(*) from ${team} where ${team.organizationId} = ${organization.id})`,
      members: sql<number>`(select count(*) from ${member} where ${member.organizationId} = ${organization.id})`,
    })
    .from(organization)
    .orderBy(desc(organization.createdAt));
}

/**
 * Onboards a new client company: organization + owner user + owner membership +
 * first salón + its settings. Returns null if the owner email already exists.
 * Platform-admin only (enforced by the caller).
 */
export async function createCompany(input: CreateCompanyInput) {
  const email = input.ownerEmail.trim().toLowerCase();
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) return null;

  const authCtx = await auth.$context;
  const owner = await authCtx.internalAdapter.createUser({
    email,
    name: input.ownerName.trim(),
    emailVerified: true,
  });
  await authCtx.internalAdapter.createAccount({
    userId: owner.id,
    providerId: "credential",
    accountId: owner.id,
    password: await authCtx.password.hash(input.ownerPassword),
  });

  const now = new Date();
  const orgId = crypto.randomUUID();
  const teamId = crypto.randomUUID();

  await db.insert(organization).values({
    id: orgId,
    name: input.companyName.trim(),
    slug: slugify(input.companyName),
    createdAt: now,
  });
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: owner.id,
    role: "owner",
    createdAt: now,
  });
  await db.insert(team).values({
    id: teamId,
    name: input.salonName.trim(),
    organizationId: orgId,
    createdAt: now,
  });
  await db.insert(teamMember).values({
    id: crypto.randomUUID(),
    teamId,
    userId: owner.id,
    createdAt: now,
  });
  await db.insert(salonSettings).values({
    teamId,
    currency: "USD",
    taxRate: "0",
    timezone: "UTC",
  });

  return { organizationId: orgId, ownerId: owner.id };
}
