import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { publicStore } from "@/services/public";

export default async function StorePage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const store = await publicStore(salonId);
  if (!store) notFound();

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
          {store.items.map((item) => (
            <ProductCard key={item.id} item={item} currency={store.currency} />
          ))}
        </div>
      )}

      <footer className="text-muted-foreground pt-6 text-center text-xs">
        Catálogo en línea · {store.company}
      </footer>
    </main>
  );
}
