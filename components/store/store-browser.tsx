"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { categoryLabel, descendantsAndSelf } from "@/lib/categories";
import type { PublicCategory, PublicItem } from "@/services/public";
import { ProductCard } from "./product-card";
import { setParams } from "./set-params";
import { StoreFilters } from "./store-filters";
import { ViewToggle } from "./view-toggle";

type Filters = {
  q: string;
  cat: string;
  min: string;
  max: string;
  stock: boolean;
  type: string;
};

function filterItems(
  items: PublicItem[],
  categories: PublicCategory[],
  f: Filters,
): PublicItem[] {
  const q = f.q.trim().toLowerCase();
  const min = f.min ? Number(f.min) : null;
  const max = f.max ? Number(f.max) : null;
  // Selecting a parent category also matches its subcategories (top-down).
  const catIds = f.cat ? descendantsAndSelf(categories, f.cat) : null;
  const catText = new Map(
    categories.map((c) => [c.id, categoryLabel(categories, c.id).toLowerCase()]),
  );
  const matchesQ = (it: PublicItem) =>
    it.name.toLowerCase().includes(q) ||
    (it.sku?.toLowerCase().includes(q) ?? false) ||
    it.variants.some((v) => v.sku?.toLowerCase().includes(q)) ||
    (it.categoryId ? (catText.get(it.categoryId)?.includes(q) ?? false) : false);
  return items.filter((it) => {
    if (q && !matchesQ(it)) return false;
    if (catIds && (!it.categoryId || !catIds.has(it.categoryId))) return false;
    if (f.type === "service" && it.measureType !== "duration") return false;
    if (f.type === "product" && it.measureType === "duration") return false;
    const price = Number(it.price);
    if (min !== null && !Number.isNaN(min) && price < min) return false;
    if (max !== null && !Number.isNaN(max) && price > max) return false;
    if (f.stock && it.tracksStock && it.totalStock <= 0) return false;
    return true;
  });
}

/**
 * Client-side filtered store listing: filter bar + view toggle + result
 * count, rendering ProductCards in grid or list layout. State lives in the
 * URL query (q, cat, min, max, stock, view).
 */
export function StoreBrowser({
  items,
  categories,
  currency,
  salonId,
}: {
  items: PublicItem[];
  categories: PublicCategory[];
  currency: string;
  salonId: string;
}) {
  const params = useSearchParams();
  const view = params.get("view") === "list" ? "list" : "grid";
  const filtered = filterItems(items, categories, {
    q: params.get("q") ?? "",
    cat: params.get("cat") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    stock: params.get("stock") === "1",
    type: params.get("type") ?? "",
  });
  const categoryName = (id: string | null) =>
    id ? categoryLabel(categories, id) || null : null;
  const hasServices = items.some((it) => it.measureType === "duration");
  const hasProducts = items.some((it) => it.measureType !== "duration");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <StoreFilters
          categories={categories}
          showTypeFilter={hasServices && hasProducts}
        />
        <ViewToggle />
      </div>

      <p className="text-muted-foreground text-sm">
        {filtered.length === 1
          ? "1 resultado"
          : `${filtered.length} resultados`}
      </p>

      {filtered.length === 0 ? (
        <div className="space-y-3 py-16 text-center">
          <p className="text-muted-foreground">
            No hay resultados que coincidan con los filtros.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setParams(params, {
                q: null,
                cat: null,
                min: null,
                max: null,
                stock: null,
                type: null,
              })
            }
          >
            Limpiar filtros
          </Button>
        </div>
      ) : view === "list" ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              currency={currency}
              salonId={salonId}
              view="list"
              categoryName={categoryName(item.categoryId)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              currency={currency}
              salonId={salonId}
              view="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
}
