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
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("service_salon_idx").on(t.salonId),
    index("service_category_idx").on(t.categoryId),
  ],
);

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
