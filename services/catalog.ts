import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { service, serviceCategory, serviceImage } from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type { CategoryInput, ServiceInput } from "@/lib/validations/catalog";

export type ServiceCategory = typeof serviceCategory.$inferSelect;
export type Service = typeof service.$inferSelect;
export type ServiceImage = typeof serviceImage.$inferSelect;

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

// --- Item images ---

/** Confirms a service belongs to the caller's salón. */
async function ownsService(ctx: SalonContext, serviceId: string) {
  const found = await db.query.service.findFirst({
    where: and(
      eq(service.id, serviceId),
      eq(service.organizationId, ctx.organizationId),
      eq(service.salonId, ctx.salonId),
    ),
  });
  return Boolean(found);
}

export async function listImages(ctx: SalonContext, serviceId: string) {
  if (!(await ownsService(ctx, serviceId))) return [];
  return db
    .select()
    .from(serviceImage)
    .where(eq(serviceImage.serviceId, serviceId))
    .orderBy(asc(serviceImage.createdAt));
}

/** First image URL per service id, for list thumbnails. */
export async function imagesForServices(ctx: SalonContext, ids: string[]) {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      serviceId: serviceImage.serviceId,
      url: serviceImage.url,
      createdAt: serviceImage.createdAt,
    })
    .from(serviceImage)
    .innerJoin(service, eq(service.id, serviceImage.serviceId))
    .where(
      and(eq(service.salonId, ctx.salonId), inArray(serviceImage.serviceId, ids)),
    )
    .orderBy(asc(serviceImage.createdAt));
  for (const r of rows) if (!map.has(r.serviceId)) map.set(r.serviceId, r.url);
  return map;
}

export async function addImage(
  ctx: SalonContext,
  serviceId: string,
  url: string,
  pathname: string,
) {
  if (!(await ownsService(ctx, serviceId))) return null;
  const [created] = await db
    .insert(serviceImage)
    .values({ serviceId, url, pathname })
    .returning();
  return created;
}

export async function deleteImage(ctx: SalonContext, imageId: string) {
  const [row] = await db
    .select({ id: serviceImage.id, pathname: serviceImage.pathname })
    .from(serviceImage)
    .innerJoin(service, eq(service.id, serviceImage.serviceId))
    .where(and(eq(serviceImage.id, imageId), eq(service.salonId, ctx.salonId)));
  if (!row) return null;
  await db.delete(serviceImage).where(eq(serviceImage.id, imageId));
  return row;
}
