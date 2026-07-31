"use client";

import { Check } from "lucide-react";
import { isNew } from "@/lib/utils";
import type { PublicVariantImage } from "@/services/public";
import { PhotoBadges } from "./photo-badges";

/**
 * Flat, numbered "elige tu modelo" grid — replaces the old gallery+variant
 * picker duo. Multi-select (checkbox behavior, not radio): the customer can
 * mark several favorite photos before ordering, so toggling one never clears
 * the others. The number stays visible on a selected tile — the customer
 * needs to keep being able to say "modelo 4" after picking it. Sold-out
 * photos are disabled, not just styled, since there's nothing to order.
 */
export function ModelSelector({
  images,
  selected,
  onToggle,
}: {
  images: PublicVariantImage[];
  selected: Set<number>;
  onToggle: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((img, i) => {
        const soldOut = img.stock === 0;
        const isSelected = selected.has(i);
        return (
          <button
            key={img.url}
            type="button"
            disabled={soldOut}
            onClick={() => onToggle(i)}
            className={`bg-muted relative aspect-square overflow-hidden rounded-lg border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected ? "border-primary ring-primary ring-2" : "border-transparent"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`Modelo ${i + 1}`}
              className={`size-full object-cover ${soldOut ? "opacity-50" : ""}`}
            />
            <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-pink-600 text-xs font-bold text-white shadow">
              {i + 1}
            </span>
            <PhotoBadges
              soldOut={soldOut}
              isNewPhoto={isNew(img.createdAt)}
              aiKind={img.aiKind}
            />
            {isSelected && (
              <span className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-green-600 text-white shadow">
                <Check className="size-4" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
