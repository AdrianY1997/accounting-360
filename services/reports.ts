import { and, between, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { expense, payment, sale, saleItem, service, user } from "@/db/schema";
import { computeCommissions } from "@/services/commissions";
import type { SalonContext } from "@/lib/tenant";

const num = (v: unknown) => Number(v ?? 0);

/**
 * Aggregated reports for a salón over a date window. Read-only; everything is
 * derived from existing records (sales by createdAt, expenses by expenseDate,
 * payments by paidAt). Non-void sales only.
 */
export async function salonReport(ctx: SalonContext, from: Date, to: Date) {
  const notVoid = and(
    eq(sale.salonId, ctx.salonId),
    ne(sale.status, "void"),
    between(sale.createdAt, from, to),
  );

  const [
    [salesAgg],
    [costAgg],
    [expensesAgg],
    byService,
    byStaff,
    byMethod,
    commissions,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
        gross: sql<string>`coalesce(sum(${sale.total}), 0)`,
        subtotal: sql<string>`coalesce(sum(${sale.subtotal}), 0)`,
        tax: sql<string>`coalesce(sum(${sale.taxAmount}), 0)`,
      })
      .from(sale)
      .where(notVoid),
    db
      .select({
        cost: sql<string>`coalesce(sum(${saleItem.costPrice} * ${saleItem.quantity}), 0)`,
      })
      .from(saleItem)
      .innerJoin(sale, eq(sale.id, saleItem.saleId))
      .where(notVoid),
    db
      .select({
        count: sql<number>`count(*)`,
        total: sql<string>`coalesce(sum(${expense.amount}), 0)`,
      })
      .from(expense)
      .where(
        and(
          eq(expense.salonId, ctx.salonId),
          between(expense.expenseDate, from, to),
        ),
      ),
    db
      .select({
        name: sql<string>`coalesce(${service.name}, 'Libre')`,
        count: sql<number>`count(*)`,
        total: sql<string>`coalesce(sum(${saleItem.lineTotal}), 0)`,
      })
      .from(saleItem)
      .innerJoin(sale, eq(sale.id, saleItem.saleId))
      .leftJoin(service, eq(service.id, saleItem.serviceId))
      .where(notVoid)
      .groupBy(service.name)
      .orderBy(sql`sum(${saleItem.lineTotal}) desc`),
    db
      .select({
        name: user.name,
        count: sql<number>`count(*)`,
        total: sql<string>`coalesce(sum(${saleItem.lineTotal}), 0)`,
      })
      .from(saleItem)
      .innerJoin(sale, eq(sale.id, saleItem.saleId))
      .leftJoin(user, eq(user.id, saleItem.staffId))
      .where(and(notVoid, isNotNull(saleItem.staffId)))
      .groupBy(user.name)
      .orderBy(sql`sum(${saleItem.lineTotal}) desc`),
    db
      .select({
        method: payment.method,
        count: sql<number>`count(*)`,
        total: sql<string>`coalesce(sum(${payment.amount}), 0)`,
      })
      .from(payment)
      .innerJoin(sale, eq(sale.id, payment.saleId))
      .where(
        and(
          eq(payment.salonId, ctx.salonId),
          ne(sale.status, "void"),
          between(payment.paidAt, from, to),
        ),
      )
      .groupBy(payment.method),
    computeCommissions(ctx, from, to),
  ]);

  const income = num(salesAgg?.gross);
  const expenses = num(expensesAgg?.total);
  const commissionsTotal = num(commissions.total);
  const cost = num(costAgg?.cost);
  const subtotal = num(salesAgg?.subtotal);

  return {
    totals: {
      salesCount: num(salesAgg?.count),
      income,
      subtotal,
      tax: num(salesAgg?.tax),
      cost,
      margin: subtotal - cost,
      expenses,
      commissions: commissionsTotal,
      profit: income - expenses - commissionsTotal,
      collected: byMethod.reduce((acc, m) => acc + num(m.total), 0),
    },
    byService: byService.map((r) => ({
      name: r.name,
      count: num(r.count),
      total: num(r.total),
    })),
    byStaff: byStaff.map((r) => ({
      name: r.name ?? "—",
      count: num(r.count),
      total: num(r.total),
    })),
    byMethod: byMethod.map((r) => ({
      method: r.method,
      count: num(r.count),
      total: num(r.total),
    })),
  };
}
