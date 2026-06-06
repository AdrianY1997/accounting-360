import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { service, serviceCategory } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type { CategoryInput, ServiceInput } from "@/lib/validations/catalog";

export type ServiceCategory = typeof serviceCategory.$inferSelect;
export type Service = typeof service.$inferSelect;

/** Service catalog logic. Every query scoped to the caller's salón. */

// --- Categories ---

export async function listCategories(ctx: SalonContext) {
  return db
    .select()
    .from(serviceCategory)
    .where(
      and(
        eq(serviceCategory.organizationId, ctx.organizationId),
        eq(serviceCategory.salonId, ctx.salonId),
      ),
    )
    .orderBy(asc(serviceCategory.name));
}

export async function createCategory(ctx: SalonContext, input: CategoryInput) {
  const [created] = await db
    .insert(serviceCategory)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      name: input.name.trim(),
    })
    .returning();
  return created;
}

export async function updateCategory(
  ctx: SalonContext,
  id: string,
  input: CategoryInput,
) {
  const [updated] = await db
    .update(serviceCategory)
    .set({ name: input.name.trim() })
    .where(
      and(
        eq(serviceCategory.id, id),
        eq(serviceCategory.organizationId, ctx.organizationId),
        eq(serviceCategory.salonId, ctx.salonId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteCategory(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(serviceCategory)
    .where(
      and(
        eq(serviceCategory.id, id),
        eq(serviceCategory.organizationId, ctx.organizationId),
        eq(serviceCategory.salonId, ctx.salonId),
      ),
    )
    .returning({ id: serviceCategory.id });
  return deleted ?? null;
}

// --- Services ---

function normalizeService(input: ServiceInput) {
  return {
    name: input.name.trim(),
    categoryId: input.categoryId || null,
    price: input.price.toFixed(2),
    costPrice: input.costPrice.toFixed(2),
    resellerPrice: input.resellerPrice.toFixed(2),
    minPrice: input.minPrice.toFixed(2),
    measureType: input.measureType,
    priceMode: input.measureType === "duration" ? input.priceMode : "per_unit",
    durationMinutes: input.durationMinutes,
    active: input.active ?? true,
  };
}

export async function listServices(ctx: SalonContext, q?: string) {
  const search = q?.trim();
  return db
    .select()
    .from(service)
    .where(
      and(
        eq(service.organizationId, ctx.organizationId),
        eq(service.salonId, ctx.salonId),
        search ? ilike(service.name, `%${search}%`) : undefined,
      ),
    )
    .orderBy(desc(service.createdAt));
}

export async function createService(ctx: SalonContext, input: ServiceInput) {
  const [created] = await db
    .insert(service)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      ...normalizeService(input),
    })
    .returning();
  return created;
}

export async function updateService(
  ctx: SalonContext,
  id: string,
  input: ServiceInput,
) {
  const [updated] = await db
    .update(service)
    .set(normalizeService(input))
    .where(
      and(
        eq(service.id, id),
        eq(service.organizationId, ctx.organizationId),
        eq(service.salonId, ctx.salonId),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function deleteService(ctx: SalonContext, id: string) {
  const [deleted] = await db
    .delete(service)
    .where(
      and(
        eq(service.id, id),
        eq(service.organizationId, ctx.organizationId),
        eq(service.salonId, ctx.salonId),
      ),
    )
    .returning({ id: service.id });
  return deleted ?? null;
}
