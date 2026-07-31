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
import { categoryPath } from "@/lib/categories";
import { publicStoreByResellerToken } from "@/services/public";

type Props = { params: Promise<{ token: string; itemId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token, itemId } = await params;
  const result = await publicStoreByResellerToken(token);
  const item = result?.store.items.find((i) => i.id === itemId);
  if (!result || !item) return {};
  return {
    title: `${item.name} · ${result.store.company}`,
    description:
      item.summary ?? item.description ?? `${item.name} — ${result.store.company}`,
    robots: { index: false, follow: false },
  };
}

export default async function ResellerStoreItemPage({ params }: Props) {
  const { token, itemId } = await params;
  const result = await publicStoreByResellerToken(token);
  const item = result?.store.items.find((i) => i.id === itemId);
  if (!result || !item) notFound();
  const { store, showPrices } = result;
  const path = item.categoryId
    ? categoryPath(store.categories, item.categoryId)
    : [];
  const leaf = path[path.length - 1];
  const base = `/s/${token}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={base}>Tienda</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {path.map((c) => (
              <span key={c.id} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`${base}?cat=${c.id}`}>{c.name}</Link>
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
          href={leaf ? `${base}?cat=${leaf.id}` : base}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          {leaf ? `Volver a ${leaf.name}` : "Volver a la tienda"}
        </Link>
      </div>

      <ProductDetail
        item={item}
        currency={store.currency}
        categoryPath={path}
        storeTypeId={store.storeType}
        shippingInfo={store.shippingInfo}
        whatsapp={store.whatsapp}
        salonId=""
        itemId={itemId}
        basePath={base}
        hidePrices={!showPrices}
      />

      <Recommendations
        store={store}
        item={item}
        salonId=""
        basePath={base}
        hidePrices={!showPrices}
      />
    </div>
  );
}
