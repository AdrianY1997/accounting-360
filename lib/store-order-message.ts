import { effectivePrice, findImageVariant } from "@/lib/model-gallery";
import type { PublicItem, PublicVariantImage } from "@/services/public";

/**
 * Pre-filled WhatsApp order message for the multi-select model picker: one
 * line per chosen photo (its "Modelo #N", the owning variant's name when the
 * item actually has more than one, and its price unless `hidePrices`), plus
 * the stateless preview link so the business can see exactly which photos
 * were picked without looking anything up.
 */
export function buildOrderMessage({
  item,
  gallery,
  selectedIndexes,
  previewUrl,
  currency,
  hidePrices,
}: {
  item: PublicItem;
  gallery: PublicVariantImage[];
  /** Sorted ascending, 0-based. */
  selectedIndexes: number[];
  previewUrl: string;
  currency: string;
  hidePrices: boolean;
}): string {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const showVariantName = item.variants.length > 1;

  const modelLines = selectedIndexes.map((i) => {
    const img = gallery[i];
    const variant = findImageVariant(item, img);
    const parts = [`Modelo #${i + 1}`];
    if (showVariantName && variant) parts.push(`(${variant.name})`);
    if (!hidePrices) {
      const price = variant ? effectivePrice(variant) : Number(item.price);
      parts.push(`— ${fmt.format(price)}`);
    }
    return `- ${parts.join(" ")}`;
  });

  const plural = selectedIndexes.length > 1;

  return [
    "Hola.",
    "Me interesa el siguiente producto.",
    "",
    `Producto: ${item.name}`,
    "Modelos seleccionados:",
    ...modelLines,
    "",
    `Ver mi selección: ${previewUrl}`,
    "",
    plural ? "¿Se encuentran disponibles?" : "¿Se encuentra disponible?",
    "",
    "Muchas gracias.",
  ].join("\n");
}
