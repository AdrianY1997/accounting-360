import { eq } from "drizzle-orm";
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
} from "@/services/catalog";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "catalog:write")) redirect("/dashboard");
  const { q } = await searchParams;
  const [categories, services, settings] = await Promise.all([
    listCategories(ctx),
    listServices(ctx, q),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);

  const currency = settings?.currency ?? "USD";
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const thumbs = await imagesForServices(
    ctx,
    services.map((s) => s.id),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Productos y servicios</h1>
          <ServiceFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus className="size-4" />
                Nuevo ítem
              </Button>
            }
          />
        </div>
        <SearchInput placeholder="Buscar ítem" />

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
                      {s.measureType === "duration"
                        ? s.priceMode === "per_unit"
                          ? "Duración (×hora)"
                          : "Duración (fija)"
                        : "Cantidad"}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(s.price))}
                      {s.measureType === "duration" &&
                      s.priceMode === "per_unit"
                        ? " /h"
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <ServiceFormDialog
                        service={s}
                        categories={categories}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar">
                            <Pencil className="size-4" />
                          </Button>
                        }
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
          <CategoryFormDialog
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Nueva categoría
              </Button>
            }
          />
        </div>

        {categories.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            Sin categorías.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <span>{c.name}</span>
                <span className="flex items-center">
                  <CategoryFormDialog
                    category={c}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
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
