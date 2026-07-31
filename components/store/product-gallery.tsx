"use client";

import { isNew } from "@/lib/utils";
import type { PublicVariantImage } from "@/services/public";
import { PhotoBadges } from "./photo-badges";

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
    <div className="min-w-0 max-w-full space-y-2">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={alt}
            className={`size-full object-contain ${current.stock === 0 ? "opacity-40" : ""}`}
          />
        ) : null}
        {current && (
          <PhotoBadges
            soldOut={current.stock === 0}
            isNewPhoto={isNew(current.createdAt)}
            aiKind={current.aiKind}
            size="md"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
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
              <PhotoBadges
                soldOut={img.stock === 0}
                isNewPhoto={isNew(img.createdAt)}
                aiKind={img.aiKind}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
