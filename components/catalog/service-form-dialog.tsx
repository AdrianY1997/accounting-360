"use client";

import { ServiceImageManager } from "@/components/catalog/service-image-manager";
import { VariantManager } from "@/components/catalog/variant-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  measureTypeLabels,
  measureTypes,
  priceModeLabels,
  priceModes,
} from "@/lib/validations/catalog";
import type { Service, ServiceCategory } from "@/services/catalog";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const NONE = "__none__";

export function ServiceFormDialog({
  service,
  categories,
  mode = "create",
}: {
  service?: Service;
  categories: ServiceCategory[];
  mode?: "edit" | "create";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? NONE);
  const [measureType, setMeasureType] = useState(
    service?.measureType ?? "quantity",
  );
  const [priceMode, setPriceMode] = useState(service?.priceMode ?? "per_unit");
  const [tracksStock, setTracksStock] = useState(service?.tracksStock ?? false);
  const editing = Boolean(service);
  const isDuration = measureType === "duration";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      price: String(form.get("price") ?? "0"),
      costPrice: String(form.get("costPrice") ?? "0"),
      resellerPrice: String(form.get("resellerPrice") ?? "0"),
      minPrice: String(form.get("minPrice") ?? "0"),
      measureType,
      priceMode,
      tracksStock,
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
    toast.success(editing ? "Ítem actualizado" : "Ítem creado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "edit" ? ( <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil className="size-4" />
        </Button>) : (
          <Button>
            <Plus className="size-4" />
            Nuevo ítem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar ítem" : "Nuevo ítem"}</DialogTitle>
          <DialogDescription>
            Agrega un nuevo ítem al catálogo o edita uno existente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={service?.name ?? ""}
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
            <p className="text-muted-foreground text-xs">
              Los precios y el stock se configuran en las variantes (tras crear el
              ítem se crea una variante Estándar).
            </p>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tracksStock}
              onChange={(e) => setTracksStock(e.target.checked)}
            />
            Descuenta stock al vender
          </label>
          {editing && service && (
            <ServiceImageManager
              serviceId={service.id}
              label="Imágenes principales"
            />
          )}
          {editing && service && <VariantManager serviceId={service.id} />}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
