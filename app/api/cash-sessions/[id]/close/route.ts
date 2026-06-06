import { NextResponse } from "next/server";
import { closeSession } from "@/services/cash";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { closeSessionSchema } from "@/lib/validations/cash";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "cash:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = closeSessionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const closed = await closeSession(salon, id, parsed.data);
  if (!closed) {
    return NextResponse.json(
      { error: "Caja no encontrada o ya cerrada" },
      { status: 404 },
    );
  }
  return NextResponse.json(closed);
}
