import { NextResponse } from "next/server";
import { computeCommissions } from "@/services/commissions";
import { can } from "@/lib/roles";
import { monthRange, parseRange } from "@/lib/period";
import { requireSalonContext } from "@/lib/tenant";

export async function GET(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx.role, "reports:view")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(
    searchParams.get("from"),
    searchParams.get("to"),
  ) ?? monthRange();
  return NextResponse.json({
    from,
    to,
    ...(await computeCommissions(ctx, from, to)),
  });
}
