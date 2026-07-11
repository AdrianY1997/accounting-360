"use client";

import { useState } from "react";
import { Check, StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import { getStoreType } from "@/lib/store-types";
import { isNew } from "@/lib/utils";
import type { PublicCategory, PublicItem } from "@/services/public";
import { DetailTabs, type DetailTab } from "./detail-tabs";
import { orderGallery, ProductGallery } from "./product-gallery";
import { ShareButtons } from "./share-buttons";
import { ALL_VARIANTS, VariantPicker } from "./variant-picker";

/**
 * Detail-page orchestrator: gallery + info column (price, availability,
 * summary, reactive detail rows, variant picker) and full-width sections
 * (tabs, features, share, WhatsApp CTA). No cart — informational only.
 */
export function ProductDetail({
  item,
  currency,
  categoryPath,
  storeTypeId,
  shippingInfo,
  whatsapp,
}: {
  item: PublicItem;
  currency: string;
  categoryPath: PublicCategory[];
  storeTypeId: string;
  shippingInfo: string | null;
  whatsapp: string | null;
}) {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const [variantId, setVariantId] = useState<string>(
    item.variants.length === 1 ? item.variants[0].id : ALL_VARIANTS,
  );
  const [active, setActive] = useState(0);
  const isService = item.measureType === "duration";
  const perHour = isService && item.priceMode === "per_unit";
  const template = getStoreType(storeTypeId);

  const selected = item.variants.find((v) => v.id === variantId);
  // Gallery: the selected variant's images, else the item's main images,
  // else fall back to any variant image so the page is never blank. Sold-out
  // photos (stock 0) are pushed to the end but still shown.
  const gallery = orderGallery(
    selected && selected.images.length > 0
      ? selected.images
      : item.images.length > 0
        ? item.images
        : item.variants.flatMap((v) => v.images),
  );

  function pickVariant(id: string) {
    setVariantId(id);
    setActive(0);
  }

  // With "Todas" active the chosen photo may still belong to one variant —
  // the detail rows then show that variant's exact price, not "desde".
  const activePhoto = gallery[active];
  const photoVariant =
    !selected && activePhoto
      ? item.variants.find((v) =>
          v.images.some((img) => img.url === activePhoto.url),
        )
      : undefined;
  const summaryVariant = selected ?? photoVariant;

  const shownPrice = summaryVariant ? summaryVariant.price : item.price;
  const shownStock = summaryVariant ? summaryVariant.stock : item.totalStock;
  const lowStock = item.tracksStock && shownStock >= 1 && shownStock <= 5;
  // Availability reflects the selected variant (or the item total) — never
  // the active photo — so it stays coherent with the low-stock line below.
  // A sold-out photo still shows its own "Agotado" overlay in the gallery.
  const soldOut = item.tracksStock && shownStock === 0;

  const categoryText = item.categoryId
    ? categoryLabel(categoryPath, item.categoryId) ||
      categoryPath.map((c) => c.name).join(" > ")
    : null;

  // text-kind attributes become detail rows; longtext ones become tabs.
  const textAttrs = template.attributes.filter(
    (a) => a.kind === "text" && item.attributes[a.key],
  );
  const longAttrs = template.attributes.filter(
    (a) => a.kind === "longtext" && item.attributes[a.key],
  );

  const detailRows: { label: string; value: React.ReactNode }[] = [
    {
      label: isService ? "Tarifa" : "Variante",
      value: summaryVariant ? summaryVariant.name : "Todas",
    },
    ...textAttrs.map((a) => ({
      label: a.label,
      value: item.attributes[a.key],
    })),
    {
      label: "Ref / SKU",
      value: (
        <span className="font-mono text-xs">
          {summaryVariant?.sku ?? item.sku ?? "—"}
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
    // ...(shippingInfo
    //   ? [
    //       {
    //         id: "envios",
    //         label: "Envíos",
    //         content: (
    //           <p className="whitespace-pre-line text-sm leading-relaxed">
    //             {shippingInfo}
    //           </p>
    //         ),
    //       },
    //     ]
    //   : []),
  ];

  return (
    <div className="space-y-8 rounded-lg">
      {/* minmax(0,1fr): grid items default to min-width auto, so the
          thumbnail strip would otherwise stretch the page sideways. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-white p-4 rounded-lg shadow">
        <ProductGallery
          images={gallery}
          alt={item.name}
          active={active}
          onSelect={setActive}
        />

        <div className="min-w-0 space-y-4">
          <div className="space-y-1">
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

            <div className="">
              <span className="flex items-center gap-1 text-xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="text-neutral-400" size={14} />
                ))}
                (0)
              </span>
              <span className="text-muted-foreground text-xs w-full">
                Reseñas no disponibles
              </span>
            </div>
          </div>

          <p className="text-2xl font-bold">
            {!summaryVariant && item.variants.length > 1 ? "Desde " : ""}
            {fmt.format(Number(shownPrice))}
            {perHour ? (
              <span className="text-muted-foreground text-base font-normal">
                {" "}
                /hora
              </span>
            ) : null}
          </p>

          {item.tracksStock && (
            <div className="flex flex-wrap items-center gap-2">
              {soldOut ? (
                <Badge variant="destructive">Agotado</Badge>
              ) : (
                <>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                    Disponible
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {shownStock === 1
                      ? "1 unidad disponible"
                      : `${shownStock} unidades disponibles`}
                  </span>
                </>
              )}
            </div>
          )}

          {lowStock && !soldOut && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
              ¡Solo{" "}
              {shownStock === 1
                ? "queda 1 unidad"
                : `quedan ${shownStock} unidades`}
              !
            </p>
          )}

          {item.summary && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.summary}
            </p>
          )}

          <dl className="grid gap-2 border-t pt-4 text-sm">
            {detailRows.map((r) => (
              <div
                key={r.label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd className="text-right font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-1.5 border-t pt-4">
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
        </div>
      </div>

      <div className="flex gap-4 justify-between items-stretch flex-col md:flex-row">
        <DetailTabs tabs={tabs} />

        <ShareButtons whatsapp={whatsapp} itemName={item.name} />
      </div>
    </div>
  );
}
