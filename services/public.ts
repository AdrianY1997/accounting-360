import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
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
  price: string;
  stock: number;
  images: PublicVariantImage[];
};
export type PublicItem = {
  id: string;
  name: string;
  price: string;
  measureType: string;
  priceMode: string;
  durationMinutes: number;
  tracksStock: boolean;
  totalStock: number;
  categoryId: string | null;
  description: string | null;
  images: string[];
  variants: PublicVariant[];
};
export type PublicCategory = { id: string; name: string };
export type PublicStore = {
  company: string;
  salon: string;
  currency: string;
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
          price: service.price,
          measureType: service.measureType,
          priceMode: service.priceMode,
          durationMinutes: service.durationMinutes,
          tracksStock: service.tracksStock,
          categoryId: service.categoryId,
          description: service.description,
        })
        .from(service)
        .where(and(eq(service.salonId, salonId), eq(service.active, true)))
        .orderBy(asc(service.name)),
      db
        .select({ id: serviceCategory.id, name: serviceCategory.name })
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

    const usedCategoryIds = new Set(
      items.map((i) => i.categoryId).filter(Boolean),
    );

    return {
      company: org?.name ?? "salon360",
      salon: salon.name,
      currency: settings?.currency ?? "USD",
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
          price: fromPrice,
          totalStock: itemVariants.reduce((acc, v) => acc + v.stock, 0),
          images: images
            .filter((im) => im.serviceId === it.id && !im.variantId)
            .map((im) => im.url),
          variants: itemVariants.map((v) => ({
            id: v.id,
            name: v.name,
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
  categoryName: string | null;
};

/** One item of the public storefront (detail page). */
export async function publicStoreItem(
  salonId: string,
  itemId: string,
): Promise<PublicStoreItem | null> {
  const store = await publicStore(salonId);
  const item = store?.items.find((i) => i.id === itemId);
  if (!store || !item) return null;
  const categoryName =
    store.categories.find((c) => c.id === item.categoryId)?.name ?? null;
  return { store, item, categoryName };
}
