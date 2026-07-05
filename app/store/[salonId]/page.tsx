import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreBrowser } from "@/components/store/store-browser";
import { publicStore } from "@/services/public";

type Props = { params: Promise<{ salonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonId } = await params;
  const store = await publicStore(salonId);
  if (!store) return {};
  return {
    title: `${store.company} — Catálogo`,
    description: `Catálogo en línea de ${store.company} · ${store.salon}`,
  };
}

export default async function StorePage({ params }: Props) {
  const { salonId } = await params;
  const store = await publicStore(salonId);
  if (!store) notFound();

  if (store.items.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center">
        No hay productos para mostrar.
      </p>
    );
  }

  return (
    <StoreBrowser
      items={store.items}
      categories={store.categories}
      currency={store.currency}
      salonId={salonId}
    />
  );
}
