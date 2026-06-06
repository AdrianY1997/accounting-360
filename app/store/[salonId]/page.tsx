import { notFound } from "next/navigation";
import { publicStore } from "@/services/public";

export default async function StorePage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const store = await publicStore(salonId);
  if (!store) notFound();

  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: store.currency,
  });
  const priceOf = (itemPrice: string, variantPrice: string | null) =>
    fmt.format(Number(variantPrice ?? itemPrice));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">{store.company}</h1>
        <p className="text-muted-foreground">{store.salon}</p>
      </header>

      {store.items.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          No hay productos para mostrar.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {store.items.map((item) => {
            const cover = item.images[0] ?? item.variants.find((v) => v.images[0])?.images[0];
            return (
              <div key={item.id} className="overflow-hidden rounded-lg border">
                <div className="bg-muted aspect-square">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={item.name}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-1 p-3">
                  <p className="font-medium leading-tight">{item.name}</p>
                  <p className="text-sm">
                    {priceOf(item.price, null)}
                    {item.measureType === "duration" &&
                    item.priceMode === "per_unit"
                      ? " /h"
                      : ""}
                  </p>
                  {item.tracksStock && (
                    <p className="text-muted-foreground text-xs">
                      {item.totalStock > 0
                        ? `${item.totalStock} disponibles`
                        : "Agotado"}
                    </p>
                  )}
                  {item.variants.length > 0 && (
                    <ul className="text-muted-foreground space-y-0.5 pt-1 text-xs">
                      {item.variants.map((v) => (
                        <li key={v.id} className="flex justify-between gap-2">
                          <span>{v.name}</span>
                          <span>
                            {priceOf(item.price, v.price)} · {v.stock}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <footer className="text-muted-foreground pt-6 text-center text-xs">
        Catálogo en línea · {store.company}
      </footer>
    </main>
  );
}
