import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { addImage, listImages } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  return NextResponse.json(await listImages(salon, id));
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Almacenamiento de imágenes no configurado (BLOB_READ_WRITE_TOKEN)" },
      { status: 500 },
    );
  }
  const { id } = await ctx.params;
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const variantId = (form.get("variantId") as string) || null;
  if (files.length === 0) {
    return NextResponse.json({ error: "Sin archivos" }, { status: 400 });
  }

  const created = [];
  for (const file of files) {
    const blob = await put(`items/${id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      token,
    });
    const row = await addImage(salon, id, blob.url, blob.pathname, variantId);
    if (!row) {
      return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
    }
    created.push(row);
  }
  return NextResponse.json(created, { status: 201 });
}
