import { timestamp } from "drizzle-orm/pg-core";

/**
 * Audit timestamps shared by every table. Spread into table definitions:
 * `...timestamps`.
 */
export const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
