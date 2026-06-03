import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expense, expenseCategory } from "@/db/schema";
import { centsToString, toCents } from "@/lib/money";
import type { SalonContext } from "@/lib/tenant";
import type {
  ExpenseCategoryInput,
  ExpenseInput,
} from "@/lib/validations/expense";

export type ExpenseCategory = typeof expenseCategory.$inferSelect;
export type Expense = typeof expense.$inferSelect;

// --- Categories ---

export async function listExpenseCategories(ctx: SalonContext) {
  return db
    .select()
    .from(expenseCategory)
    .where(
      and(
        eq(expenseCategory.organizationId, ctx.organizationId),
        eq(expenseCategory.salonId, ctx.salonId),
      ),
    )
    .orderBy(expenseCategory.name);
}

export async function createExpenseCategory(
  ctx: SalonContext,
  input: ExpenseCategoryInput,
) {
  const [created] = await db
    .insert(expenseCategory)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      name: input.name.trim(),
    })
    .returning();
  return created;
}

export async function updateExpenseCategory(
  ctx: SalonContext,
  id: string,
  input: ExpenseCategoryInput,
) {
  const [updated] = await db
    .update(expenseCategory)
    .set({ name: input.name.trim() })
    .where(
      and(
        eq(expenseCategory.id, id),
        eq(expenseCategory.organizationId, ctx.organizationId),
        eq(expenseCategory.salonId, ctx.salonId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteExpenseCategory(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(expenseCategory)
    .where(
      and(
        eq(expenseCategory.id, id),
        eq(expenseCategory.organizationId, ctx.organizationId),
        eq(expenseCategory.salonId, ctx.salonId),
      ),
    )
    .returning({ id: expenseCategory.id });
  return deleted ?? null;
}

// --- Expenses ---

function normalize(input: ExpenseInput) {
  return {
    categoryId: input.categoryId || null,
    vendor: input.vendor?.trim() || null,
    description: input.description?.trim() || null,
    amount: centsToString(toCents(input.amount)),
    paymentMethod: input.paymentMethod || null,
    expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
  };
}

export async function listExpenses(ctx: SalonContext) {
  return db
    .select({
      id: expense.id,
      categoryId: expense.categoryId,
      vendor: expense.vendor,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate,
      categoryName: expenseCategory.name,
    })
    .from(expense)
    .leftJoin(expenseCategory, eq(expenseCategory.id, expense.categoryId))
    .where(
      and(
        eq(expense.organizationId, ctx.organizationId),
        eq(expense.salonId, ctx.salonId),
      ),
    )
    .orderBy(desc(expense.expenseDate));
}

export async function createExpense(ctx: SalonContext, input: ExpenseInput) {
  const [created] = await db
    .insert(expense)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      createdBy: ctx.userId,
      ...normalize(input),
    })
    .returning();
  return created;
}

export async function updateExpense(
  ctx: SalonContext,
  id: string,
  input: ExpenseInput,
) {
  const [updated] = await db
    .update(expense)
    .set(normalize(input))
    .where(
      and(
        eq(expense.id, id),
        eq(expense.organizationId, ctx.organizationId),
        eq(expense.salonId, ctx.salonId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteExpense(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(expense)
    .where(
      and(
        eq(expense.id, id),
        eq(expense.organizationId, ctx.organizationId),
        eq(expense.salonId, ctx.salonId),
      ),
    )
    .returning({ id: expense.id });
  return deleted ?? null;
}
