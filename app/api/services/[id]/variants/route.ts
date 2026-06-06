import { NextResponse } from "next/server";
import { createVariant, listVariants } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { variantInputSchema } from "@/lib/validations/catalog";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  return NextResponse.json(await listVariants(salon, id));
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = variantInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await createVariant(salon, id, parsed.data);
  if (!created) {
    return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
  }
  return NextResponse.json(created, { status: 201 });
}
