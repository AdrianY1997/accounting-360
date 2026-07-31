import type { PublicItem, PublicVariant, PublicVariantImage } from "@/services/public";

/** Sold-out photos (stock === 0) move to the end, in-stock/untracked first. */
export function orderGallery(images: PublicVariantImage[]): PublicVariantImage[] {
  return [...images].sort((a, b) => {
    const aOut = a.stock === 0 ? 1 : 0;
    const bOut = b.stock === 0 ? 1 : 0;
    return aOut - bOut;
  });
}

/**
 * Flat, numbered "Modelo #N" gallery: the item's own photos plus every
 * variant's, sold-out pushed last. This must be the single source of this
 * array — the customer-facing selector and the stateless preview link both
 * number off this exact order, or "Modelo #4" could mean two different
 * photos between what the customer picked and what the business sees.
 */
export function buildModelGallery(item: PublicItem): PublicVariantImage[] {
  return orderGallery([
    ...item.images,
    ...item.variants.flatMap((v) => v.images),
  ]);
}

/** Which variant (if any) owns a gallery photo — item-level photos have none. */
export function findImageVariant(
  item: PublicItem,
  image: PublicVariantImage,
): PublicVariant | undefined {
  return item.variants.find((v) => v.images.some((img) => img.url === image.url));
}

/**
 * A variant's effective price: an active discount (a positive `discountPrice`)
 * replaces the regular price. `discountPrice` can validly be the literal `"0"`
 * (not just null) when a discount was cleared, so it must be compared as a
 * number, never treated as truthy/falsy. Takes just the two price fields
 * (not a full `PublicVariant`) so raw DB rows — which have the same
 * `price`/`discountPrice` columns but not the mapped `images` shape — can
 * use it too, e.g. `publicStore`'s own "lowest effective variant price" calc.
 */
export function effectivePrice(variant: Pick<PublicVariant, "price" | "discountPrice">): number {
  const regular = Number(variant.price);
  const disc = variant.discountPrice ? Number(variant.discountPrice) : 0;
  return disc > 0 ? disc : regular;
}

/**
 * Parses the comma-separated `/preview/:indexes` URL segment: drops
 * non-integer/out-of-range values, dedupes, sorts ascending. The segment can
 * arrive with its comma still percent-encoded (`2%2C5%2C9`) depending on how
 * the link was navigated, so this decodes defensively before splitting — and
 * tolerates a malformed percent-escape instead of throwing, since this is
 * public, unvalidated URL input.
 */
export function parsePreviewIndexes(
  raw: string,
  galleryLength: number,
): number[] {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return [];
  }
  const set = new Set(
    decoded
      .split(",")
      .filter((s) => s !== "") // Number("") is 0, not NaN — would smuggle in index 0
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < galleryLength),
  );
  return [...set].sort((a, b) => a - b);
}
