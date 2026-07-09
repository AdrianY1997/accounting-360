import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/catalog/product-form";
import { listCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export default async function NewProductPage() {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) redirect("/dashboard");
  const [categories, settings] = await Promise.all([
    listCategories(ctx),
    getSettings(ctx),
  ]);

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
        <h1 className="text-2xl font-semibold">Nuevo ítem</h1>
      </div>
      <ProductForm
        categories={categories}
        storeType={settings?.storeType ?? "generic"}
      />
    </div>
  );
}
