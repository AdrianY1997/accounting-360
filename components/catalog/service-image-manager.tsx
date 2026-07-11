"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aiKindLabels, type AiKind } from "@/lib/ai-images";

type Img = {
  id: string;
  url: string;
  variantId: string | null;
  stock: number | null;
  aiKind: AiKind | null;
};

const AI_NONE = "";

/** Manage images for a catalog item (variantId omitted) or a variant. */
export function ServiceImageManager({
  serviceId,
  variantId,
  label = "Imágenes",
  photoStock = true,
  onStockSaved,
}: {
  serviceId: string;
  variantId?: string;
  label?: string;
  /** Show the per-photo stock input on variant images (off for services). */
  photoStock?: boolean;
  /** Called after a photo's stock is saved (e.g. to refresh the variant's total). */
  onStockSaved?: () => void;
}) {
  const [images, setImages] = useState<Img[]>([]);
  const [loading, setLoading] = useState(false);
  // AI disclosure applied to the next upload batch.
  const [uploadAiKind, setUploadAiKind] = useState<string>(AI_NONE);

  async function load() {
    const res = await fetch(`/api/services/${serviceId}/images`);
    if (res.ok) {
      const all: Img[] = await res.json();
      setImages(
        all.filter((i) => (variantId ? i.variantId === variantId : !i.variantId)),
      );
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, variantId]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    if (variantId) fd.append("variantId", variantId);
    if (uploadAiKind) fd.append("aiKind", uploadAiKind);
    setLoading(true);
    const res = await fetch(`/api/services/${serviceId}/images`, {
      method: "POST",
      body: fd,
    });
    setLoading(false);
    e.target.value = "";
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo subir");
      return;
    }
    toast.success("Imagen(es) subida(s)");
    void load();
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/service-images/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
  }

  async function onStockChange(id: string, value: string) {
    const stock = value.trim() === "" ? null : Math.max(0, Number(value));
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, stock } : i)));
    const res = await fetch(`/api/service-images/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    if (!res.ok) {
      toast.error("No se pudo guardar el stock de la foto");
      void load();
      return;
    }
    onStockSaved?.();
  }

  async function onAiKindChange(id: string, value: string) {
    const aiKind = (value || null) as AiKind | null;
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, aiKind } : i)));
    const res = await fetch(`/api/service-images/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiKind }),
    });
    if (!res.ok) {
      toast.error("No se pudo guardar el tipo de imagen");
      void load();
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="size-16 rounded-md border object-cover"
              />
              {img.aiKind && (
                <span
                  title={`Imagen IA (${aiKindLabels[img.aiKind]})`}
                  className="absolute bottom-1 left-1 rounded bg-black/60 p-0.5 text-white"
                >
                  <Sparkles className="size-3" />
                </span>
              )}
              {img.stock === 0 && (
                <span className="bg-destructive text-destructive-foreground absolute bottom-0 left-0 right-0 text-center text-[10px] leading-tight">
                  Agotado
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                className="bg-destructive text-destructive-foreground absolute -right-2 -top-2 rounded-full p-1"
                aria-label="Eliminar imagen"
              >
                <Trash2 className="size-3" />
              </button>
              {variantId && photoStock && (
                <input
                  type="number"
                  min="0"
                  className="border-input bg-background mt-1 w-16 rounded border px-1 py-0.5 text-xs"
                  placeholder="Stock"
                  defaultValue={img.stock ?? ""}
                  onBlur={(e) => onStockChange(img.id, e.target.value)}
                  aria-label="Stock de esta foto"
                />
              )}
              <select
                className="border-input bg-background mt-1 block w-16 rounded border px-1 py-0.5 text-xs"
                value={img.aiKind ?? AI_NONE}
                onChange={(e) => onAiKindChange(img.id, e.target.value)}
                aria-label="Imagen generada con IA"
              >
                <option value={AI_NONE}>Real</option>
                <option value="reference">IA ref.</option>
                <option value="generated">IA gen.</option>
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onUpload}
            disabled={loading}
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <span>
              <Upload className="size-4" />
              {loading ? "Subiendo…" : "Subir imágenes"}
            </span>
          </Button>
        </label>
        <select
          className="border-input bg-background rounded border px-2 py-1.5 text-xs"
          value={uploadAiKind}
          onChange={(e) => setUploadAiKind(e.target.value)}
          aria-label="Tipo de imagen a subir"
        >
          <option value={AI_NONE}>Foto real</option>
          <option value="reference">IA — referencia</option>
          <option value="generated">IA — generada</option>
        </select>
      </div>
    </div>
  );
}
