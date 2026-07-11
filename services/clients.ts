import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { client, resellerLink } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type { ClientInput } from "@/lib/validations/client";

export type Client = typeof client.$inferSelect;

/**
 * Client (customer) business logic. Every operation is scoped to the caller's
 * salón context — never trust a salonId from the request body.
 */

function normalize(input: ClientInput) {
  return {
    fullName: input.fullName.trim(),
    type: input.type,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    notes: input.notes?.trim() || null,
    active: input.active ?? true,
  };
}

export async function listClients(ctx: SalonContext, q?: string) {
  const search = q?.trim();
  return db
    .select()
    .from(client)
    .where(
      and(
        eq(client.organizationId, ctx.organizationId),
        eq(client.salonId, ctx.salonId),
        search
          ? or(
              ilike(client.fullName, `%${search}%`),
              ilike(client.phone, `%${search}%`),
              ilike(client.email, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(client.createdAt));
}

/**
 * Gets (or creates) the priceless share link for a reseller client; `rotate`
 * replaces the token so the previous URL stops working. Returns null when the
 * client isn't an active reseller of this salón.
 */
export async function getResellerLink(
  ctx: SalonContext,
  clientId: string,
  rotate = false,
) {
  const [reseller] = await db
    .select({ id: client.id, type: client.type, active: client.active })
    .from(client)
    .where(
      and(
        eq(client.id, clientId),
        eq(client.organizationId, ctx.organizationId),
        eq(client.salonId, ctx.salonId),
      ),
    );
  if (!reseller || reseller.type !== "reseller" || !reseller.active) {
    return null;
  }
  const [existing] = await db
    .select({ id: resellerLink.id })
    .from(resellerLink)
    .where(eq(resellerLink.clientId, clientId));
  if (existing && !rotate) return existing;
  if (existing) {
    await db.delete(resellerLink).where(eq(resellerLink.id, existing.id));
  }
  const [created] = await db
    .insert(resellerLink)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      clientId,
    })
    .returning({ id: resellerLink.id });
  return created;
}

export async function createClient(ctx: SalonContext, input: ClientInput) {
  const [created] = await db
    .insert(client)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      ...normalize(input),
    })
    .returning();
  return created;
}

export async function updateClient(
  ctx: SalonContext,
  id: string,
  input: ClientInput,
) {
  const [updated] = await db
    .update(client)
    .set(normalize(input))
    .where(
      and(
        eq(client.id, id),
        eq(client.organizationId, ctx.organizationId),
        eq(client.salonId, ctx.salonId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteClient(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(client)
    .where(
      and(
        eq(client.id, id),
        eq(client.organizationId, ctx.organizationId),
        eq(client.salonId, ctx.salonId),
      ),
    )
    .returning({ id: client.id });
  return deleted ?? null;
}
