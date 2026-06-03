import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isOrgMember } from "@/services/organizations";
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
  if (
    typeof organizationId !== "string" ||
    !(await isOrgMember(ctx, organizationId))
  ) {
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
