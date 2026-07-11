import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PublicItem } from "@/services/public";
import type { StoreView } from "./view-toggle";
import { cn, isNew } from "@/lib/utils";

/**
 * Store listing card linking to the item detail page. `view` switches between
 * the square grid card and a horizontal list row.
 */
export function ProductCard({
  item,
  currency,
  salonId,
  view = "grid",
  categoryName,
}: {
  item: PublicItem;
  currency: string;
  salonId: string;
  view?: StoreView;
  categoryName?: string | null;
}) {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const cover = item.cover;
  const soldOut = item.tracksStock && item.totalStock === 0;
  const isService = item.measureType === "duration";
  const perHour = isService && item.priceMode === "per_unit";
  const href = `/store/${salonId}/${item.id}`;
  const isNewItem = isNew(item.createdAt);

  const priceLine = (
    <p className="text-sm font-semibold">
      {item.variants.length > 1 ? "Desde " : ""}
      {fmt.format(Number(item.price))}
      {perHour ? (
        <span className="text-muted-foreground font-normal"> /hora</span>
      ) : null}
    </p>
  );
  const durationLine =
    isService && item.durationMinutes > 0 ? (
      <p className="text-muted-foreground text-xs">
        ~{item.durationMinutes} min
      </p>
    ) : null;

  if (view === "list") {
    return (
      <Link
        href={href}
        className="bg-card hover:border-primary flex gap-3 overflow-hidden rounded-lg border p-3 transition-colors"
      >
        <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-md sm:size-28">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={item.name}
              className={`size-full object-cover ${soldOut ? "opacity-40" : ""}`}
            />
          ) : null}
        </div>
        <div className="min-w-0 space-y-0.5 self-center">
          <p className="flex items-center gap-1.5 font-medium leading-tight">
            <span className="truncate">{item.name}</span>
            {isNewItem && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                Nuevo
              </Badge>
            )}
          </p>
          {categoryName && (
            <p className="text-muted-foreground text-xs">{categoryName}</p>
          )}
          {priceLine}
          {durationLine}
          {item.tracksStock &&
            (soldOut ? (
              <Badge variant="destructive">Agotado</Badge>
            ) : (
              <p className="text-muted-foreground text-xs">
                {item.totalStock} disponibles
              </p>
            ))}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="bg-card block hover:border-primary overflow-hidden rounded-lg border transition-colors"
    >
      <div className="bg-muted relative aspect-square">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.name}
            className={`size-full object-cover ${soldOut ? "opacity-40" : ""}`}
          />
        ) : null}
        {soldOut && (
          <Badge
            variant="destructive"
            className="absolute right-2 top-2 shadow"
          >
            Agotado
          </Badge>
        )}
        {!soldOut && isNewItem && (
          <Badge className="absolute right-2 top-2 bg-blue-600 text-white shadow">
            Nuevo
          </Badge>
        )}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="font-medium leading-tight truncate">{item.name}</p>
        {priceLine}
        {durationLine}
        {item.tracksStock && (
          <p
            className={cn(
              "text-muted-foreground text-xs",
              soldOut && "text-red-500",
            )}
          >
            {soldOut ? "Agotado" : `${item.totalStock} disponibles`}
          </p>
        )}
      </div>
    </Link>
  );
}
