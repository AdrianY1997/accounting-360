import { NextResponse } from "next/server";
import { deleteService, updateService } from "@/services/catalog";
import { requireSalonContext } from "@/lib/tenant";
import { serviceInputSchema } from "@/lib/validations/catalog";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const parsed = serviceInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateService(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const deleted = await deleteService(salon, id);
  if (!deleted) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
