import { and, between, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  client,
  payment,
  sale,
  saleItem,
  salonSettings,
  service,
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

export async function listSales(
  ctx: SalonContext,
  opts?: { from?: Date; to?: Date; status?: string },
) {
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
          opts?.from && opts?.to
            ? between(sale.createdAt, opts.from, opts.to)
            : undefined,
        ),
      )
      .orderBy(desc(sale.createdAt)),
    paidCentsBySale(ctx),
  ]);

  const mapped = rows.map((r) => {
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

  // Payment status is derived, so filter it after computing.
  return opts?.status
    ? mapped.filter((s) => s.paymentStatus === opts.status)
    : mapped;
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
      measureType: saleItem.measureType,
      unitPrice: saleItem.unitPrice,
      quantity: saleItem.quantity,
      durationMinutes: saleItem.durationMinutes,
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

  // Load referenced items to authoritatively know their measure/price mode.
  const serviceIds = input.items
    .map((it) => it.serviceId)
    .filter((v): v is string => Boolean(v));
  const svcRows = serviceIds.length
    ? await db
        .select({
          id: service.id,
          measureType: service.measureType,
          priceMode: service.priceMode,
        })
        .from(service)
        .where(
          and(eq(service.salonId, ctx.salonId), inArray(service.id, serviceIds)),
        )
    : [];
  const svcMap = new Map(svcRows.map((s) => [s.id, s]));

  let subtotalCents = 0;
  const saleId = crypto.randomUUID();
  const itemRows = input.items.map((it) => {
    const svc = it.serviceId ? svcMap.get(it.serviceId) : undefined;
    const measureType = svc?.measureType ?? "quantity";
    const priceMode = svc?.priceMode ?? "per_unit";
    const unitCents = toCents(it.unitPrice);

    let qty: number; // stored multiplier
    let durationMinutes: number | null = null;
    let lineCents: number;

    if (measureType === "duration") {
      durationMinutes = Math.round(it.durationMinutes);
      if (priceMode === "fixed") {
        qty = 1;
        lineCents = unitCents;
      } else {
        const hours = durationMinutes / 60;
        qty = hours;
        lineCents = Math.round(unitCents * hours);
      }
    } else {
      qty = it.quantity;
      lineCents = Math.round(unitCents * qty);
    }

    subtotalCents += lineCents;
    return {
      saleId,
      serviceId: it.serviceId || null,
      staffId: it.staffId || null,
      description: it.description.trim(),
      measureType,
      unitPrice: toMoney(unitCents),
      quantity: qty.toFixed(2),
      durationMinutes,
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
