"use client";

import { isNew } from "@/lib/utils";
import type { PublicVariantImage } from "@/services/public";

/** Sold-out photos (stock === 0) move to the end, in-stock/untracked first. */
export function orderGallery(images: PublicVariantImage[]): PublicVariantImage[] {
  return [...images].sort((a, b) => {
    const aOut = a.stock === 0 ? 1 : 0;
    const bOut = b.stock === 0 ? 1 : 0;
    return aOut - bOut;
  });
}

/**
 * Controlled product gallery: main image plus thumbnail strip. Sold-out
 * photos render faded with an "Agotado" badge but stay selectable.
 */
export function ProductGallery({
  images,
  alt,
  active,
  onSelect,
}: {
  images: PublicVariantImage[];
  alt: string;
  active: number;
  onSelect: (index: number) => void;
}) {
  const current = images[active];

  return (
    <div className="space-y-2">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={alt}
            className={`size-full object-contain ${current.stock === 0 ? "opacity-40" : ""}`}
          />
        ) : null}
        {current?.stock === 0 && (
          <span className="bg-destructive text-destructive-foreground absolute right-2 top-2 rounded px-2 py-1 text-sm font-semibold shadow">
            Agotado
          </span>
        )}
        {current && current.stock !== 0 && isNew(current.createdAt) && (
          <span className="absolute right-2 top-2 rounded bg-blue-600 px-2 py-1 text-sm font-semibold text-white shadow">
            Nuevo
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => onSelect(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded border ${
                i === active ? "ring-primary ring-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className={`size-full object-cover ${img.stock === 0 ? "opacity-40" : ""}`}
              />
              {img.stock === 0 && (
                <span className="bg-destructive/90 absolute inset-x-0 bottom-0 text-center text-[9px] font-semibold leading-tight text-white">
                  Agotado
                </span>
              )}
              {img.stock !== 0 && isNew(img.createdAt) && (
                <span className="absolute right-0.5 top-0.5 rounded bg-blue-600 px-1 text-[9px] font-semibold leading-tight text-white">
                  N
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
