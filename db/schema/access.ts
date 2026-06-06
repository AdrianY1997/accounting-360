import { relations } from "drizzle-orm";
import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { member } from "./auth";

/**
 * Per-member granular permissions (fully custom, no fixed role matrix). Owners
 * implicitly have all permissions; everyone else has exactly the rows here.
 * One row per (member, permission).
 */
export const memberPermission = pgTable(
  "member_permission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
  },
  (t) => [uniqueIndex("member_permission_uidx").on(t.memberId, t.permission)],
);

export const memberPermissionRelations = relations(
  memberPermission,
  ({ one }) => ({
    member: one(member, {
      fields: [memberPermission.memberId],
      references: [member.id],
    }),
  }),
);
