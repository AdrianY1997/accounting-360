import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type { SalonSettingsInput } from "@/lib/validations/settings";

export type SalonSettings = typeof salonSettings.$inferSelect;

export async function getSettings(ctx: SalonContext) {
  return db.query.salonSettings.findFirst({
    where: eq(salonSettings.teamId, ctx.salonId),
  });
}

/** Upserts the salón settings (the seed creates the row; update it here). */
export async function updateSettings(
  ctx: SalonContext,
  input: SalonSettingsInput,
) {
  const values = {
    currency: input.currency,
    taxRate: (input.taxRatePercent / 100).toFixed(4),
    timezone: input.timezone,
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
  };

  const existing = await getSettings(ctx);
  if (existing) {
    const [updated] = await db
      .update(salonSettings)
      .set(values)
      .where(eq(salonSettings.teamId, ctx.salonId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(salonSettings)
    .values({ teamId: ctx.salonId, ...values })
    .returning();
  return created;
}
