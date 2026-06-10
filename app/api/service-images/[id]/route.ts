import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { deleteImage, updateImageStock } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { imageStockInputSchema } from "@/lib/validations/catalog";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = imageStockInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateImageStock(salon, id, parsed.data.stock);
  if (!updated) {
    return NextResponse.json(
      { error: "Imagen no encontrada o no pertenece a una variante" },
      { status: 404 },
    );
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
  const removed = await deleteImage(salon, id);
  if (!removed) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
  await del(removed.pathname, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
