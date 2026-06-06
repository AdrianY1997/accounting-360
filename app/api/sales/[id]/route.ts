import { NextResponse } from "next/server";
import { getSale, voidSale } from "@/services/sales";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const found = await getSale(salon, id);
  if (!found) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }
  return NextResponse.json(found);
}

// Soft-void (keeps the financial record).
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "sales:void")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const voided = await voidSale(salon, id);
  if (!voided) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
