import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/services/catalog";
import { requireSalonContext } from "@/lib/tenant";
import { categoryInputSchema } from "@/lib/validations/catalog";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listCategories(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
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
