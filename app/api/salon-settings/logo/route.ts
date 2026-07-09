import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { setLogoUrl } from "@/services/settings";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

const MAX_BYTES = 4 * 1024 * 1024;

function isOwnBlob(url: string | null): url is string {
  return Boolean(url && url.includes(".blob.vercel-storage.com/"));
}

/** Uploads a logo image to Vercel Blob and persists it as the salón logo. */
export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "settings:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Almacenamiento de imágenes no configurado (BLOB_READ_WRITE_TOKEN)" },
      { status: 500 },
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "El logo debe ser una imagen" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagen demasiado grande (máx. 4 MB)" },
      { status: 400 },
    );
  }

  const blob = await put(`logos/${ctx.salonId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
    token,
  });
  const { settings, previousUrl } = await setLogoUrl(ctx, blob.url);
  // Best-effort cleanup of a replaced uploaded logo (external URLs are kept).
  if (isOwnBlob(previousUrl) && previousUrl !== blob.url) {
    await del(previousUrl, { token }).catch(() => {});
  }
  return NextResponse.json(settings, { status: 201 });
}

/** Clears the salón logo (and deletes the blob if it was an upload). */
export async function DELETE() {
  const ctx = await requireSalonContext();
  if (!can(ctx, "settings:manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { settings, previousUrl } = await setLogoUrl(ctx, null);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && isOwnBlob(previousUrl)) {
    await del(previousUrl, { token }).catch(() => {});
  }
  return NextResponse.json(settings);
}
