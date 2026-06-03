import { NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/services/expenses";
import { requireSalonContext } from "@/lib/tenant";
import { expenseInputSchema } from "@/lib/validations/expense";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listExpenses(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  const parsed = expenseInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createExpense(ctx, parsed.data), {
    status: 201,
  });
}
