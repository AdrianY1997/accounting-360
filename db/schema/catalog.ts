import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team } from "./auth";

/**
 * Service catalog: categories + services offered by a salón. Scoped by
 * `organizationId` + `salonId`. Money is `numeric` (never float); price is in
 * the salón's currency (see `salon_settings`).
 */
export const serviceCategory = pgTable(
  "service_category",
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
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [index("service_category_salon_idx").on(t.salonId)],
);

export const service = pgTable(
  "service",
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
    categoryId: text("category_id").references(() => serviceCategory.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    // Shown on the public storefront detail page.
    description: text("description"),
    // Price tiers. `price` is the suggested/retail price (default for direct
    // clients); resellerPrice for intermediarios; minPrice is a hard floor;
    // costPrice (proveedor) feeds margin + margin-based commissions.
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    resellerPrice: numeric("reseller_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    minPrice: numeric("min_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    // How the item is measured on a sale line:
    //   quantity → price per unit, line = price × qty
    //   duration → price_mode decides: per_unit (price per hour, line = price ×
    //              hours) or fixed (flat price, duration is informational)
    measureType: text("measure_type").notNull().default("quantity"), // quantity | duration
    priceMode: text("price_mode").notNull().default("per_unit"), // per_unit | fixed
    durationMinutes: integer("duration_minutes").notNull().default(0),
    // Inventory: stock-tracked products hold stock in variants (total = sum).
    tracksStock: boolean("tracks_stock").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("service_salon_idx").on(t.salonId),
    index("service_category_idx").on(t.categoryId),
  ],
);

/** Variants of a stock-tracked item (free-text name, own stock + optional price). */
export const serviceVariant = pgTable(
  "service_variant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Price tiers live on the variant (the item base holds no pricing).
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    resellerPrice: numeric("reseller_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    minPrice: numeric("min_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    stock: integer("stock").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("service_variant_service_idx").on(t.serviceId)],
);

export const serviceVariantRelations = relations(serviceVariant, ({ one }) => ({
  service: one(service, {
    fields: [serviceVariant.serviceId],
    references: [service.id],
  }),
}));

/** Optional images for a catalog item or a specific variant (Vercel Blob). */
export const serviceImage = pgTable(
  "service_image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serviceId: text("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    // Null = main item image; set = belongs to a variant.
    variantId: text("variant_id").references(() => serviceVariant.id, {
      onDelete: "cascade",
    }),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    // Per-photo stock for variant images (null = not tracked per photo; the
    // variant's own `stock` is used instead). When set, the variant's total
    // stock is the sum of its images' stock.
    stock: integer("stock"),
    ...timestamps,
  },
  (t) => [index("service_image_service_idx").on(t.serviceId)],
);

export const serviceImageRelations = relations(serviceImage, ({ one }) => ({
  service: one(service, {
    fields: [serviceImage.serviceId],
    references: [service.id],
  }),
}));

export const serviceCategoryRelations = relations(
  serviceCategory,
  ({ one, many }) => ({
    salon: one(team, {
      fields: [serviceCategory.salonId],
      references: [team.id],
    }),
    services: many(service),
  }),
);

export const serviceRelations = relations(service, ({ one }) => ({
  salon: one(team, { fields: [service.salonId], references: [team.id] }),
  category: one(serviceCategory, {
    fields: [service.categoryId],
    references: [serviceCategory.id],
  }),
}));
