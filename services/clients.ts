import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { client } from "@/db/schema";
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
