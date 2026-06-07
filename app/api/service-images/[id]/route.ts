import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { deleteImage } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

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
