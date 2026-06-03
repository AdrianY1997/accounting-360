import { NextResponse } from "next/server";
import { deleteMovement } from "@/services/cash";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon.role, "cash:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const deleted = await deleteMovement(salon, id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Movimiento no encontrado o caja cerrada" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
