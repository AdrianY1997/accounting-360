import { NextResponse } from "next/server";
import { createRule, listRules } from "@/services/commissions";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { commissionRuleInputSchema } from "@/lib/validations/commission";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listRules(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "commissions:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = commissionRuleInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createRule(ctx, parsed.data), { status: 201 });
}
