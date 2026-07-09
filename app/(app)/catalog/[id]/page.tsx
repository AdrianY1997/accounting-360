import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/catalog/product-form";
import { getService, listCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) redirect("/dashboard");
  const { id } = await params;
  const [service, categories, settings] = await Promise.all([
    getService(ctx, id),
    listCategories(ctx),
    getSettings(ctx),
  ]);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/catalog"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Volver al catálogo
        </Link>
        <h1 className="text-2xl font-semibold">
          Editar ítem
          {service.sku && (
            <span className="text-muted-foreground ml-2 font-mono text-base font-normal">
              {service.sku}
            </span>
          )}
        </h1>
      </div>
      <ProductForm
        service={service}
        categories={categories}
        storeType={settings?.storeType ?? "generic"}
      />
    </div>
  );
}
