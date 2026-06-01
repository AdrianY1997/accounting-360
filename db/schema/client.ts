import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text } from "drizzle-orm/pg-core";
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
