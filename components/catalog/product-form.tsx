"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ServiceImageManager } from "@/components/catalog/service-image-manager";
import { VariantManager } from "@/components/catalog/variant-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoryTree } from "@/lib/categories";
import { getStoreType } from "@/lib/store-types";
import {
  measureTypeLabels,
  measureTypes,
  priceModeLabels,
  priceModes,
} from "@/lib/validations/catalog";
import type { Service, ServiceCategory } from "@/services/catalog";

const NONE = "__none__";

/**
 * Dedicated product/service create-edit form (pages /catalog/new and
 * /catalog/[id]). Sections: básicos, descripción + features, atributos del
 * tipo de tienda, imágenes y variantes (edit only).
 */
export function ProductForm({
  service,
  categories,
  storeType,
}: {
  service?: Service;
  categories: ServiceCategory[];
  /** The salón's store type id (salon_settings.store_type). */
  storeType: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? NONE);
  const [measureType, setMeasureType] = useState(
    service?.measureType ?? "quantity",
  );
  const [priceMode, setPriceMode] = useState(service?.priceMode ?? "per_unit");
  const [tracksStock, setTracksStock] = useState(service?.tracksStock ?? false);
  const [attributes, setAttributes] = useState<Record<string, string>>(
    service?.attributes ?? {},
  );
  const editing = Boolean(service);
  const isDuration = measureType === "duration";
  const template = getStoreType(storeType);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const features = String(form.get("features") ?? "")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 12);
    const body = {
      name: String(form.get("name") ?? ""),
      summary: String(form.get("summary") ?? ""),
      description: String(form.get("description") ?? ""),
      features,
      attributes,
      price: String(form.get("price") ?? "0"),
      costPrice: "0",
      resellerPrice: "0",
      minPrice: "0",
      measureType,
      priceMode,
      tracksStock: isDuration ? false : tracksStock,
      durationMinutes: String(form.get("durationMinutes") ?? "0"),
      categoryId: categoryId === NONE ? null : categoryId,
    };
    setLoading(true);
    const res = await fetch(
      editing ? `/api/services/${service!.id}` : "/api/services",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar");
      return;
    }
    if (editing) {
      toast.success("Ítem actualizado");
      router.refresh();
      return;
    }
    const created = await res.json();
    toast.success("Ítem creado — ahora agrega imágenes y variantes");
    router.push(`/catalog/${created.id}`);
  }

  // Roots first with their children indented, like the store filter.
  const categoryOptions = categoryTree(categories).flatMap(
    ({ root, children }) => [root, ...children],
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={service?.name ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">Resumen</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={2}
              maxLength={300}
              placeholder="Frase corta que se muestra arriba del precio en la tienda"
              defaultValue={service?.summary ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin categoría</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? `— ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Medida</Label>
              <Select value={measureType} onValueChange={setMeasureType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {measureTypes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {measureTypeLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isDuration && (
              <div className="grid gap-2">
                <Label>Precio</Label>
                <Select value={priceMode} onValueChange={setPriceMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceModes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {priceModeLabels[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {isDuration && (
            <div className="grid gap-2">
              <Label htmlFor="durationMinutes">Duración por defecto (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="0"
                defaultValue={service?.durationMinutes ?? 0}
              />
            </div>
          )}
          {!editing && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="price">
                  {isDuration && priceMode === "per_unit"
                    ? "Precio por hora"
                    : "Precio"}
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {isDuration
                  ? "El precio queda en la tarifa Estándar; tras crear puedes añadir más tarifas (p. ej. por largo de cabello)."
                  : "El precio queda en la variante Estándar; el resto de precios y el stock se configuran en las variantes."}
              </p>
            </>
          )}
          {!isDuration && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tracksStock}
                onChange={(e) => setTracksStock(e.target.checked)}
              />
              Descuenta stock al vender
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descripción</CardTitle>
          <CardDescription>
            Se muestra en la pestaña Descripción de la tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              maxLength={2000}
              defaultValue={service?.description ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="features">Puntos destacados</Label>
            <Textarea
              id="features"
              name="features"
              rows={4}
              placeholder={"Tela fresca y ligera\nNo se encoge ni destiñe"}
              defaultValue={(service?.features ?? []).join("\n")}
            />
            <p className="text-muted-foreground text-xs">
              Uno por línea (máx. 12) — se muestran con ✓ en la tienda.
            </p>
          </div>
        </CardContent>
      </Card>

      {template.attributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atributos ({template.label})</CardTitle>
            <CardDescription>
              Según el tipo de tienda configurado. Los campos largos salen como
              pestaña propia en el detalle.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {template.attributes.map((attr) => (
              <div key={attr.key} className="grid gap-2">
                <Label htmlFor={`attr-${attr.key}`}>{attr.label}</Label>
                {attr.kind === "longtext" ? (
                  <Textarea
                    id={`attr-${attr.key}`}
                    rows={4}
                    maxLength={4000}
                    placeholder={attr.placeholder}
                    value={attributes[attr.key] ?? ""}
                    onChange={(e) =>
                      setAttributes((p) => ({ ...p, [attr.key]: e.target.value }))
                    }
                  />
                ) : (
                  <Input
                    id={`attr-${attr.key}`}
                    maxLength={200}
                    placeholder={attr.placeholder}
                    value={attributes[attr.key] ?? ""}
                    onChange={(e) =>
                      setAttributes((p) => ({ ...p, [attr.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {editing && service && (
        <Card>
          {/* ServiceImageManager and VariantManager render their own labels. */}
          <CardContent className="grid gap-6 pt-6">
            <ServiceImageManager
              serviceId={service.id}
              label="Imágenes principales"
            />
            <VariantManager
              serviceId={service.id}
              kind={isDuration ? "service" : "product"}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear ítem"}
        </Button>
      </div>
    </form>
  );
}
