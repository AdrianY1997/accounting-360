import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  organization,
  salonSettings,
  service,
  serviceImage,
  serviceVariant,
  team,
} from "@/db/schema";

export type PublicVariant = {
  id: string;
  name: string;
  price: string | null;
  stock: number;
  images: string[];
};
export type PublicItem = {
  id: string;
  name: string;
  price: string;
  measureType: string;
  priceMode: string;
  tracksStock: boolean;
  totalStock: number;
  images: string[];
  variants: PublicVariant[];
};
export type PublicStore = {
  company: string;
  salon: string;
  currency: string;
  items: PublicItem[];
};

/**
 * Public, unauthenticated storefront for a salón: active items with images,
 * variants and stock, and the suggested price. No cost/min/reseller exposed.
 */
export async function publicStore(salonId: string): Promise<PublicStore | null> {
  const salon = await db.query.team.findFirst({ where: eq(team.id, salonId) });
  if (!salon) return null;

  const [org, settings, items] = await Promise.all([
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
        tracksStock: service.tracksStock,
      })
      .from(service)
      .where(and(eq(service.salonId, salonId), eq(service.active, true)))
      .orderBy(asc(service.name)),
  ]);

  const ids = items.map((i) => i.id);
  const [images, variants] = await Promise.all([
    ids.length
      ? db
          .select({
            serviceId: serviceImage.serviceId,
            variantId: serviceImage.variantId,
            url: serviceImage.url,
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

  return {
    company: org?.name ?? "salon360",
    salon: salon.name,
    currency: settings?.currency ?? "USD",
    items: items.map((it) => {
      const itemVariants = variants.filter((v) => v.serviceId === it.id);
      // Display price = lowest variant price (the item base has no price).
      const prices = itemVariants
        .map((v) => Number(v.price))
        .filter((n) => n > 0);
      const fromPrice = prices.length ? Math.min(...prices).toFixed(2) : it.price;
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
            .map((im) => im.url),
        })),
      };
    }),
  };
}
