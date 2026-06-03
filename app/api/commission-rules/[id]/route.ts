import { NextResponse } from "next/server";
import { deleteRule, updateRule } from "@/services/commissions";
import { requireSalonContext } from "@/lib/tenant";
import { commissionRuleInputSchema } from "@/lib/validations/commission";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const parsed = commissionRuleInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateRule(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const deleted = await deleteRule(salon, id);
  if (!deleted) {
    return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
