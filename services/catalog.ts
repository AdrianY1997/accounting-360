import { and, asc, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  salonSettings,
  service,
  serviceCategory,
  serviceImage,
  serviceVariant,
} from "@/db/schema";
import type { SalonContext } from "@/lib/tenant";
import type {
  CategoryInput,
  ServiceInput,
  VariantInput,
} from "@/lib/validations/catalog";

export type VariantImage = { id: string; url: string; stock: number | null };

export type ServiceCategory = typeof serviceCategory.$inferSelect;
export type Service = typeof service.$inferSelect;
export type ServiceImage = typeof serviceImage.$inferSelect;
export type ServiceVariant = typeof serviceVariant.$inferSelect;

/** Service catalog logic. Every query scoped to the caller's salón. */

// --- Categories ---

/** Domain error for category rules (routes map it to HTTP 400). */
export class CategoryError extends Error {}

/**
 * One level of nesting only. Throws CategoryError when the parent is missing,
 * is itself a subcategory, is the category itself, or when the category being
 * updated already has children.
 */
async function assertValidParent(
  ctx: SalonContext,
  parentId: string | null | undefined,
  selfId?: string,
) {
  if (!parentId) return;
  if (selfId && parentId === selfId) {
    throw new CategoryError("Una categoría no puede ser su propio padre.");
  }
  const [parent] = await db
    .select({ id: serviceCategory.id, parentId: serviceCategory.parentId })
    .from(serviceCategory)
    .where(
      and(
        eq(serviceCategory.id, parentId),
        eq(serviceCategory.organizationId, ctx.organizationId),
        eq(serviceCategory.salonId, ctx.salonId),
      ),
    );
  if (!parent) throw new CategoryError("Categoría padre no encontrada.");
  if (parent.parentId) {
    throw new CategoryError(
      "Solo se permite un nivel de subcategorías (el padre ya es subcategoría).",
    );
  }
  if (selfId) {
    const [child] = await db
      .select({ id: serviceCategory.id })
      .from(serviceCategory)
      .where(eq(serviceCategory.parentId, selfId))
      .limit(1);
    if (child) {
      throw new CategoryError(
        "Esta categoría tiene subcategorías; no puede convertirse en subcategoría.",
      );
    }
  }
}

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
  await assertValidParent(ctx, input.parentId);
  const [created] = await db
    .insert(serviceCategory)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      name: input.name.trim(),
      parentId: input.parentId ?? null,
    })
    .returning();
  return created;
}

export async function updateCategory(
  ctx: SalonContext,
  id: string,
  input: CategoryInput,
) {
  await assertValidParent(ctx, input.parentId, id);
  const [updated] = await db
    .update(serviceCategory)
    .set({ name: input.name.trim(), parentId: input.parentId ?? null })
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

/**
 * Next per-salón item SKU: P-0001 for products, S-0001 for duration services.
 * Increments the salón's sequence atomically (upserting the settings row if
 * missing) so concurrent creations can't collide. SKUs are immutable.
 */
async function nextItemSku(ctx: SalonContext, measureType: string) {
  const isService = measureType === "duration";
  const bump = isService
    ? { skuSeqService: sql`${salonSettings.skuSeqService} + 1` }
    : { skuSeqProduct: sql`${salonSettings.skuSeqProduct} + 1` };
  let [row] = await db
    .update(salonSettings)
    .set(bump)
    .where(eq(salonSettings.teamId, ctx.salonId))
    .returning({
      p: salonSettings.skuSeqProduct,
      s: salonSettings.skuSeqService,
    });
  if (!row) {
    await db
      .insert(salonSettings)
      .values({ teamId: ctx.salonId })
      .onConflictDoNothing();
    [row] = await db
      .update(salonSettings)
      .set(bump)
      .where(eq(salonSettings.teamId, ctx.salonId))
      .returning({
        p: salonSettings.skuSeqProduct,
        s: salonSettings.skuSeqService,
      });
  }
  const n = isService ? row.s : row.p;
  return `${isService ? "S" : "P"}-${String(n).padStart(4, "0")}`;
}

/** Next variant SKU for an item: item SKU + 2-digit suffix past the max used. */
function nextVariantSku(itemSku: string | null, existing: (string | null)[]) {
  if (!itemSku) return null;
  const prefix = `${itemSku}-`;
  const max = existing.reduce((m, s) => {
    if (!s || !s.startsWith(prefix)) return m;
    const n = Number(s.slice(prefix.length));
    return Number.isInteger(n) && n > m ? n : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

function normalizeService(input: ServiceInput) {
  return {
    name: input.name.trim(),
    summary: input.summary?.trim() || null,
    description: input.description?.trim() || null,
    features: (() => {
      const list = input.features?.map((f) => f.trim()).filter(Boolean) ?? [];
      return list.length ? list : null;
    })(),
    // Values are kept for every key ever saved — switching the salón's store
    // type must not destroy data; rendering is template-driven.
    attributes: (() => {
      const entries = Object.entries(input.attributes ?? {})
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v);
      return entries.length ? Object.fromEntries(entries) : null;
    })(),
    categoryId: input.categoryId || null,
    price: input.price.toFixed(2),
    costPrice: input.costPrice.toFixed(2),
    resellerPrice: input.resellerPrice.toFixed(2),
    minPrice: input.minPrice.toFixed(2),
    measureType: input.measureType,
    priceMode: input.measureType === "duration" ? input.priceMode : "per_unit",
    durationMinutes: input.durationMinutes,
    tracksStock: input.tracksStock ?? false,
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
    .orderBy(asc(service.name));
}

/** Single catalog entry, salón-scoped (edit page). */
export async function getService(ctx: SalonContext, id: string) {
  const [row] = await db
    .select()
    .from(service)
    .where(
      and(
        eq(service.id, id),
        eq(service.organizationId, ctx.organizationId),
        eq(service.salonId, ctx.salonId),
      ),
    );
  return row ?? null;
}

export async function createService(ctx: SalonContext, input: ServiceInput) {
  const sku = await nextItemSku(ctx, input.measureType);
  const [created] = await db
    .insert(service)
    .values({
      organizationId: ctx.organizationId,
      salonId: ctx.salonId,
      sku,
      ...normalizeService(input),
    })
    .returning();
  // Every item has at least one variant — pricing lives on variants.
  await db.insert(serviceVariant).values({
    serviceId: created.id,
    name: "Estándar",
    sku: `${sku}-01`,
    price: input.price.toFixed(2),
    costPrice: input.costPrice.toFixed(2),
    resellerPrice: input.resellerPrice.toFixed(2),
    minPrice: input.minPrice.toFixed(2),
    stock: 0,
  });
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
      and(
        eq(service.salonId, ctx.salonId),
        isNull(serviceImage.variantId),
        inArray(serviceImage.serviceId, ids),
      ),
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
  variantId?: string | null,
  aiKind?: string | null,
) {
  if (!(await ownsService(ctx, serviceId))) return null;
  const [created] = await db
    .insert(serviceImage)
    .values({
      serviceId,
      url,
      pathname,
      variantId: variantId ?? null,
      aiKind: aiKind ?? null,
    })
    .returning();
  return created;
}

/** Sets/clears the AI-disclosure kind of a photo (any photo, salón-scoped). */
export async function updateImageAiKind(
  ctx: SalonContext,
  imageId: string,
  aiKind: string | null,
) {
  const [row] = await db
    .select({ id: serviceImage.id })
    .from(serviceImage)
    .innerJoin(service, eq(service.id, serviceImage.serviceId))
    .where(and(eq(serviceImage.id, imageId), eq(service.salonId, ctx.salonId)));
  if (!row) return null;
  const [updated] = await db
    .update(serviceImage)
    .set({ aiKind })
    .where(eq(serviceImage.id, imageId))
    .returning();
  return updated;
}

export async function deleteImage(ctx: SalonContext, imageId: string) {
  const [row] = await db
    .select({
      id: serviceImage.id,
      pathname: serviceImage.pathname,
      variantId: serviceImage.variantId,
    })
    .from(serviceImage)
    .innerJoin(service, eq(service.id, serviceImage.serviceId))
    .where(and(eq(serviceImage.id, imageId), eq(service.salonId, ctx.salonId)));
  if (!row) return null;
  await db.delete(serviceImage).where(eq(serviceImage.id, imageId));
  if (row.variantId) await recomputeVariantStock(row.variantId);
  return row;
}

/**
 * Sets per-photo stock for a variant image and recomputes the variant's
 * total stock as the sum of its images' stock (only images with a non-null
 * value are tracked per photo; if none remain, the variant's own `stock`
 * stays as the manually-set total).
 */
export async function updateImageStock(
  ctx: SalonContext,
  imageId: string,
  stock: number | null,
) {
  const [row] = await db
    .select({ id: serviceImage.id, variantId: serviceImage.variantId })
    .from(serviceImage)
    .innerJoin(service, eq(service.id, serviceImage.serviceId))
    .where(and(eq(serviceImage.id, imageId), eq(service.salonId, ctx.salonId)));
  if (!row || !row.variantId) return null;
  await db
    .update(serviceImage)
    .set({ stock })
    .where(eq(serviceImage.id, imageId));
  await recomputeVariantStock(row.variantId);
  const [updated] = await db
    .select()
    .from(serviceVariant)
    .where(eq(serviceVariant.id, row.variantId));
  return updated ?? null;
}

/** Recomputes a variant's total stock from its images, when any track stock per photo. */
async function recomputeVariantStock(variantId: string) {
  const images = await db
    .select({ stock: serviceImage.stock })
    .from(serviceImage)
    .where(eq(serviceImage.variantId, variantId));
  const tracked = images.filter((i) => i.stock !== null);
  if (tracked.length === 0) return;
  const total = tracked.reduce((acc, i) => acc + (i.stock ?? 0), 0);
  await db
    .update(serviceVariant)
    .set({ stock: total })
    .where(eq(serviceVariant.id, variantId));
}

// --- Variants & stock ---

/** Variants of an item, each annotated with whether its stock is derived from photo stock. */
export async function listVariants(ctx: SalonContext, serviceId: string) {
  if (!(await ownsService(ctx, serviceId))) return [];
  const variants = await db
    .select()
    .from(serviceVariant)
    .where(eq(serviceVariant.serviceId, serviceId))
    .orderBy(asc(serviceVariant.createdAt));
  if (variants.length === 0) return [];
  const images = await db
    .select({ variantId: serviceImage.variantId, stock: serviceImage.stock })
    .from(serviceImage)
    .where(
      inArray(
        serviceImage.variantId,
        variants.map((v) => v.id),
      ),
    );
  const tracked = new Set(
    images.filter((i) => i.stock !== null).map((i) => i.variantId),
  );
  return variants.map((v) => ({ ...v, hasPhotoStock: tracked.has(v.id) }));
}

/** Lowest variant price ("desde") per service id. */
export async function priceFromForServices(ctx: SalonContext, ids: string[]) {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      serviceId: serviceVariant.serviceId,
      min: sql<string>`min(${serviceVariant.price})`,
    })
    .from(serviceVariant)
    .innerJoin(service, eq(service.id, serviceVariant.serviceId))
    .where(
      and(eq(service.salonId, ctx.salonId), inArray(serviceVariant.serviceId, ids)),
    )
    .groupBy(serviceVariant.serviceId);
  for (const r of rows) map.set(r.serviceId, Number(r.min));
  return map;
}

/** Total stock (sum of variant stock) per service id. */
export async function stockForServices(ctx: SalonContext, ids: string[]) {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      serviceId: serviceVariant.serviceId,
      stock: sql<number>`coalesce(sum(${serviceVariant.stock}), 0)`,
    })
    .from(serviceVariant)
    .innerJoin(service, eq(service.id, serviceVariant.serviceId))
    .where(
      and(eq(service.salonId, ctx.salonId), inArray(serviceVariant.serviceId, ids)),
    )
    .groupBy(serviceVariant.serviceId);
  for (const r of rows) map.set(r.serviceId, Number(r.stock));
  return map;
}

export async function createVariant(
  ctx: SalonContext,
  serviceId: string,
  input: VariantInput,
) {
  if (!(await ownsService(ctx, serviceId))) return null;
  const [[svc], siblings] = await Promise.all([
    db
      .select({ sku: service.sku })
      .from(service)
      .where(eq(service.id, serviceId)),
    db
      .select({ sku: serviceVariant.sku })
      .from(serviceVariant)
      .where(eq(serviceVariant.serviceId, serviceId)),
  ]);
  const [created] = await db
    .insert(serviceVariant)
    .values({
      serviceId,
      sku: nextVariantSku(svc?.sku ?? null, siblings.map((s) => s.sku)),
      name: input.name.trim(),
      price: input.price.toFixed(2),
      costPrice: input.costPrice.toFixed(2),
      resellerPrice: input.resellerPrice.toFixed(2),
      minPrice: input.minPrice.toFixed(2),
      stock: input.stock,
    })
    .returning();
  return created;
}

/** Confirms a variant belongs to the caller's salón; returns it or null. */
async function ownedVariant(ctx: SalonContext, variantId: string) {
  const [row] = await db
    .select({ id: serviceVariant.id })
    .from(serviceVariant)
    .innerJoin(service, eq(service.id, serviceVariant.serviceId))
    .where(
      and(eq(serviceVariant.id, variantId), eq(service.salonId, ctx.salonId)),
    );
  return row ?? null;
}

export async function updateVariant(
  ctx: SalonContext,
  variantId: string,
  input: VariantInput,
) {
  if (!(await ownedVariant(ctx, variantId))) return null;
  const [updated] = await db
    .update(serviceVariant)
    .set({
      name: input.name.trim(),
      price: input.price.toFixed(2),
      costPrice: input.costPrice.toFixed(2),
      resellerPrice: input.resellerPrice.toFixed(2),
      minPrice: input.minPrice.toFixed(2),
      stock: input.stock,
    })
    .where(eq(serviceVariant.id, variantId))
    .returning();
  return updated ?? null;
}

export async function deleteVariant(ctx: SalonContext, variantId: string) {
  if (!(await ownedVariant(ctx, variantId))) return null;
  const [deleted] = await db
    .delete(serviceVariant)
    .where(eq(serviceVariant.id, variantId))
    .returning({ id: serviceVariant.id });
  return deleted ?? null;
}

/** Variants grouped by service id (for the POS), salón-scoped, with their images. */
export async function variantsForServices(ctx: SalonContext, ids: string[]) {
  const map = new Map<string, (ServiceVariant & { images: VariantImage[] })[]>();
  if (ids.length === 0) return map;
  const rows = await db
    .select()
    .from(serviceVariant)
    .innerJoin(service, eq(service.id, serviceVariant.serviceId))
    .where(
      and(
        eq(service.salonId, ctx.salonId),
        inArray(serviceVariant.serviceId, ids),
      ),
    )
    .orderBy(asc(serviceVariant.createdAt));

  const variantIds = rows.map((r) => r.service_variant.id);
  const images = variantIds.length
    ? await db
        .select({
          id: serviceImage.id,
          variantId: serviceImage.variantId,
          url: serviceImage.url,
          stock: serviceImage.stock,
        })
        .from(serviceImage)
        .where(inArray(serviceImage.variantId, variantIds))
        .orderBy(asc(serviceImage.createdAt))
    : [];

  for (const r of rows) {
    const v = r.service_variant;
    const list = map.get(v.serviceId) ?? [];
    list.push({
      ...v,
      images: images
        .filter((i) => i.variantId === v.id)
        .map((i) => ({ id: i.id, url: i.url, stock: i.stock })),
    });
    map.set(v.serviceId, list);
  }
  return map;
}
