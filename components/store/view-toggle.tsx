"use client";

import { LayoutGrid, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setParams } from "./set-params";

export type StoreView = "grid" | "list";

/** Grid/list switch for the store listing; persists `view` in the URL. */
export function ViewToggle() {
  const params = useSearchParams();
  const view: StoreView = params.get("view") === "list" ? "list" : "grid";

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="icon"
        variant={view === "grid" ? "secondary" : "ghost"}
        aria-label="Vista de cuadrícula"
        aria-pressed={view === "grid"}
        onClick={() => setParams(params, { view: null })}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={view === "list" ? "secondary" : "ghost"}
        aria-label="Vista de lista"
        aria-pressed={view === "list"}
        onClick={() => setParams(params, { view: "list" })}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
