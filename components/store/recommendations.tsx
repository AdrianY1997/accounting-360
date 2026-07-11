import {
  recommendItems,
  type PublicItem,
  type PublicStore,
} from "@/services/public";
import { ProductCard } from "./product-card";

/**
 * "También te puede interesar": related items (same category family + in
 * stock first). Horizontal snap strip on mobile, grid on larger screens.
 */
export function Recommendations({
  store,
  item,
  salonId,
}: {
  store: PublicStore;
  item: PublicItem;
  salonId: string;
}) {
  const related = recommendItems(store, item, 5);
  if (related.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">También te puede interesar</h2>
      <div className="flex max-w-full snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {related.map((r) => (
          // Fixed width on the mobile strip — flex would otherwise squash or
          // overflow the cards; the sm+ grid controls its own sizing.
          <div key={r.id} className="w-40 shrink-0 snap-start sm:w-auto sm:min-w-0">
            <ProductCard
              item={r}
              currency={store.currency}
              salonId={salonId}
              view="grid"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
