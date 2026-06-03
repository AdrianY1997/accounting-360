import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { isOrgMember } from "@/services/organizations";
import { getPlatformSession } from "@/services/platform";
import {
  ACTIVE_ORG_COOKIE,
  ACTIVE_SALON_COOKIE,
  requireSalonContext,
} from "@/lib/tenant";

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  const { organizationId } = await req
    .json()
    .catch(() => ({ organizationId: "" }));
  if (typeof organizationId !== "string" || !organizationId) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 });
  }

  // A member can switch to their org; a platform admin can enter any existing
  // org (impersonation).
  let allowed = await isOrgMember(ctx, organizationId);
  if (!allowed && (await getPlatformSession())) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    allowed = Boolean(org);
  }
  if (!allowed) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 });
  }

  const store = await cookies();
  store.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // Reset active salón so it re-resolves within the newly selected org.
  store.delete(ACTIVE_SALON_COOKIE);
  return NextResponse.json({ ok: true });
}

// Clear active org/salón (e.g. exit impersonation → back to own membership).
export async function DELETE() {
  await requireSalonContext();
  const store = await cookies();
  store.delete(ACTIVE_ORG_COOKIE);
  store.delete(ACTIVE_SALON_COOKIE);
  return NextResponse.json({ ok: true });
}

