import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProductDetail } from "@/components/store/product-detail";
import { Recommendations } from "@/components/store/recommendations";
import { publicStoreItem } from "@/services/public";

type Props = { params: Promise<{ salonId: string; itemId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonId, itemId } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) return {};
  return {
    title: `${result.item.name} · ${result.store.company}`,
    description:
      result.item.summary ??
      result.item.description ??
      `${result.item.name} — ${result.store.company}`,
  };
}

export default async function StoreItemPage({ params }: Props) {
  const { salonId, itemId } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) notFound();
  const { store, item, categoryPath } = result;
  const leaf = categoryPath[categoryPath.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/store/${salonId}`}>Tienda</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {categoryPath.map((c) => (
              <span key={c.id} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/store/${salonId}?cat=${c.id}`}>{c.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </span>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[45vw] truncate sm:max-w-xs">
                {item.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href={leaf ? `/store/${salonId}?cat=${leaf.id}` : `/store/${salonId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          {leaf ? `Volver a ${leaf.name}` : "Volver a la tienda"}
        </Link>
      </div>

      <ProductDetail
        item={item}
        currency={store.currency}
        categoryPath={categoryPath}
        storeTypeId={store.storeType}
        shippingInfo={store.shippingInfo}
        whatsapp={store.whatsapp}
      />

      <Recommendations store={store} item={item} salonId={salonId} />
    </div>
  );
}
