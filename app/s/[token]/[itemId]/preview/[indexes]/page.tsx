import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ModelPreview } from "@/components/store/model-preview";
import { buildModelGallery, parsePreviewIndexes } from "@/lib/model-gallery";
import { publicStoreByResellerToken } from "@/services/public";

type Props = {
  params: Promise<{ token: string; itemId: string; indexes: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token, itemId } = await params;
  const result = await publicStoreByResellerToken(token);
  const item = result?.store.items.find((i) => i.id === itemId);
  if (!result || !item) return {};
  return {
    title: `Selección · ${item.name} · ${result.store.company}`,
    robots: { index: false, follow: false },
  };
}

export default async function ResellerModelPreviewPage({ params }: Props) {
  const { token, itemId, indexes } = await params;
  const result = await publicStoreByResellerToken(token);
  const item = result?.store.items.find((i) => i.id === itemId);
  if (!result || !item) notFound();
  const { store, showPrices } = result;

  const gallery = buildModelGallery(item);
  const selected = parsePreviewIndexes(indexes, gallery.length);
  if (selected.length === 0) redirect(`/s/${token}/${itemId}`);

  return (
    <ModelPreview
      store={store}
      item={item}
      selected={selected}
      hidePrices={!showPrices}
    />
  );
}
