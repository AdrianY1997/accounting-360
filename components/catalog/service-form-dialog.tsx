"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Service, ServiceCategory } from "@/services/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { ServiceImageManager } from "@/components/catalog/service-image-manager";

const NONE = "__none__";

export function ServiceFormDialog({
  service,
  categories,
  trigger,
}: {
  service?: Service;
  categories: ServiceCategory[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? NONE);
  const [measureType, setMeasureType] = useState(
    service?.measureType ?? "quantity",
  );
  const [priceMode, setPriceMode] = useState(service?.priceMode ?? "per_unit");
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar ítem" : "Nuevo ítem"}</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">
                {isDuration && priceMode === "per_unit"
                  ? "Sugerido / hora"
                  : "Precio sugerido"}
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service?.price ?? "0"}
              />
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
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="costPrice">Costo (proveedor)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service?.costPrice ?? "0"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resellerPrice">Intermediario</Label>
              <Input
                id="resellerPrice"
                name="resellerPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service?.resellerPrice ?? "0"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minPrice">Mínimo</Label>
              <Input
                id="minPrice"
                name="minPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service?.minPrice ?? "0"}
              />
            </div>
          </div>
          {editing && service && (
            <ServiceImageManager serviceId={service.id} />
          )}
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
