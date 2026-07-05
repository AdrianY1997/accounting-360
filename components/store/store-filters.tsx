"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicCategory } from "@/services/public";
import { setParams } from "./set-params";

const ALL = "__all__";

/**
 * Store listing filters (category, price range, in-stock only), URL-synced
 * via shallow replaceState. Collapsed behind a "Filtros" button on mobile.
 */
export function StoreFilters({
  categories,
  showTypeFilter = false,
}: {
  categories: PublicCategory[];
  /** Show the Productos/Servicios toggle (only when the catalog has both). */
  showTypeFilter?: boolean;
}) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const cat = params.get("cat") ?? "";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const stock = params.get("stock") === "1";
  const type = params.get("type") ?? "";

  const activeCount =
    (cat ? 1 : 0) +
    (min ? 1 : 0) +
    (max ? 1 : 0) +
    (stock ? 1 : 0) +
    (type ? 1 : 0);

  const typeChip = (value: string, label: string) => (
    <button
      type="button"
      aria-pressed={type === value}
      onClick={() =>
        setParams(params, { type: type === value ? null : value })
      }
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        type === value
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );

  const controls = (
    <>
      {showTypeFilter && (
        <div className="flex gap-1.5">
          {typeChip("product", "Productos")}
          {typeChip("service", "Servicios")}
        </div>
      )}
      {categories.length > 0 && (
        <Select
          value={cat || ALL}
          onValueChange={(v) => setParams(params, { cat: v === ALL ? null : v })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Mín"
          value={min}
          onChange={(e) => setParams(params, { min: e.target.value })}
          className="w-20"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Máx"
          value={max}
          onChange={(e) => setParams(params, { max: e.target.value })}
          className="w-20"
        />
      </div>

      <button
        type="button"
        aria-pressed={stock}
        onClick={() => setParams(params, { stock: stock ? null : "1" })}
        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
          stock
            ? "bg-primary text-primary-foreground border-primary"
            : "hover:bg-accent"
        }`}
      >
        Solo disponibles
      </button>

      {activeCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setParams(params, {
              cat: null,
              min: null,
              max: null,
              stock: null,
              type: null,
            })
          }
        >
          <X className="size-4" />
          Limpiar
        </Button>
      )}
    </>
  );

  return (
    <div className="min-w-0 flex-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="sm:hidden"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal className="size-4" />
        Filtros
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1 px-1.5">
            {activeCount}
          </Badge>
        )}
      </Button>

      <div
        className={`${open ? "flex" : "hidden"} mt-2 flex-col gap-2 sm:mt-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center`}
      >
        {controls}
      </div>
    </div>
  );
}
