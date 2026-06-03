import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team } from "./auth";
import { sale } from "./sale";

/**
 * Payments against a sale. A sale may have many payments (split / partial /
 * abonos); payment status is derived from the sum vs the sale total. Money is
 * `numeric`. Scoped by `organizationId` + `salonId`.
 */
export const payment = pgTable(
  "payment",
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
    saleId: text("sale_id")
      .notNull()
      .references(() => sale.id, { onDelete: "cascade" }),
    method: text("method").notNull(), // cash | card | transfer | other
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at").notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    index("payment_sale_idx").on(t.saleId),
    index("payment_salon_idx").on(t.salonId),
  ],
);

export const paymentRelations = relations(payment, ({ one }) => ({
  sale: one(sale, { fields: [payment.saleId], references: [sale.id] }),
}));
