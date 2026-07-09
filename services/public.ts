import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categoryPath, familyIds } from "@/lib/categories";
import { env } from "@/lib/env";
import {
  organization,
  salonSettings,
  service,
  serviceCategory,
  serviceImage,
  serviceVariant,
  team,
} from "@/db/schema";

export type PublicVariantImage = { url: string; stock: number | null };
export type PublicVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  images: PublicVariantImage[];
};
export type PublicItem = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  measureType: string;
  priceMode: string;
  durationMinutes: number;
  tracksStock: boolean;
  totalStock: number;
  categoryId: string | null;
  summary: string | null;
  description: string | null;
  features: string[];
  attributes: Record<string, string>;
  images: string[];
  variants: PublicVariant[];
};
export type PublicCategory = {
  id: string;
  name: string;
  parentId: string | null;
};
export type PublicStore = {
  company: string;
  salon: string;
  currency: string;
  storeType: string;
  whatsapp: string | null;
  shippingInfo: string | null;
  categories: PublicCategory[];
  items: PublicItem[];
};

/**
 * Public, unauthenticated storefront for a salón: active items with images,
 * variants and stock, and the suggested price. No cost/min/reseller exposed.
 * Cached per request so layout, listing and detail pages share one load.
 */
export const publicStore = cache(
  async (salonId: string): Promise<PublicStore | null> => {
    const salon = await db.query.team.findFirst({ where: eq(team.id, salonId) });
    if (!salon) return null;

    const [org, settings, items, categories] = await Promise.all([
      db.query.organization.findFirst({
        where: eq(organization.id, salon.organizationId),
      }),
      db.query.salonSettings.findFirst({
        where: eq(salonSettings.teamId, salonId),
      }),
      db
        .select({
          id: service.id,
          name: service.name,
          sku: service.sku,
          price: service.price,
          measureType: service.measureType,
          priceMode: service.priceMode,
          durationMinutes: service.durationMinutes,
          tracksStock: service.tracksStock,
          categoryId: service.categoryId,
          summary: service.summary,
          description: service.description,
          features: service.features,
          attributes: service.attributes,
        })
        .from(service)
        .where(and(eq(service.salonId, salonId), eq(service.active, true)))
        .orderBy(asc(service.name)),
      db
        .select({
          id: serviceCategory.id,
          name: serviceCategory.name,
          parentId: serviceCategory.parentId,
        })
        .from(serviceCategory)
        .where(eq(serviceCategory.salonId, salonId))
        .orderBy(asc(serviceCategory.name)),
    ]);

    const ids = items.map((i) => i.id);
    const [images, variants] = await Promise.all([
      ids.length
        ? db
            .select({
              serviceId: serviceImage.serviceId,
              variantId: serviceImage.variantId,
              url: serviceImage.url,
              stock: serviceImage.stock,
            })
            .from(serviceImage)
            .where(inArray(serviceImage.serviceId, ids))
            .orderBy(asc(serviceImage.createdAt))
        : [],
      ids.length
        ? db
            .select()
            .from(serviceVariant)
            .where(inArray(serviceVariant.serviceId, ids))
            .orderBy(asc(serviceVariant.createdAt))
        : [],
    ]);

    // Used categories plus their parents (paths and the hierarchical filter
    // must always resolve).
    const usedCategoryIds = new Set(
      items.map((i) => i.categoryId).filter(Boolean),
    );
    for (const c of categories) {
      if (usedCategoryIds.has(c.id) && c.parentId) usedCategoryIds.add(c.parentId);
    }

    return {
      company: org?.name ?? "salon360",
      salon: salon.name,
      currency: settings?.currency ?? "USD",
      storeType: settings?.storeType ?? "generic",
      whatsapp:
        settings?.whatsapp ?? env.NEXT_PUBLIC_WHATSAPP_FALLBACK ?? null,
      shippingInfo: settings?.shippingInfo ?? null,
      categories: categories.filter((c) => usedCategoryIds.has(c.id)),
      items: items.map((it) => {
        const itemVariants = variants.filter((v) => v.serviceId === it.id);
        // Display price = lowest variant price (the item base has no price).
        const prices = itemVariants
          .map((v) => Number(v.price))
          .filter((n) => n > 0);
        const fromPrice = prices.length
          ? Math.min(...prices).toFixed(2)
          : it.price;
        return {
          ...it,
          features: it.features ?? [],
          attributes: it.attributes ?? {},
          price: fromPrice,
          totalStock: itemVariants.reduce((acc, v) => acc + v.stock, 0),
          images: images
            .filter((im) => im.serviceId === it.id && !im.variantId)
            .map((im) => im.url),
          variants: itemVariants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            images: images
              .filter((im) => im.variantId === v.id)
              .map((im) => ({ url: im.url, stock: im.stock })),
          })),
        };
      }),
    };
  },
);

export type PublicStoreItem = {
  store: PublicStore;
  item: PublicItem;
  /** `[parent, child]` (or `[cat]`) — empty when the item has no category. */
  categoryPath: PublicCategory[];
};

/** One item of the public storefront (detail page). */
export async function publicStoreItem(
  salonId: string,
  itemId: string,
): Promise<PublicStoreItem | null> {
  const store = await publicStore(salonId);
  const item = store?.items.find((i) => i.id === itemId);
  if (!store || !item) return null;
  return {
    store,
    item,
    categoryPath: item.categoryId
      ? categoryPath(store.categories, item.categoryId)
      : [],
  };
}

/**
 * Related items for the detail page: same category family (parent + siblings
 * + children) and in stock first, then the rest of the catalog. In-memory —
 * catalogs are small and `publicStore` is request-cached.
 */
export function recommendItems(
  store: PublicStore,
  current: PublicItem,
  limit = 5,
): PublicItem[] {
  const family = current.categoryId
    ? familyIds(store.categories, current.categoryId)
    : new Set<string>();
  const available = (it: PublicItem) => !it.tracksStock || it.totalStock > 0;
  const score = (it: PublicItem) => {
    const related = it.categoryId !== null && family.has(it.categoryId);
    return (related ? 0 : 2) + (available(it) ? 0 : 1);
  };
  return store.items
    .filter((it) => it.id !== current.id)
    .sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name))
    .slice(0, limit);
}
