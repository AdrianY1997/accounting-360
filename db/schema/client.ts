import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team } from "./auth";

/**
 * Salon clients (customers). Scoped to a salón (`team`) within an organization.
 * Every query must filter by `organizationId` + `salonId` (see tenant context).
 */
export const client = pgTable(
  "client",
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
    fullName: text("full_name").notNull(),
    // direct = consumidor final (puede ser anónimo); reseller = intermediario
    // (siempre registrado, recibe precio de intermediario).
    type: text("type").notNull().default("direct"),
    phone: text("phone"),
    email: text("email"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("client_salon_idx").on(t.salonId),
    index("client_org_idx").on(t.organizationId),
  ],
);

/**
 * Catalog share links for reseller clients: `/s/<id>` renders the salón's
 * store with the reseller's phone as the WhatsApp contact. The id IS the
 * opaque token (regenerating replaces the row, killing the old URL). Up to
 * two links per reseller — one per `showPrices` mode — so a reseller who
 * should see cost prices and one who shouldn't can each get their own URL
 * without the other's rotating.
 */
export const resellerLink = pgTable(
  "reseller_link",
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
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    /** false = prices stripped server-side (the original/default behavior). */
    showPrices: boolean("show_prices").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reseller_link_client_prices_uidx").on(t.clientId, t.showPrices),
  ],
);

export const clientRelations = relations(client, ({ one }) => ({
  organization: one(organization, {
    fields: [client.organizationId],
    references: [organization.id],
  }),
  salon: one(team, {
    fields: [client.salonId],
    references: [team.id],
  }),
}));
