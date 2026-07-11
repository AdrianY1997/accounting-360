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
 * Priceless-catalog share links for reseller clients: `/s/<id>` renders the
 * salón's store with all prices stripped server-side and the reseller's phone
 * as the WhatsApp contact. The id IS the opaque token (regenerating replaces
 * the row, killing the old URL). One link per reseller.
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
    ...timestamps,
  },
  (t) => [uniqueIndex("reseller_link_client_uidx").on(t.clientId)],
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
