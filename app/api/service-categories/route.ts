import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { categoryInputSchema } from "@/lib/validations/catalog";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listCategories(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = categoryInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createCategory(ctx, parsed.data), {
    status: 201,
  });
}
