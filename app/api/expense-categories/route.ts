import { NextResponse } from "next/server";
import {
  createExpenseCategory,
  listExpenseCategories,
} from "@/services/expenses";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { expenseCategoryInputSchema } from "@/lib/validations/expense";

export async function GET() {
  const ctx = await requireSalonContext();
  return NextResponse.json(await listExpenseCategories(ctx));
}

export async function POST(req: Request) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "expenses:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const parsed = expenseCategoryInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  return NextResponse.json(await createExpenseCategory(ctx, parsed.data), {
    status: 201,
  });
}
