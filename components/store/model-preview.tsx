import { buildModelGallery, effectivePrice, findImageVariant } from "@/lib/model-gallery";
import { isNew } from "@/lib/utils";
import type { PublicItem, PublicStore } from "@/services/public";
import { PhotoBadges } from "./photo-badges";
import { WhatsappCta } from "./whatsapp-link";

/**
 * Renders only the photos the customer marked before sending the WhatsApp
 * order — the stateless counterpart of `ModelSelector`. Nothing is persisted:
 * the URL's `/preview/:indexes` segment is the only state, re-resolved here
 * against the same `buildModelGallery` order the customer saw, so "Modelo #4"
 * can never point at a different photo than what was shown at selection time.
 */
export function ModelPreview({
  store,
  item,
  selected,
  hidePrices = false,
}: {
  store: PublicStore;
  item: PublicItem;
  /** Sorted ascending, 0-based, already validated against the gallery length. */
  selected: number[];
  hidePrices?: boolean;
}) {
  const gallery = buildModelGallery(item);
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency: store.currency });
  const showVariantName = item.variants.length > 1;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-sm">{store.company}</p>
        <h1 className="text-xl font-semibold capitalize">{item.name}</h1>
        <p className="text-muted-foreground text-sm">
          {selected.length === 1
            ? "Modelo seleccionado"
            : `${selected.length} modelos seleccionados`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {selected.map((i) => {
          const img = gallery[i];
          const variant = findImageVariant(item, img);
          const soldOut = img.stock === 0;
          const price = variant ? effectivePrice(variant) : Number(item.price);
          return (
            <div key={i} className="overflow-hidden rounded-lg border bg-white">
              <div className="bg-muted relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Modelo ${i + 1}`}
                  className={`size-full object-cover ${soldOut ? "opacity-40" : ""}`}
                />
                <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-pink-600 text-xs font-bold text-white shadow">
                  {i + 1}
                </span>
                <PhotoBadges
                  soldOut={soldOut}
                  isNewPhoto={isNew(img.createdAt)}
                  aiKind={img.aiKind}
                />
              </div>
              <div className="space-y-0.5 p-2 text-sm">
                <p className="font-medium">
                  Modelo #{i + 1}
                  {showVariantName && variant ? ` — ${variant.name}` : ""}
                </p>
                {!hidePrices && (
                  <p className="text-muted-foreground">{fmt.format(price)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <WhatsappCta
        phone={store.whatsapp}
        message={`Hola, me interesa el Modelo${selected.length > 1 ? "s" : ""} #${selected
          .map((i) => i + 1)
          .join(", #")} de ${item.name}`}
      />
    </div>
  );
}
