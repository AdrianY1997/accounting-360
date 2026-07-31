"use client";

import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import { buildModelGallery } from "@/lib/model-gallery";
import { buildOrderMessage } from "@/lib/store-order-message";
import { getStoreType } from "@/lib/store-types";
import { isNew } from "@/lib/utils";
import type { PublicCategory, PublicItem } from "@/services/public";
import { DetailTabs, type DetailTab } from "./detail-tabs";
import { ModelSelector } from "./model-selector";
import { ShareButtons } from "./share-buttons";
import { waHref } from "./whatsapp-link";

/**
 * Detail-page orchestrator: "elige tu modelo" grid (items with more than one
 * combined photo) or a minimal fallback (services / simple items), tabs,
 * share row and a fixed "Pedir por WhatsApp" bar. No cart — informational
 * only, the WhatsApp message is the actual order.
 */
export function ProductDetail({
  item,
  currency,
  categoryPath,
  storeTypeId,
  shippingInfo,
  whatsapp,
  salonId,
  itemId,
  basePath,
  hidePrices = false,
}: {
  item: PublicItem;
  currency: string;
  categoryPath: PublicCategory[];
  storeTypeId: string;
  shippingInfo: string | null;
  whatsapp: string | null;
  salonId: string;
  itemId: string;
  /** Detail-link base — reseller links use `/s/<token>` so the salonId never leaks. */
  basePath?: string;
  /** Priceless mode (reseller share links) — the data has no prices either. */
  hidePrices?: boolean;
}) {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const isService = item.measureType === "duration";
  const perHour = isService && item.priceMode === "per_unit";
  const template = getStoreType(storeTypeId);

  // Flat, numbered gallery ("Modelo #1..#N") — main photos plus every
  // variant's, no filter by variant name. Items with 0-1 combined photos
  // (most services) get the minimal fallback instead of the selector.
  const gallery = buildModelGallery(item);
  const hasSelector = gallery.length > 1;
  const cover = gallery[0] ?? null;
  const showFixedBar = hasSelector && !!whatsapp;

  function toggleIndex(i: number) {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function sendOrder() {
    if (!whatsapp) return;
    const sorted = [...selectedIndexes].sort((a, b) => a - b);
    const previewUrl = `${window.location.origin}${
      basePath ?? `/store/${salonId}`
    }/${itemId}/preview/${sorted.join(",")}`;
    const message = buildOrderMessage({
      item,
      gallery,
      selectedIndexes: sorted,
      previewUrl,
      currency,
      hidePrices,
    });
    window.open(waHref(whatsapp, message), "_blank", "noopener");
  }

  // Item-level price/availability — no longer reactive to the selection:
  // with multi-select there's no single "chosen" variant to react to, so
  // this always shows the same base info as the listing card. Each model's
  // own price still appears in its own line of the WhatsApp message.
  const soldOut = item.tracksStock && item.totalStock === 0;
  const discountPct = item.compareAtPrice
    ? Math.round((1 - Number(item.price) / Number(item.compareAtPrice)) * 100)
    : 0;

  const categoryText = item.categoryId
    ? categoryLabel(categoryPath, item.categoryId) ||
      categoryPath.map((c) => c.name).join(" > ")
    : null;

  // text-kind attributes become chips (header) + detail rows; longtext ones
  // become their own tab.
  const textAttrs = template.attributes.filter(
    (a) => a.kind === "text" && item.attributes[a.key],
  );
  const longAttrs = template.attributes.filter(
    (a) => a.kind === "longtext" && item.attributes[a.key],
  );

  // A single variant's identity never depends on which photo got picked, so
  // it's still safe to show as a static row. With several, "the" variant is
  // ambiguous under multi-select — see the WhatsApp message for the
  // per-model breakdown instead.
  const soleVariant = item.variants.length === 1 ? item.variants[0] : undefined;

  const detailRows: { label: string; value: React.ReactNode }[] = [
    ...(isService || soleVariant
      ? [
          {
            label: isService ? "Tarifa" : "Variante",
            value: soleVariant?.name ?? "—",
          },
        ]
      : []),
    ...textAttrs.map((a) => ({
      label: a.label,
      value: item.attributes[a.key],
    })),
    {
      label: "Ref / SKU",
      value: (
        <span className="font-mono text-xs">
          {soleVariant?.sku ?? item.sku ?? "—"}
        </span>
      ),
    },
    ...(categoryText ? [{ label: "Categoría", value: categoryText }] : []),
    ...(isService && item.durationMinutes > 0
      ? [{ label: "Duración", value: `~${item.durationMinutes} min` }]
      : []),
  ];

  const descriptionContent = (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-sm leading-relaxed">
        {item.description || (
          <span className="text-muted-foreground italic">Sin descripción</span>
        )}
      </p>
      {item.features.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {item.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const tabs: DetailTab[] = [
    { id: "descripcion", label: "Descripción", content: descriptionContent },
    {
      id: "detalles",
      label: "Detalles",
      content: (
        <dl className="grid gap-2 text-sm sm:max-w-md">
          {detailRows.map((r) => (
            <div
              key={r.label}
              className="flex items-start justify-between gap-4"
            >
              <dt className="text-muted-foreground shrink-0">{r.label}</dt>
              <dd className="min-w-0 wrap-break-word text-right font-medium">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    ...longAttrs.map((a) => ({
      id: a.key,
      label: a.label,
      content: (
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {item.attributes[a.key]}
        </p>
      ),
    })),
  ];

  return (
    <div className={showFixedBar ? "space-y-8 rounded-lg pb-24" : "space-y-8 rounded-lg"}>
      <div className="space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight capitalize">
            {item.name}
          </h1>
          {isNew(item.createdAt) && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              Nuevo
            </Badge>
          )}
        </div>

        {!hidePrices && (
          <p className="flex flex-wrap items-baseline gap-2 text-2xl font-bold">
            <span>
              {item.variants.length > 1 ? "Desde " : ""}
              {fmt.format(Number(item.price))}
            </span>
            {item.compareAtPrice && (
              <span className="text-muted-foreground text-base font-normal line-through">
                {fmt.format(Number(item.compareAtPrice))}
              </span>
            )}
            {item.compareAtPrice && discountPct > 0 && (
              <Badge className="bg-pink-600 text-white">-{discountPct}%</Badge>
            )}
            {perHour ? (
              <span className="text-muted-foreground text-base font-normal">
                {" "}
                /hora
              </span>
            ) : null}
          </p>
        )}

        {item.tracksStock &&
          (soldOut ? (
            <Badge variant="destructive">Agotado</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              Disponible
            </Badge>
          ))}

        {textAttrs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {textAttrs.map((a) => (
              <span
                key={a.key}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                <Tag className="size-3" />
                {a.label}: {item.attributes[a.key]}
              </span>
            ))}
          </div>
        )}

        {item.summary && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.summary}
          </p>
        )}

        {hasSelector ? (
          <>
            <div className="rounded-lg border border-pink-200 bg-pink-50 p-3 text-sm text-pink-800">
              ✨ Selecciona tus diseños favoritos. Cuando termines, escríbenos
              por WhatsApp y confirmaremos disponibilidad.
            </div>
            <ModelSelector
              images={gallery}
              selected={selectedIndexes}
              onToggle={toggleIndex}
            />
          </>
        ) : (
          cover && (
            <div className="bg-muted relative aspect-square max-w-sm overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover.url}
                alt={item.name}
                className="size-full object-contain"
              />
            </div>
          )
        )}
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row">
        <DetailTabs tabs={tabs} />

        <ShareButtons whatsapp={whatsapp} itemName={item.name} />
      </div>

      {showFixedBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-lg">
          <div className="mx-auto max-w-6xl px-2 sm:px-4">
            {selectedIndexes.size === 0 ? (
              <button
                type="button"
                disabled
                className="w-full rounded-lg bg-neutral-200 py-3 text-center text-sm font-semibold text-neutral-500"
              >
                SELECCIONA UN MODELO
              </button>
            ) : (
              <button
                type="button"
                onClick={sendOrder}
                className="w-full rounded-lg bg-green-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                PEDIR {selectedIndexes.size} MODELO
                {selectedIndexes.size > 1 ? "S" : ""} POR WHATSAPP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
