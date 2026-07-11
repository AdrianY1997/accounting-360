"use client";

import { isNew } from "@/lib/utils";
import type { PublicVariant } from "@/services/public";

export const ALL_VARIANTS = "__all__";

/**
 * Variant chips: "Todas" plus one per variant with its stock count; chips
 * with tracked stock at 0 are disabled.
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
    <div className="flex flex-wrap gap-2">
      {variants.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(ALL_VARIANTS)}
          className={`rounded-full border px-3 py-1 text-sm ${
            value === ALL_VARIANTS ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          Todas
        </button>
      )}
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          disabled={tracksStock && v.stock <= 0}
          className={`rounded-full border px-3 py-1 text-sm disabled:opacity-40 ${
            value === v.id ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          {v.name}
          {tracksStock ? ` (${v.stock})` : ""}
          {isNew(v.createdAt) && (
            <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Nuevo
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
