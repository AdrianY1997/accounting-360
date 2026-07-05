"use client";

import { useState } from "react";
import type { PublicItem, PublicVariantImage } from "@/services/public";
import { orderGallery, ProductGallery } from "./product-gallery";
import { SelectionSummary } from "./selection-summary";
import { ALL_VARIANTS, VariantPicker } from "./variant-picker";

/**
 * Detail-page orchestrator: variant + active-photo state, gallery, price,
 * low-stock warning, description and the selection summary panel.
 */
export function ProductDetail({
  item,
  currency,
}: {
  item: PublicItem;
  currency: string;
}) {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  // A single variant is auto-selected — the picker would be noise.
  const [variantId, setVariantId] = useState<string>(
    item.variants.length === 1 ? item.variants[0].id : ALL_VARIANTS,
  );
  const [active, setActive] = useState(0);
  const isService = item.measureType === "duration";
  const perHour = isService && item.priceMode === "per_unit";

  const selected = item.variants.find((v) => v.id === variantId);
  const itemImages: PublicVariantImage[] = item.images.map((url) => ({
    url,
    stock: null,
  }));
  // Gallery: the selected variant's images, else the item's main images,
  // else fall back to any variant image so the page is never blank. Sold-out
  // photos (stock 0) are pushed to the end but still shown.
  const gallery = orderGallery(
    selected && selected.images.length > 0
      ? selected.images
      : itemImages.length > 0
        ? itemImages
        : item.variants.flatMap((v) => v.images),
  );

  function pickVariant(id: string) {
    setVariantId(id);
    setActive(0);
  }

  const shownPrice = selected ? selected.price : item.price;
  const shownStock = selected ? selected.stock : item.totalStock;
  const lowStock = item.tracksStock && shownStock >= 1 && shownStock <= 5;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
      <ProductGallery
        images={gallery}
        alt={item.name}
        active={active}
        onSelect={setActive}
      />

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold leading-tight">{item.name}</h1>

        <p className="text-2xl font-bold">
          {!selected && item.variants.length > 1 ? "desde " : ""}
          {fmt.format(Number(shownPrice))}
          {perHour ? (
            <span className="text-muted-foreground text-base font-normal">
              {" "}
              /hora
            </span>
          ) : null}
        </p>

        {isService && item.durationMinutes > 0 && (
          <p className="text-muted-foreground text-sm">
            Duración aproximada: {item.durationMinutes} min
          </p>
        )}

        {item.variants.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {isService ? "Tarifas" : "Variantes"}
            </p>
            <VariantPicker
              variants={item.variants}
              tracksStock={item.tracksStock}
              value={variantId}
              onChange={pickVariant}
            />
          </div>
        )}

        {lowStock && (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
            ¡Solo {shownStock === 1 ? "queda 1 unidad" : `quedan ${shownStock} unidades`}!
          </p>
        )}

        {item.description && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Descripción
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {item.description}
            </p>
          </div>
        )}
      </div>

      <SelectionSummary
        item={item}
        variant={selected}
        photo={gallery[active]}
        currency={currency}
      />
    </div>
  );
}
