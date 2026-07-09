import { NextResponse } from "next/server";
import { CategoryError, createCategory, listCategories } from "@/services/catalog";
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
  try {
    return NextResponse.json(await createCategory(ctx, parsed.data), {
      status: 201,
    });
  } catch (e) {
    if (e instanceof CategoryError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
