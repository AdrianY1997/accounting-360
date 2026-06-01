import "dotenv/config";
import { eq } from "drizzle-orm";
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

/**
 * Bootstraps the first admin account + one empresa (organization) and one salón
 * (team), since public sign-up is disabled. Idempotent: re-running won't
 * duplicate the admin user.
 *
 * Override defaults with env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD,
 * SEED_ADMIN_NAME, SEED_ORG_NAME, SEED_SALON_NAME.
 */
async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@salon360.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const orgName = process.env.SEED_ORG_NAME ?? "Mi Empresa";
  const salonName = process.env.SEED_SALON_NAME ?? "Salón Principal";

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) {
    console.log(`Admin ${email} already exists — nothing to do.`);
    return;
  }

  // Create user + credential account via Better Auth internals (bypasses the
  // disabled public sign-up).
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser({
    email,
    name,
    emailVerified: true,
  });
  await ctx.internalAdapter.createAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await ctx.password.hash(password),
  });

  const now = new Date();
  const orgId = crypto.randomUUID();
  const teamId = crypto.randomUUID();
  const slug = orgName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  await db.insert(organization).values({
    id: orgId,
    name: orgName,
    slug,
    createdAt: now,
  });
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: created.id,
    role: "owner",
    createdAt: now,
  });
  await db.insert(team).values({
    id: teamId,
    name: salonName,
    organizationId: orgId,
    createdAt: now,
  });
  await db.insert(teamMember).values({
    id: crypto.randomUUID(),
    teamId,
    userId: created.id,
    createdAt: now,
  });
  await db.insert(salonSettings).values({
    teamId,
    currency: "USD",
    taxRate: "0",
    timezone: "UTC",
  });

  console.log(`Seeded admin ${email} / ${password}`);
  console.log(`Empresa "${orgName}" + salón "${salonName}" created.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
