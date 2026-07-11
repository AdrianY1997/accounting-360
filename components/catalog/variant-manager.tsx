"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ServiceImageManager } from "@/components/catalog/service-image-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suggestPrices } from "@/lib/pricing";

/** Empty or zero — safe to overwrite with a suggestion. */
const blank = (v: string) => !v || Number(v) === 0;

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  costPrice: string;
  resellerPrice: string;
  minPrice: string;
  stock: number;
  hasPhotoStock?: boolean;
};

/**
 * Manage variants of a catalog entry (name, price tiers, stock, images).
 * `kind="service"` (duration services) relabels them as "Tarifas" and hides
 * all stock UI — services keep variants only as price tiers (e.g. hair
 * length), never inventory.
 */
export function VariantManager({
  serviceId,
  kind = "product",
}: {
  serviceId: string;
  kind?: "product" | "service";
}) {
  const isService = kind === "service";
  const [variants, setVariants] = useState<Variant[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [resellerPrice, setResellerPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [loading, setLoading] = useState(false);

  // Leaving the cost field suggests the other tiers (sugerido = costo × 1.5
  // redondeado, intermediario 85% / mínimo 90% del sugerido) — only into
  // blank/zero fields, so anything already set (or later edited) is kept.
  function suggestFromNewCost() {
    const s = suggestPrices(Number(costPrice));
    if (!s) return;
    if (blank(price)) setPrice(String(s.price));
    if (blank(resellerPrice)) setResellerPrice(String(s.resellerPrice));
    if (blank(minPrice)) setMinPrice(String(s.minPrice));
  }

  function suggestFromRowCost(v: Variant) {
    const s = suggestPrices(Number(v.costPrice));
    if (!s) return;
    patch(v.id, {
      ...(blank(v.price) ? { price: String(s.price) } : {}),
      ...(blank(v.resellerPrice)
        ? { resellerPrice: String(s.resellerPrice) }
        : {}),
      ...(blank(v.minPrice) ? { minPrice: String(s.minPrice) } : {}),
    });
  }

  async function load() {
    const res = await fetch(`/api/services/${serviceId}/variants`);
    if (res.ok) setVariants(await res.json());
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function add() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/services/${serviceId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: price || 0,
        costPrice: costPrice || 0,
        resellerPrice: resellerPrice || 0,
        minPrice: minPrice || 0,
        stock,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo crear la variante");
      return;
    }
    setName("");
    setPrice("");
    setCostPrice("");
    setResellerPrice("");
    setMinPrice("");
    setStock("0");
    void load();
  }

  async function save(v: Variant) {
    const res = await fetch(`/api/variants/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        price: v.price || 0,
        costPrice: v.costPrice || 0,
        resellerPrice: v.resellerPrice || 0,
        minPrice: v.minPrice || 0,
        stock: v.stock,
      }),
    });
    if (!res.ok) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Variante guardada");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    setVariants((p) => p.filter((v) => v.id !== id));
  }

  function patch(id: string, p: Partial<Variant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...p } : v)));
  }

  const total = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);

  return (
    <div className="grid gap-3">
      <span className="text-sm font-medium">
        {isService ? "Tarifas" : "Variantes y stock"}
        {!isService && (
          <span className="text-muted-foreground font-normal">
            {" "}
            (total: {total})
          </span>
        )}
      </span>

      {variants.map((v) => (
        <div key={v.id} className="grid gap-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">
                {isService ? "Tarifa" : "Variante"}
                {v.sku && (
                  <span className="text-muted-foreground font-mono font-normal">
                    {" "}
                    · {v.sku}
                  </span>
                )}
              </Label>
              <Input
                className="w-40"
                value={v.name}
                onChange={(e) => patch(v.id, { name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Sugerido</Label>
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                value={v.price}
                onChange={(e) => patch(v.id, { price: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Costo</Label>
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                value={v.costPrice}
                onChange={(e) => patch(v.id, { costPrice: e.target.value })}
                onBlur={() => suggestFromRowCost(v)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Intermediario</Label>
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                value={v.resellerPrice}
                onChange={(e) => patch(v.id, { resellerPrice: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Mínimo</Label>
              <Input
                className="w-24"
                type="number"
                step="0.01"
                min="0"
                value={v.minPrice}
                onChange={(e) => patch(v.id, { minPrice: e.target.value })}
              />
            </div>
            {!isService && (
              <div className="grid gap-1">
                <Label className="text-xs">
                  Stock{v.hasPhotoStock ? " (desde fotos)" : ""}
                </Label>
                <Input
                  className="w-20"
                  type="number"
                  min="0"
                  value={v.stock}
                  disabled={v.hasPhotoStock}
                  onChange={(e) => patch(v.id, { stock: Number(e.target.value) })}
                />
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => save(v)}>
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar variante"
              onClick={() => remove(v.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <ServiceImageManager
            serviceId={serviceId}
            variantId={v.id}
            label={
              isService
                ? "Imágenes de la tarifa"
                : "Imágenes de la variante (asigna stock por foto)"
            }
            photoStock={!isService}
            onStockSaved={load}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-3">
        <div className="grid gap-1">
          <Label className="text-xs">
            {isService ? "Nueva tarifa" : "Nueva variante"}
          </Label>
          <Input
            className="w-40"
            value={name}
            placeholder={isService ? "Ej: Cabello largo" : "Ej: M - Rojo"}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Sugerido</Label>
          <Input
            className="w-24"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Costo</Label>
          <Input
            className="w-24"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            onBlur={suggestFromNewCost}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Intermediario</Label>
          <Input
            className="w-24"
            type="number"
            step="0.01"
            min="0"
            value={resellerPrice}
            onChange={(e) => setResellerPrice(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Mínimo</Label>
          <Input
            className="w-24"
            type="number"
            step="0.01"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        {!isService && (
          <div className="grid gap-1">
            <Label className="text-xs">Stock</Label>
            <Input
              className="w-20"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        )}
        <Button type="button" size="sm" disabled={loading} onClick={add}>
          <Plus className="size-4" />
          Añadir
        </Button>
      </div>
    </div>
  );
}
