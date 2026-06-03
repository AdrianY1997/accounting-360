import { NextResponse } from "next/server";
import { addPayment, listPayments } from "@/services/payments";
import { requireSalonContext } from "@/lib/tenant";
import { paymentInputSchema } from "@/lib/validations/payment";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  return NextResponse.json(await listPayments(salon, id));
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  const { id } = await ctx.params;
  const parsed = paymentInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const created = await addPayment(salon, id, parsed.data);
  if (!created) {
    return NextResponse.json(
      { error: "Venta no encontrada o anulada" },
      { status: 404 },
    );
  }
  return NextResponse.json(created, { status: 201 });
}
