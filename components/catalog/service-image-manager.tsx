"use client";

import { useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Img = { id: string; url: string };

/** Manage a catalog item's images (Vercel Blob). Used in the edit dialog. */
export function ServiceImageManager({ serviceId }: { serviceId: string }) {
  const [images, setImages] = useState<Img[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/services/${serviceId}/images`);
    if (res.ok) setImages(await res.json());
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
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

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Imágenes</span>
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
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                className="bg-destructive text-destructive-foreground absolute -right-2 -top-2 rounded-full p-1"
                aria-label="Eliminar imagen"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}
