import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { categoryInputSchema } from "@/lib/validations/catalog";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = categoryInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateCategory(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const deleted = await deleteCategory(salon, id);
  if (!deleted) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
