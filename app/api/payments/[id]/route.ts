import { NextResponse } from "next/server";
import { deletePayment } from "@/services/payments";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "payments:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const deleted = await deletePayment(salon, id);
  if (!deleted) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
