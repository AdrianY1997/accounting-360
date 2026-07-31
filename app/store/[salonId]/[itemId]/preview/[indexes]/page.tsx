import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ModelPreview } from "@/components/store/model-preview";
import { buildModelGallery, parsePreviewIndexes } from "@/lib/model-gallery";
import { publicStoreItem } from "@/services/public";

type Props = {
  params: Promise<{ salonId: string; itemId: string; indexes: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonId, itemId } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) return {};
  return {
    title: `Selección · ${result.item.name} · ${result.store.company}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModelPreviewPage({ params }: Props) {
  const { salonId, itemId, indexes } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) notFound();
  const { store, item } = result;

  const gallery = buildModelGallery(item);
  const selected = parsePreviewIndexes(indexes, gallery.length);
  if (selected.length === 0) redirect(`/store/${salonId}/${itemId}`);

  return <ModelPreview store={store} item={item} selected={selected} />;
}
