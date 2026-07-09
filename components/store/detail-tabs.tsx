"use client";

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
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === current.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              t.id === current.id
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </div>
  );
}
