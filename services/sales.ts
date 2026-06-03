import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  client,
  payment,
  sale,
  saleItem,
  salonSettings,
  teamMember,
  user,
} from "@/db/schema";
import { centsToString as toMoney, toCents } from "@/lib/money";
import { listPayments, paidCentsBySale, paymentStatus } from "@/services/payments";
import type { SalonContext } from "@/lib/tenant";
import type { SaleInput } from "@/lib/validations/sale";

export type Sale = typeof sale.$inferSelect;
export type SaleItem = typeof saleItem.$inferSelect;

/** Staff (users) assigned to the caller's salón — for item attribution. */
export async function listSalonStaff(ctx: SalonContext) {
  return db
    .select({ id: user.id, name: user.name })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.teamId, ctx.salonId));
}

export async function listSales(ctx: SalonContext) {
  const [rows, paidMap] = await Promise.all([
    db
      .select({
        id: sale.id,
        status: sale.status,
        total: sale.total,
        createdAt: sale.createdAt,
        clientName: client.fullName,
      })
      .from(sale)
      .leftJoin(client, eq(client.id, sale.clientId))
      .where(
        and(
          eq(sale.organizationId, ctx.organizationId),
          eq(sale.salonId, ctx.salonId),
        ),
      )
      .orderBy(desc(sale.createdAt)),
    paidCentsBySale(ctx),
  ]);

  return rows.map((r) => {
    const paidCents = paidMap.get(r.id) ?? 0;
    return {
      ...r,
      paid: toMoney(paidCents),
      paymentStatus:
        r.status === "void"
          ? ("void" as const)
          : paymentStatus(toCents(Number(r.total)), paidCents),
    };
  });
}

export async function getSale(ctx: SalonContext, id: string) {
  const found = await db.query.sale.findFirst({
    where: and(
      eq(sale.id, id),
      eq(sale.organizationId, ctx.organizationId),
      eq(sale.salonId, ctx.salonId),
    ),
  });
  if (!found) return null;
  const items = await db
    .select({
      id: saleItem.id,
      description: saleItem.description,
      unitPrice: saleItem.unitPrice,
      quantity: saleItem.quantity,
      lineTotal: saleItem.lineTotal,
      staffName: user.name,
    })
    .from(saleItem)
    .leftJoin(user, eq(user.id, saleItem.staffId))
    .where(eq(saleItem.saleId, id));

  const payments = await listPayments(ctx, id);
  const paidCents = payments.reduce((acc, p) => acc + toCents(Number(p.amount)), 0);
  const totalCents = toCents(Number(found.total));
  return {
    sale: found,
    items,
    payments,
    paid: toMoney(paidCents),
    balance: toMoney(totalCents - paidCents),
    paymentStatus:
      found.status === "void"
        ? ("void" as const)
        : paymentStatus(totalCents, paidCents),
  };
}

/**
 * Creates a sale + its items atomically via `db.batch` (neon-http has no
 * multi-statement transactions). Tax rate is snapshotted from `salon_settings`;
 * totals are computed in integer cents to avoid float drift, then stored.
 */
export async function createSale(ctx: SalonContext, input: SaleInput) {
  const settings = await db.query.salonSettings.findFirst({
    where: eq(salonSettings.teamId, ctx.salonId),
  });
  const taxRate = Number(settings?.taxRate ?? 0);

  let subtotalCents = 0;
  const saleId = crypto.randomUUID();
  const itemRows = input.items.map((it) => {
    const lineCents = toCents(it.unitPrice) * it.quantity;
    subtotalCents += lineCents;
    return {
      saleId,
      serviceId: it.serviceId || null,
      staffId: it.staffId || null,
      description: it.description.trim(),
      unitPrice: toMoney(toCents(it.unitPrice)),
      quantity: it.quantity,
      lineTotal: toMoney(lineCents),
    };
  });

  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;

  // Optional payment captured at sale time (POS flow).
  const paymentOps =
    input.payment && input.payment.amount > 0
      ? [
          db.insert(payment).values({
            organizationId: ctx.organizationId,
            salonId: ctx.salonId,
            saleId,
            method: input.payment.method,
            amount: toMoney(toCents(input.payment.amount)),
          }),
        ]
      : [];

  await db.batch([
    db.insert(sale).values({
      id: saleId,
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      clientId: input.clientId || null,
      status: "completed",
      subtotal: toMoney(subtotalCents),
      taxRate: taxRate.toFixed(4),
      taxAmount: toMoney(taxCents),
      total: toMoney(totalCents),
      notes: (input.notes ?? "").trim() || null,
    }),
    db.insert(saleItem).values(itemRows),
    ...paymentOps,
  ]);

  return { id: saleId };
}

/** Soft-void a sale (keeps the financial record). */
export async function voidSale(ctx: SalonContext, id: string) {
  const [updated] = await db
    .update(sale)
    .set({ status: "void" })
    .where(
      and(
        eq(sale.id, id),
        eq(sale.organizationId, ctx.organizationId),
        eq(sale.salonId, ctx.salonId),
      ),
    )
    .returning({ id: sale.id });
  return updated ?? null;
}
