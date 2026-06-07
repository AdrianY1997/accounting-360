"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Variant = {
  id: string;
  name: string;
  price: string;
  stock: number;
  images: string[];
};
type Item = {
  id: string;
  name: string;
  price: string;
  tracksStock: boolean;
  images: string[];
  variants: Variant[];
};

const ALL = "__all__";

export function ProductCard({
  item,
  currency,
}: {
  item: Item;
  currency: string;
}) {
  const fmt = useMemo(
    () => new Intl.NumberFormat("es", { style: "currency", currency }),
    [currency],
  );
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState<string>(ALL);
  const [active, setActive] = useState(0);

  const selected = item.variants.find((v) => v.id === variantId);
  // Gallery: the selected variant's images, else the item's main images,
  // else fall back to any variant image so the card is never blank.
  const gallery =
    selected && selected.images.length > 0
      ? selected.images
      : item.images.length > 0
        ? item.images
        : item.variants.flatMap((v) => v.images);
  const cover = item.images[0] ?? item.variants.find((v) => v.images[0])?.images[0];

  function pickVariant(id: string) {
    setVariantId(id);
    setActive(0);
  }

  const shownPrice = selected ? selected.price : item.price;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent/40 overflow-hidden rounded-lg border text-left transition-colors"
        >
          <div className="bg-muted aspect-square">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={item.name} className="size-full object-cover" />
            ) : null}
          </div>
          <div className="space-y-0.5 p-3">
            <p className="font-medium leading-tight">{item.name}</p>
            <p className="text-sm">
              {item.variants.length > 1 ? "desde " : ""}
              {fmt.format(Number(item.price))}
            </p>
            {item.tracksStock && (
              <p className="text-muted-foreground text-xs">
                {item.variants.reduce((a, v) => a + v.stock, 0)} disponibles
              </p>
            )}
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted aspect-square overflow-hidden rounded-md">
          {gallery[active] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gallery[active]}
              alt={item.name}
              className="size-full object-contain"
            />
          ) : null}
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                className={`size-14 shrink-0 overflow-hidden rounded border ${
                  i === active ? "ring-primary ring-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <p className="text-lg font-semibold">{fmt.format(Number(shownPrice))}</p>

        {item.variants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.variants.length > 1 && (
              <button
                type="button"
                onClick={() => pickVariant(ALL)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  variantId === ALL ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                Todas
              </button>
            )}
            {item.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => pickVariant(v.id)}
                disabled={item.tracksStock && v.stock <= 0}
                className={`rounded-full border px-3 py-1 text-sm disabled:opacity-40 ${
                  variantId === v.id ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {v.name}
                {item.tracksStock ? ` (${v.stock})` : ""}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
