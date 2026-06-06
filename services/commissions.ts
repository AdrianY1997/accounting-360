import { aliasedTable, and, between, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  commissionRule,
  sale,
  saleItem,
  service,
  user,
} from "@/db/schema";
import { centsToString, toCents } from "@/lib/money";
import type { SalonContext } from "@/lib/tenant";
import type { CommissionRuleInput } from "@/lib/validations/commission";

export type CommissionRule = typeof commissionRule.$inferSelect;

function salonRules(ctx: SalonContext) {
  return and(
    eq(commissionRule.organizationId, ctx.organizationId),
    eq(commissionRule.salonId, ctx.salonId),
  );
}

export async function listRules(ctx: SalonContext) {
  return db
    .select({
      id: commissionRule.id,
      staffId: commissionRule.staffId,
      serviceId: commissionRule.serviceId,
      type: commissionRule.type,
      value: commissionRule.value,
      active: commissionRule.active,
      staffName: user.name,
      serviceName: service.name,
    })
    .from(commissionRule)
    .leftJoin(user, eq(user.id, commissionRule.staffId))
    .leftJoin(service, eq(service.id, commissionRule.serviceId))
    .where(salonRules(ctx))
    .orderBy(commissionRule.createdAt);
}

export async function createRule(
  ctx: SalonContext,
  input: CommissionRuleInput,
) {
  const [created] = await db
    .insert(commissionRule)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      staffId: input.staffId || null,
      serviceId: input.serviceId || null,
      type: input.type,
      value: centsToString(toCents(input.value)),
      active: input.active ?? true,
    })
    .returning();
  return created;
}

export async function updateRule(
  ctx: SalonContext,
  id: string,
  input: CommissionRuleInput,
) {
  const [updated] = await db
    .update(commissionRule)
    .set({
      staffId: input.staffId || null,
      serviceId: input.serviceId || null,
      type: input.type,
      value: centsToString(toCents(input.value)),
      active: input.active ?? true,
    })
    .where(and(eq(commissionRule.id, id), salonRules(ctx)))
    .returning();
  return updated ?? null;
}

export async function deleteRule(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(commissionRule)
    .where(and(eq(commissionRule.id, id), salonRules(ctx)))
    .returning({ id: commissionRule.id });
  return deleted ?? null;
}

type Rule = {
  staffId: string | null;
  serviceId: string | null;
  type: string;
  value: string;
};

/** Picks the most specific active rule for an item (staff+service > staff > service > global). */
function bestRule(
  rules: Rule[],
  itemStaffId: string,
  itemServiceId: string | null,
) {
  let best: Rule | null = null;
  let bestScore = -1;
  for (const r of rules) {
    if (r.staffId && r.staffId !== itemStaffId) continue;
    if (r.serviceId && r.serviceId !== itemServiceId) continue;
    const score = (r.staffId ? 2 : 0) + (r.serviceId ? 1 : 0);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}

function commissionCents(rule: Rule, lineTotalCents: number, quantity: number) {
  const value = Number(rule.value);
  if (rule.type === "percent") return Math.round((lineTotalCents * value) / 100);
  // fixed: flat amount per unit.
  return toCents(value) * quantity;
}

export type CommissionRow = {
  staffId: string;
  staffName: string | null;
  items: number;
  base: string;
  commission: string;
};

/**
 * Computes earned commissions per staff for completed (non-void) sales in the
 * window. Derived on demand — nothing is stored.
 */
export async function computeCommissions(
  ctx: SalonContext,
  from: Date,
  to: Date,
): Promise<{ rows: CommissionRow[]; total: string }> {
  const staffUser = aliasedTable(user, "staff_user");
  const [rules, items] = await Promise.all([
    db
      .select({
        staffId: commissionRule.staffId,
        serviceId: commissionRule.serviceId,
        type: commissionRule.type,
        value: commissionRule.value,
      })
      .from(commissionRule)
      .where(and(salonRules(ctx), eq(commissionRule.active, true))),
    db
      .select({
        staffId: saleItem.staffId,
        serviceId: saleItem.serviceId,
        lineTotal: saleItem.lineTotal,
        quantity: saleItem.quantity,
        staffName: staffUser.name,
      })
      .from(saleItem)
      .innerJoin(sale, eq(sale.id, saleItem.saleId))
      .leftJoin(staffUser, eq(staffUser.id, saleItem.staffId))
      .where(
        and(
          eq(sale.salonId, ctx.salonId),
          ne(sale.status, "void"),
          isNotNull(saleItem.staffId),
          between(sale.createdAt, from, to),
        ),
      ),
  ]);

  const acc = new Map<string, CommissionRow & { baseCents: number; commCents: number }>();
  for (const it of items) {
    if (!it.staffId) continue;
    const rule = bestRule(rules, it.staffId, it.serviceId);
    const lineCents = toCents(Number(it.lineTotal));
    const commCents = rule
      ? commissionCents(rule, lineCents, Number(it.quantity))
      : 0;
    const cur =
      acc.get(it.staffId) ??
      {
        staffId: it.staffId,
        staffName: it.staffName,
        items: 0,
        base: "0",
        commission: "0",
        baseCents: 0,
        commCents: 0,
      };
    cur.items += 1;
    cur.baseCents += lineCents;
    cur.commCents += commCents;
    acc.set(it.staffId, cur);
  }

  let totalCents = 0;
  const rows: CommissionRow[] = [];
  for (const r of acc.values()) {
    totalCents += r.commCents;
    rows.push({
      staffId: r.staffId,
      staffName: r.staffName,
      items: r.items,
      base: centsToString(r.baseCents),
      commission: centsToString(r.commCents),
    });
  }
  rows.sort((a, b) => Number(b.commission) - Number(a.commission));
  return { rows, total: centsToString(totalCents) };
}
