import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PublicItem } from "@/services/public";
import type { StoreView } from "./view-toggle";

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
  const cover =
    item.images[0] ?? item.variants.find((v) => v.images[0])?.images[0]?.url;
  const soldOut = item.tracksStock && item.totalStock === 0;
  const href = `/store/${salonId}/${item.id}`;

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
          <p className="font-medium leading-tight">{item.name}</p>
          {categoryName && (
            <p className="text-muted-foreground text-xs">{categoryName}</p>
          )}
          <p className="text-sm font-semibold">
            {item.variants.length > 1 ? "desde " : ""}
            {fmt.format(Number(item.price))}
          </p>
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
      className="bg-card hover:border-primary overflow-hidden rounded-lg border transition-colors"
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
          <Badge variant="destructive" className="absolute right-2 top-2 shadow">
            Agotado
          </Badge>
        )}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="font-medium leading-tight">{item.name}</p>
        <p className="text-sm font-semibold">
          {item.variants.length > 1 ? "desde " : ""}
          {fmt.format(Number(item.price))}
        </p>
        {item.tracksStock && !soldOut && (
          <p className="text-muted-foreground text-xs">
            {item.totalStock} disponibles
          </p>
        )}
      </div>
    </Link>
  );
}
