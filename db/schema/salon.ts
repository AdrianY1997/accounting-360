import { relations } from "drizzle-orm";
import { numeric, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { team } from "./auth";

/**
 * Per-salón accounting configuration. One row per `team` (a team IS a salón;
 * see AGENTS.md multi-tenant model). Currency and tax rate are configurable
 * per salón ("genérico configurable") — no country-specific rules baked in.
 */
export const salonSettings = pgTable(
  "salon_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("USD"),
    // Decimal tax rate, e.g. 0.19 for 19%. Numeric to avoid float drift.
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0"),
    timezone: text("timezone").notNull().default("UTC"),
    address: text("address"),
    phone: text("phone"),
    ...timestamps,
  },
  (t) => [uniqueIndex("salon_settings_team_uidx").on(t.teamId)],
);

export const salonSettingsRelations = relations(salonSettings, ({ one }) => ({
  team: one(team, {
    fields: [salonSettings.teamId],
    references: [team.id],
  }),
}));
