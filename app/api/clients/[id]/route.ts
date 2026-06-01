import { NextResponse } from "next/server";
import { deleteClient, updateClient } from "@/services/clients";
import { requireSalonContext } from "@/lib/tenant";
import { clientInputSchema } from "@/lib/validations/client";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const parsed = clientInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateClient(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const deleted = await deleteClient(salon, id);
  if (!deleted) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
