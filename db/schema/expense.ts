import { relations } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { organization, team, user } from "./auth";

/**
 * Expenses + their categories. Scoped by `organizationId` + `salonId`. Money is
 * `numeric`. `expense.payment_method` is optional (how it was paid); cash
 * expenses do not yet affect a cash session (revisit with caja integration).
 */
export const expenseCategory = pgTable(
  "expense_category",
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
  (t) => [index("expense_category_salon_idx").on(t.salonId)],
);

export const expense = pgTable(
  "expense",
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
    categoryId: text("category_id").references(() => expenseCategory.id, {
      onDelete: "set null",
    }),
    vendor: text("vendor"),
    description: text("description"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    paymentMethod: text("payment_method"), // cash | card | transfer | other | null
    expenseDate: timestamp("expense_date").notNull().defaultNow(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("expense_salon_idx").on(t.salonId),
    index("expense_category_idx").on(t.categoryId),
    index("expense_date_idx").on(t.expenseDate),
  ],
);

export const expenseCategoryRelations = relations(
  expenseCategory,
  ({ many }) => ({
    expenses: many(expense),
  }),
);

export const expenseRelations = relations(expense, ({ one }) => ({
  category: one(expenseCategory, {
    fields: [expense.categoryId],
    references: [expenseCategory.id],
  }),
}));
