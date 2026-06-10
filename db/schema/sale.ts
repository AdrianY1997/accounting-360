import { relations } from "drizzle-orm";
import { index, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { user } from "./auth";
import { organization, team } from "./auth";
import { client } from "./client";
import { service, serviceImage, serviceVariant } from "./catalog";

/**
 * Sales (tickets). A sale has line items (services or free-form), a tax
 * snapshot taken from `salon_settings` at creation, and computed totals. Money
 * is `numeric` (never float). Scoped by `organizationId` + `salonId`.
 *
 * Totals are stored (not derived on read) so historical records stay correct
 * even if a service price or the salón tax rate later changes.
 */
export const sale = pgTable(
  "sale",
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
    clientId: text("client_id").references(() => client.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("completed"), // completed | void
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("sale_salon_idx").on(t.salonId),
    index("sale_client_idx").on(t.clientId),
  ],
);

export const saleItem = pgTable(
  "sale_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    saleId: text("sale_id")
      .notNull()
      .references(() => sale.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => service.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => serviceVariant.id, {
      onDelete: "set null",
    }),
    // Specific photo sold, when the variant tracks stock per photo.
    imageId: text("image_id").references(() => serviceImage.id, {
      onDelete: "set null",
    }),
    // Staff who performed this line — basis for future commissions.
    staffId: text("staff_id").references(() => user.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    // Snapshot of how this line is measured (item may change later).
    measureType: text("measure_type").notNull().default("quantity"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    // Cost (proveedor) snapshot for margin + margin-based commissions.
    costPrice: numeric("cost_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    // Multiplier: units (quantity) or hours (duration per_unit) or 1 (fixed).
    quantity: numeric("quantity", { precision: 12, scale: 2 })
      .notNull()
      .default("1"),
    // Duration in minutes (duration items) — kept for display.
    durationMinutes: integer("duration_minutes"),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
  },
  (t) => [
    index("sale_item_sale_idx").on(t.saleId),
    index("sale_item_staff_idx").on(t.staffId),
  ],
);

export const saleRelations = relations(sale, ({ one, many }) => ({
  salon: one(team, { fields: [sale.salonId], references: [team.id] }),
  client: one(client, { fields: [sale.clientId], references: [client.id] }),
  items: many(saleItem),
}));

export const saleItemRelations = relations(saleItem, ({ one }) => ({
  sale: one(sale, { fields: [saleItem.saleId], references: [sale.id] }),
  service: one(service, {
    fields: [saleItem.serviceId],
    references: [service.id],
  }),
  staff: one(user, { fields: [saleItem.staffId], references: [user.id] }),
}));
