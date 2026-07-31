"use client";

import { LayoutGrid } from "lucide-react";
import { isNew } from "@/lib/utils";
import type { PublicVariant } from "@/services/public";
import { PhotoBadges } from "./photo-badges";

export const ALL_VARIANTS = "__all__";

/**
 * Variant picker as photo swatches (image + label) instead of text pills —
 * the tap target visibly looks like "an option with a picture," so shoppers
 * who wouldn't think to click a gallery thumbnail still see an obvious way
 * to switch. "Todas" gets a neutral icon in place of a photo. Disabled
 * (out-of-tracked-stock) swatches show an "Agotado" ribbon, matching the
 * gallery's own sold-out styling.
 */
export function VariantPicker({
  variants,
  tracksStock,
  value,
  onChange,
}: {
  variants: PublicVariant[];
  tracksStock: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  if (variants.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {variants.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(ALL_VARIANTS)}
          className={`flex w-20 flex-col items-center gap-1 rounded-lg border-2 p-1 transition-colors ${
            value === ALL_VARIANTS ? "border-primary" : "border-transparent"
          }`}
        >
          <span className="bg-muted text-muted-foreground grid size-16 place-items-center rounded-md border">
            <LayoutGrid className="size-6" />
          </span>
          <span
            className={`line-clamp-2 text-center text-[11px] leading-tight ${
              value === ALL_VARIANTS ? "text-primary font-semibold" : "font-medium"
            }`}
          >
            Todas
          </span>
        </button>
      )}
      {variants.map((v) => {
        const photo = v.images[0];
        const soldOut = tracksStock && v.stock <= 0;
        const selected = value === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            disabled={soldOut}
            className={`flex w-20 flex-col items-center gap-1 rounded-lg border-2 p-1 transition-colors disabled:opacity-40 ${
              selected ? "border-primary" : "border-transparent"
            }`}
          >
            <span className="bg-muted relative size-16 overflow-hidden rounded-md border">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-muted-foreground grid size-full place-items-center text-lg font-semibold">
                  {v.name.charAt(0).toUpperCase()}
                </span>
              )}
              <PhotoBadges
                soldOut={soldOut}
                isNewPhoto={isNew(v.createdAt)}
                aiKind={photo?.aiKind}
              />
            </span>
            <span
              className={`line-clamp-2 text-center text-[11px] leading-tight ${
                selected ? "text-primary font-semibold" : "font-medium"
              }`}
            >
              {v.name}
            </span>
            {tracksStock && !soldOut && (
              <span className="text-muted-foreground text-[10px] leading-none">
                {v.stock} disp.
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
