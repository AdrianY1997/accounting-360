import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreBrowser } from "@/components/store/store-browser";
import { publicStoreByResellerToken } from "@/services/public";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await publicStoreByResellerToken(token);
  if (!result) return {};
  const { store } = result;
  return {
    title: `${store.company} — Catálogo`,
    description: `Catálogo de ${store.company} · ${store.salon}`,
    robots: { index: false, follow: false },
  };
}

export default async function ResellerStorePage({ params }: Props) {
  const { token } = await params;
  const result = await publicStoreByResellerToken(token);
  if (!result) notFound();
  const { store, showPrices } = result;

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
      salonId=""
      basePath={`/s/${token}`}
      hidePrices={!showPrices}
    />
  );
}
