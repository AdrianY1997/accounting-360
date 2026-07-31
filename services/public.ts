import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { type AiKind, isAiKind } from "@/lib/ai-images";
import { categoryPath, familyIds } from "@/lib/categories";
import { env } from "@/lib/env";
import { effectivePrice } from "@/lib/model-gallery";
import {
  client,
  organization,
  resellerLink,
  salonSettings,
  service,
  serviceCategory,
  serviceImage,
  serviceVariant,
  team,
} from "@/db/schema";

export type PublicVariantImage = {
  url: string;
  stock: number | null;
  createdAt: Date;
  /** AI disclosure: null = real photo (lib/ai-images.ts). */
  aiKind: AiKind | null;
};
export type PublicVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  /** Active discount (shown with `price` struck through); null = none. */
  discountPrice: string | null;
  stock: number;
  createdAt: Date;
  images: PublicVariantImage[];
};
export type PublicItem = {
  id: string;
  name: string;
  sku: string | null;
  /** Display price — the lowest EFFECTIVE (discounted) variant price. */
  price: string;
  /** Regular price of that same variant when it's discounted; null = no deal. */
  compareAtPrice: string | null;
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
  createdAt: Date;
  images: PublicVariantImage[];
  /** Cover image: the item's own main photo, else the first in-stock variant photo. */
  cover: string | null;
  /** AI disclosure of the cover photo. */
  coverAiKind: AiKind | null;
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
          createdAt: service.createdAt,
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
              createdAt: serviceImage.createdAt,
              aiKind: serviceImage.aiKind,
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
        // Display price = lowest EFFECTIVE variant price (an active discount
        // replaces the regular price). compareAtPrice = that variant's
        // regular price when discounted, for the struck-through display.
        const priced = itemVariants
          .map((v) => {
            const regular = Number(v.price);
            const disc = v.discountPrice ? Number(v.discountPrice) : 0;
            return {
              effective: effectivePrice(v),
              regular,
              hasDiscount: disc > 0 && disc < regular,
            };
          })
          .filter((p) => p.effective > 0)
          .sort((a, b) => a.effective - b.effective);
        const cheapest = priced[0];
        const fromPrice = cheapest ? cheapest.effective.toFixed(2) : it.price;
        const compareAtPrice = cheapest?.hasDiscount
          ? cheapest.regular.toFixed(2)
          : null;
        const toPublicImage = (im: (typeof images)[number]) => ({
          url: im.url,
          stock: im.variantId ? im.stock : null,
          createdAt: im.createdAt,
          aiKind: isAiKind(im.aiKind) ? im.aiKind : null,
        });
        const itemImages = images
          .filter((im) => im.serviceId === it.id && !im.variantId)
          .map(toPublicImage);
        // In-stock (or untracked) variant photos, in upload order — used to
        // fall back to a cover photo when the item has no main image.
        const availableVariantImages = itemVariants
          .flatMap((v) => images.filter((im) => im.variantId === v.id))
          .filter((im) => im.stock !== 0);
        const coverRow =
          images.find((im) => im.serviceId === it.id && !im.variantId) ??
          availableVariantImages[0] ??
          images.find((im) => im.serviceId === it.id) ??
          null;
        const cover = coverRow?.url ?? null;
        const coverAiKind =
          coverRow && isAiKind(coverRow.aiKind) ? coverRow.aiKind : null;
        return {
          ...it,
          features: it.features ?? [],
          attributes: it.attributes ?? {},
          price: fromPrice,
          compareAtPrice,
          totalStock: itemVariants.reduce((acc, v) => acc + v.stock, 0),
          images: itemImages,
          cover,
          coverAiKind,
          variants: itemVariants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            discountPrice: v.discountPrice,
            stock: v.stock,
            createdAt: v.createdAt,
            images: images
              .filter((im) => im.variantId === v.id)
              .map(toPublicImage),
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

export type PublicResellerStore = {
  store: PublicStore;
  /** This link's mode: true keeps real prices, false strips them below. */
  showPrices: boolean;
};

/**
 * Storefront for a reseller share link (`/s/<token>`). Each reseller can have
 * up to two independent links (one per `showPrices` mode). When `showPrices`
 * is false, prices are stripped SERVER-SIDE — they never reach the HTML/RSC
 * payload, so the link recipient can't uncover them. WhatsApp contact always
 * becomes the reseller's own phone (null = hide the buttons); the salón's
 * number is never exposed here.
 */
export async function publicStoreByResellerToken(
  token: string,
): Promise<PublicResellerStore | null> {
  const [link] = await db
    .select({
      salonId: resellerLink.salonId,
      phone: client.phone,
      type: client.type,
      active: client.active,
      showPrices: resellerLink.showPrices,
    })
    .from(resellerLink)
    .innerJoin(client, eq(client.id, resellerLink.clientId))
    .where(eq(resellerLink.id, token));
  if (!link || link.type !== "reseller" || !link.active) return null;

  const store = await publicStore(link.salonId);
  if (!store) return null;
  const withWhatsapp = { ...store, whatsapp: link.phone?.trim() || null };
  const priced: PublicStore = link.showPrices
    ? withWhatsapp
    : {
        ...withWhatsapp,
        items: withWhatsapp.items.map((it) => ({
          ...it,
          price: "",
          compareAtPrice: null,
          variants: it.variants.map((v) => ({
            ...v,
            price: "",
            discountPrice: null,
          })),
        })),
      };
  return { store: priced, showPrices: link.showPrices };
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
