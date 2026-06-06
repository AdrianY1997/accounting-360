"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ServiceImageManager } from "@/components/catalog/service-image-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Variant = {
  id: string;
  name: string;
  price: string | null;
  stock: number;
};

/** Manage stock variants of an item (name, optional price, stock, images). */
export function VariantManager({ serviceId }: { serviceId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ name, price: price || undefined, stock }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo crear la variante");
      return;
    }
    setName("");
    setPrice("");
    setStock("0");
    void load();
  }

  async function save(v: Variant) {
    const res = await fetch(`/api/variants/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        price: v.price === null || v.price === "" ? undefined : v.price,
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
        Variantes y stock{" "}
        <span className="text-muted-foreground font-normal">
          (total: {total})
        </span>
      </span>

      {variants.map((v) => (
        <div key={v.id} className="grid gap-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Variante</Label>
              <Input
                className="w-40"
                value={v.name}
                onChange={(e) => patch(v.id, { name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Precio (opc.)</Label>
              <Input
                className="w-28"
                type="number"
                step="0.01"
                min="0"
                value={v.price ?? ""}
                placeholder="hereda"
                onChange={(e) => patch(v.id, { price: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Stock</Label>
              <Input
                className="w-20"
                type="number"
                min="0"
                value={v.stock}
                onChange={(e) => patch(v.id, { stock: Number(e.target.value) })}
              />
            </div>
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
            label="Imágenes de la variante"
          />
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-3">
        <div className="grid gap-1">
          <Label className="text-xs">Nueva variante</Label>
          <Input
            className="w-40"
            value={name}
            placeholder="Ej: M - Rojo"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Precio (opc.)</Label>
          <Input
            className="w-28"
            type="number"
            step="0.01"
            min="0"
            value={price}
            placeholder="hereda"
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
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
        <Button type="button" size="sm" disabled={loading} onClick={add}>
          <Plus className="size-4" />
          Añadir
        </Button>
      </div>
    </div>
  );
}
