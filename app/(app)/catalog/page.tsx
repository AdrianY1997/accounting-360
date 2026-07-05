import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { CategoryFormDialog } from "@/components/catalog/category-form-dialog";
import { ServiceFormDialog } from "@/components/catalog/service-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  imagesForServices,
  listCategories,
  listServices,
  priceFromForServices,
  stockForServices,
} from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { Copy } from "@/components/copy";
import { env } from "@/lib/env";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) redirect("/dashboard");
  const { q, type } = await searchParams;
  const [categories, allServices, settings] = await Promise.all([
    listCategories(ctx),
    listServices(ctx, q),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);

  const services = allServices.filter((s) =>
    type === "products"
      ? s.measureType === "quantity"
      : type === "services"
        ? s.measureType === "duration"
        : true,
  );
  const typeTabs = [
    { value: undefined, label: "Todos" },
    { value: "products", label: "Productos" },
    { value: "services", label: "Servicios" },
  ] as const;
  const tabHref = (value?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("type", value);
    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  const currency = settings?.currency ?? "USD";
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const ids = services.map((s) => s.id);
  const [thumbs, stock, priceFrom] = await Promise.all([
    imagesForServices(ctx, ids),
    stockForServices(ctx, ids),
    priceFromForServices(ctx, ids),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Productos y servicios</h1>
          <div className="flex items-center gap-4">
            <Copy text={`${env.BETTER_AUTH_URL}/store/${ctx.salonId}`} />
            <ServiceFormDialog categories={categories} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Buscar ítem" />
          <div className="flex gap-1">
            {typeTabs.map((t) => (
              <Button
                key={t.label}
                asChild
                size="sm"
                variant={
                  (type ?? undefined) === t.value ? "secondary" : "ghost"
                }
              >
                <Link href={tabHref(t.value)}>{t.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="Aún no hay ítems"
            description="Crea productos o servicios con su precio para venderlos."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Medida</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {thumbs.get(s.id) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbs.get(s.id)}
                            alt=""
                            className="size-8 rounded border object-cover"
                          />
                        ) : null}
                        {s.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.categoryId ? (
                        <Badge variant="secondary">
                          {categoryName.get(s.categoryId) ?? "—"}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {s.measureType === "duration" ? (
                        <Badge variant="outline">
                          {s.priceMode === "per_unit"
                            ? "Servicio · por hora"
                            : "Servicio · fijo"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Producto</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.tracksStock ? (stock.get(s.id) ?? 0) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(priceFrom.get(s.id) ?? 0)}
                      {s.measureType === "duration" &&
                      s.priceMode === "per_unit"
                        ? " /h"
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <ServiceFormDialog
                        service={s}
                        categories={categories}
                        mode="edit"
                      />
                      <ResourceDeleteButton
                        endpoint={`/api/services/${s.id}`}
                        name={`el ítem ${s.name}`}
                        successMessage="Ítem eliminado"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <CategoryFormDialog />
        </div>

        {categories.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">Sin categorías.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <span>{c.name}</span>
                <span className="flex items-center">
                  <CategoryFormDialog category={c} mode="edit" />
                  <ResourceDeleteButton
                    endpoint={`/api/service-categories/${c.id}`}
                    name={`la categoría ${c.name}`}
                    successMessage="Categoría eliminada"
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
