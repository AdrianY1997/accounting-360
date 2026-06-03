import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payment, sale } from "@/db/schema";
import { centsToString, toCents } from "@/lib/money";
import type { SalonContext } from "@/lib/tenant";
import type { PaymentInput } from "@/lib/validations/payment";

export type Payment = typeof payment.$inferSelect;
export type PaymentStatus = "pending" | "partial" | "paid";

export function paymentStatus(totalCents: number, paidCents: number): PaymentStatus {
  if (paidCents <= 0) return totalCents <= 0 ? "paid" : "pending";
  if (paidCents >= totalCents) return "paid";
  return "partial";
}

/** Sum of payments (in cents) per sale, for the caller's salón. */
export async function paidCentsBySale(ctx: SalonContext) {
  const rows = await db
    .select({
      saleId: payment.saleId,
      paid: sql<string>`coalesce(sum(${payment.amount}), 0)`,
    })
    .from(payment)
    .where(eq(payment.salonId, ctx.salonId))
    .groupBy(payment.saleId);
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.saleId, toCents(Number(r.paid)));
  return map;
}

export async function listPayments(ctx: SalonContext, saleId: string) {
  return db
    .select()
    .from(payment)
    .where(and(eq(payment.salonId, ctx.salonId), eq(payment.saleId, saleId)))
    .orderBy(asc(payment.paidAt));
}

/** Adds a payment to a sale. Rejects unknown / voided sales. */
export async function addPayment(
  ctx: SalonContext,
  saleId: string,
  input: PaymentInput,
) {
  const target = await db.query.sale.findFirst({
    where: and(
      eq(sale.id, saleId),
      eq(sale.organizationId, ctx.organizationId),
      eq(sale.salonId, ctx.salonId),
    ),
  });
  if (!target || target.status === "void") return null;

  const [created] = await db
    .insert(payment)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      saleId,
      method: input.method,
      amount: centsToString(toCents(input.amount)),
    })
    .returning();
  return created;
}

export async function deletePayment(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(payment)
    .where(and(eq(payment.id, id), eq(payment.salonId, ctx.salonId)))
    .returning({ id: payment.id });
  return deleted ?? null;
}
