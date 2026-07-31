"use client";

import { Sparkles } from "lucide-react";
import { aiKindDisclosures, type AiKind } from "@/lib/ai-images";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Overlay badges for a store photo tile: sold-out ribbon, "Nuevo"/"N" marker,
 * and the AI-disclosure tooltip — shared by the gallery (main image +
 * thumbnails), the listing card and the variant picker so the three no
 * longer drift independently. Absolutely positioned; wrap in a `relative`
 * container. `size="md"` is the main-image/card-cover scale, `"sm"` the
 * thumbnail/swatch scale.
 */
export function PhotoBadges({
  soldOut,
  isNewPhoto,
  aiKind,
  size = "sm",
}: {
  soldOut?: boolean;
  isNewPhoto?: boolean;
  aiKind?: AiKind | null;
  size?: "sm" | "md";
}) {
  const big = size === "md";
  return (
    <>
      {soldOut && (
        <span
          className={
            big
              ? "bg-destructive text-destructive-foreground absolute right-2 top-2 rounded px-2 py-1 text-sm font-semibold shadow"
              : "bg-destructive/90 absolute inset-x-0 bottom-0 text-center text-[9px] font-semibold leading-tight text-white"
          }
        >
          Agotado
        </span>
      )}
      {!soldOut && isNewPhoto && (
        <span
          className={
            big
              ? "absolute right-2 top-2 rounded bg-blue-600 px-2 py-1 text-sm font-semibold text-white shadow"
              : "absolute right-0.5 top-0.5 rounded bg-blue-600 px-1 text-[9px] font-semibold leading-tight text-white"
          }
        >
          {big ? "Nuevo" : "N"}
        </span>
      )}
      {aiKind && (
        <Tooltip>
          <TooltipTrigger>
            <span
              className={
                big
                  ? "absolute bottom-2 left-2 inline-flex cursor-help items-center gap-1 rounded bg-black/60 px-1.5 py-1 text-xs font-medium text-white"
                  : "absolute bottom-0.5 left-0.5 inline-flex cursor-help items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-white"
              }
            >
              <Sparkles className={big ? "size-3.5" : "size-2.5"} />
              {big && "IA"}
            </span>
          </TooltipTrigger>
          <TooltipContent>{aiKindDisclosures[aiKind]}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
