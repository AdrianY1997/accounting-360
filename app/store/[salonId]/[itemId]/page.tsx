import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProductDetail } from "@/components/store/product-detail";
import { publicStoreItem } from "@/services/public";

type Props = { params: Promise<{ salonId: string; itemId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonId, itemId } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) return {};
  return {
    title: `${result.item.name} · ${result.store.company}`,
    description:
      result.item.description ??
      `${result.item.name} — ${result.store.company}`,
  };
}

export default async function StoreItemPage({ params }: Props) {
  const { salonId, itemId } = await params;
  const result = await publicStoreItem(salonId, itemId);
  if (!result) notFound();
  const { store, item, categoryName } = result;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/store/${salonId}`}>Tienda</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {categoryName && item.categoryId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/store/${salonId}?cat=${item.categoryId}`}>
                    {categoryName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProductDetail item={item} currency={store.currency} />
    </div>
  );
}
