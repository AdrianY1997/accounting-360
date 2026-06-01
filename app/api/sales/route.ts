import { NextResponse } from "next/server";
import { createSale, listSales } from "@/services/sales";
import { requireSalonContext } from "@/lib/tenant";
import { saleInputSchema } from "@/lib/validations/sale";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listSales(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  const parsed = saleInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createSale(ctx, parsed.data), { status: 201 });
}
