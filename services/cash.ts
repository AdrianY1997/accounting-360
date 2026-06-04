import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { cashMovement, cashSession, expense, payment, sale } from "@/db/schema";
import { centsToString, toCents } from "@/lib/money";
import type { SalonContext } from "@/lib/tenant";
import type {
  CloseSessionInput,
  MovementInput,
  OpenSessionInput,
} from "@/lib/validations/cash";

export type CashSession = typeof cashSession.$inferSelect;
export type CashMovement = typeof cashMovement.$inferSelect;

export async function getOpenSession(ctx: SalonContext) {
  return db.query.cashSession.findFirst({
    where: and(
      eq(cashSession.salonId, ctx.salonId),
      eq(cashSession.status, "open"),
    ),
  });
}

/** Sum of cash payments (cents) in a time window, excluding voided sales. */
async function cashPaymentsCents(ctx: SalonContext, from: Date, to: Date) {
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(${payment.amount}), 0)` })
    .from(payment)
    .innerJoin(sale, eq(sale.id, payment.saleId))
    .where(
      and(
        eq(payment.salonId, ctx.salonId),
        eq(payment.method, "cash"),
        ne(sale.status, "void"),
        gte(payment.paidAt, from),
        lte(payment.paidAt, to),
      ),
    );
  return toCents(Number(row?.sum ?? 0));
}

/**
 * Sum of cash-paid expenses (cents) recorded during the session window. Uses
 * `createdAt` (when cash actually left the drawer), not `expenseDate` — the
 * latter is a day-granular accounting date (midnight) that would fall outside an
 * intraday session window.
 */
async function cashExpensesCents(ctx: SalonContext, from: Date, to: Date) {
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(${expense.amount}), 0)` })
    .from(expense)
    .where(
      and(
        eq(expense.salonId, ctx.salonId),
        eq(expense.paymentMethod, "cash"),
        gte(expense.createdAt, from),
        lte(expense.createdAt, to),
      ),
    );
  return toCents(Number(row?.sum ?? 0));
}

async function movementTotalsCents(sessionId: string) {
  const rows = await db
    .select({
      type: cashMovement.type,
      sum: sql<string>`coalesce(sum(${cashMovement.amount}), 0)`,
    })
    .from(cashMovement)
    .where(eq(cashMovement.sessionId, sessionId))
    .groupBy(cashMovement.type);
  let inCents = 0;
  let outCents = 0;
  for (const r of rows) {
    if (r.type === "in") inCents = toCents(Number(r.sum));
    else if (r.type === "out") outCents = toCents(Number(r.sum));
  }
  return { inCents, outCents };
}

/** Live breakdown + expected cash for a session (uses now() if still open). */
export async function sessionSummary(ctx: SalonContext, session: CashSession) {
  const to = session.closedAt ?? new Date();
  const [cashCents, { inCents, outCents }, expensesCents] = await Promise.all([
    cashPaymentsCents(ctx, session.openedAt, to),
    movementTotalsCents(session.id),
    cashExpensesCents(ctx, session.openedAt, to),
  ]);
  const openingCents = toCents(Number(session.openingBalance));
  const expectedCents =
    openingCents + cashCents + inCents - outCents - expensesCents;
  return {
    opening: centsToString(openingCents),
    cashPayments: centsToString(cashCents),
    movementsIn: centsToString(inCents),
    movementsOut: centsToString(outCents),
    cashExpenses: centsToString(expensesCents),
    expected: centsToString(expectedCents),
    expectedCents,
  };
}

export async function listMovements(ctx: SalonContext, sessionId: string) {
  return db
    .select()
    .from(cashMovement)
    .where(
      and(
        eq(cashMovement.sessionId, sessionId),
        eq(cashMovement.salonId, ctx.salonId),
      ),
    )
    .orderBy(desc(cashMovement.createdAt));
}

export async function listSessions(ctx: SalonContext) {
  return db
    .select()
    .from(cashSession)
    .where(
      and(
        eq(cashSession.organizationId, ctx.organizationId),
        eq(cashSession.salonId, ctx.salonId),
      ),
    )
    .orderBy(desc(cashSession.openedAt));
}

export async function getSession(ctx: SalonContext, id: string) {
  const session = await db.query.cashSession.findFirst({
    where: and(
      eq(cashSession.id, id),
      eq(cashSession.organizationId, ctx.organizationId),
      eq(cashSession.salonId, ctx.salonId),
    ),
  });
  if (!session) return null;
  const [movements, summary] = await Promise.all([
    listMovements(ctx, id),
    sessionSummary(ctx, session),
  ]);
  return { session, movements, summary };
}

/** Opens a session. Returns null if one is already open for the salón. */
export async function openSession(ctx: SalonContext, input: OpenSessionInput) {
  const existing = await getOpenSession(ctx);
  if (existing) return null;
  const [created] = await db
    .insert(cashSession)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      openingBalance: centsToString(toCents(input.openingBalance)),
      openedBy: ctx.userId,
      status: "open",
    })
    .returning();
  return created;
}

export async function addMovement(
  ctx: SalonContext,
  sessionId: string,
  input: MovementInput,
) {
  const session = await db.query.cashSession.findFirst({
    where: and(
      eq(cashSession.id, sessionId),
      eq(cashSession.salonId, ctx.salonId),
    ),
  });
  if (!session || session.status !== "open") return null;
  const [created] = await db
    .insert(cashMovement)
    .values({
      sessionId,
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      type: input.type,
      amount: centsToString(toCents(input.amount)),
      description: input.description.trim(),
      createdBy: ctx.userId,
    })
    .returning();
  return created;
}

export async function deleteMovement(ctx: SalonContext, id: string) {
  // Only allow removing movements from an open session.
  const mv = await db.query.cashMovement.findFirst({
    where: and(eq(cashMovement.id, id), eq(cashMovement.salonId, ctx.salonId)),
  });
  if (!mv) return null;
  const session = await db.query.cashSession.findFirst({
    where: eq(cashSession.id, mv.sessionId),
  });
  if (!session || session.status !== "open") return null;
  const [deleted] = await db
    .delete(cashMovement)
    .where(eq(cashMovement.id, id))
    .returning({ id: cashMovement.id });
  return deleted ?? null;
}

/** Closes the session: snapshots expected, stores counted + difference. */
export async function closeSession(
  ctx: SalonContext,
  id: string,
  input: CloseSessionInput,
) {
  const session = await db.query.cashSession.findFirst({
    where: and(
      eq(cashSession.id, id),
      eq(cashSession.salonId, ctx.salonId),
    ),
  });
  if (!session || session.status !== "open") return null;

  const summary = await sessionSummary(ctx, session);
  const countedCents = toCents(input.countedAmount);
  const differenceCents = countedCents - summary.expectedCents;

  const [updated] = await db
    .update(cashSession)
    .set({
      status: "closed",
      closedBy: ctx.userId,
      closedAt: new Date(),
      expectedAmount: centsToString(summary.expectedCents),
      countedAmount: centsToString(countedCents),
      difference: centsToString(differenceCents),
      notes: (input.notes ?? "").trim() || null,
    })
    .where(eq(cashSession.id, id))
    .returning();
  return updated ?? null;
}
