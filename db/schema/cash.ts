import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team, user } from "./auth";

/**
 * Cash sessions (caja). A salón has at most one open session at a time. At
 * close, expected cash = opening balance + cash payments in the session window
 * + cash-in movements − cash-out movements; counted is entered by the user and
 * the difference is stored. Money is `numeric`. Scoped by org + salón.
 */
export const cashSession = pgTable(
  "cash_session",
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
    status: text("status").notNull().default("open"), // open | closed
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    openedBy: text("opened_by")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    closedBy: text("closed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    closedAt: timestamp("closed_at"),
    expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }),
    countedAmount: numeric("counted_amount", { precision: 12, scale: 2 }),
    difference: numeric("difference", { precision: 12, scale: 2 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("cash_session_salon_status_idx").on(t.salonId, t.status)],
);

export const cashMovement = pgTable(
  "cash_movement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => cashSession.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    salonId: text("salon_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // in | out
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [index("cash_movement_session_idx").on(t.sessionId)],
);

export const cashSessionRelations = relations(cashSession, ({ many }) => ({
  movements: many(cashMovement),
}));

export const cashMovementRelations = relations(cashMovement, ({ one }) => ({
  session: one(cashSession, {
    fields: [cashMovement.sessionId],
    references: [cashSession.id],
  }),
}));
