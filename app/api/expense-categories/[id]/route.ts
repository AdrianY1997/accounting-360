import { NextResponse } from "next/server";
import {
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/services/expenses";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { expenseCategoryInputSchema } from "@/lib/validations/expense";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "expenses:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = expenseCategoryInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const updated = await updateExpenseCategory(salon, id, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: "Categoría no encontrada" },
      { status: 404 },
    );
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const salon = await requireSalonContext();
  if (!can(salon, "expenses:write")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const deleted = await deleteExpenseCategory(salon, id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Categoría no encontrada" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
