import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAssigned } from "@/services/salons";
import { ACTIVE_SALON_COOKIE, requireSalonContext } from "@/lib/tenant";

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  const { salonId } = await req.json().catch(() => ({ salonId: "" }));
  if (typeof salonId !== "string" || !(await isAssigned(ctx, salonId))) {
    return NextResponse.json({ error: "Salón inválido" }, { status: 400 });
  }
  (await cookies()).set(ACTIVE_SALON_COOKIE, salonId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true });
}
