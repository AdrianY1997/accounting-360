"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export type DetailTab = { id: string; label: string; content: ReactNode };

/**
 * Lightweight local-state tabs for the store detail page (chip-style buttons
 * matching the filter aesthetic; horizontally scrollable on mobile).
 */
export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="flex-1 space-y-4 rounded-lg border bg-white p-4 shadow">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === current.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "transition-colors border-b px-4 py-2 border-transparent",
              t.id === current.id && "border-pink-500",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </div>
  );
}
