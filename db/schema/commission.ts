import { relations } from "drizzle-orm";
import { boolean, index, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team, user } from "./auth";
import { service } from "./catalog";

/**
 * Commission rules. A rule may target a specific staff and/or service; nulls
 * are wildcards. When computing a sale item's commission, the most specific
 * matching rule wins (staff+service > staff > service > global). Earned
 * commissions are derived on demand (not stored). Scoped by org + salón.
 */
export const commissionRule = pgTable(
  "commission_rule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    salonId: text("salon_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    staffId: text("staff_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    serviceId: text("service_id").references(() => service.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(), // percent | fixed
    // What the commission is computed on: line total or margin (line − cost).
    base: text("base").notNull().default("line"), // line | margin
    // percent: e.g. 10.00 = 10%. fixed: flat amount per line item (salón currency).
    value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("commission_rule_salon_idx").on(t.salonId)],
);

export const commissionRuleRelations = relations(commissionRule, ({ one }) => ({
  staff: one(user, {
    fields: [commissionRule.staffId],
    references: [user.id],
  }),
  service: one(service, {
    fields: [commissionRule.serviceId],
    references: [service.id],
  }),
}));
