import { NextResponse } from "next/server";
import { addMovement } from "@/services/cash";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { movementSchema } from "@/lib/validations/cash";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon.role, "cash:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = movementSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await addMovement(salon, id, parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Caja no encontrada o cerrada" },
      { status: 404 },
    );
  }
  return NextResponse.json(created, { status: 201 });
}
