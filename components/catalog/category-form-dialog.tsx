"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ServiceCategory } from "@/services/catalog";
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
import { Pencil, Plus } from "lucide-react";

const NONE = "__none__";

export function CategoryFormDialog({
  category,
  categories = [],
  mode = "create",
}: {
  category?: ServiceCategory;
  /** All salon categories — used to offer a parent (roots only). */
  categories?: ServiceCategory[];
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState(category?.parentId ?? NONE);
  const editing = Boolean(category);

  // Only one level of nesting: parents must be root categories, and a
  // category that already has children can't become a subcategory.
  const hasChildren = editing
    ? categories.some((c) => c.parentId === category!.id)
    : false;
  const parentOptions = categories.filter(
    (c) => !c.parentId && c.id !== category?.id,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch(
      editing
        ? `/api/service-categories/${category!.id}`
        : "/api/service-categories",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          parentId: parentId === NONE ? null : parentId,
        }),
      },
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar");
      return;
    }
    toast.success(editing ? "Categoría actualizada" : "Categoría creada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <Button variant="ghost" size="icon" aria-label="Editar">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="size-4" />
            Nueva categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            Agrega una nueva categoria o edita una existente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={category?.name ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label>Categoría padre</Label>
            <Select
              value={parentId}
              onValueChange={setParentId}
              disabled={hasChildren}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin padre (raíz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin padre (raíz)</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasChildren && (
              <p className="text-muted-foreground text-xs">
                Tiene subcategorías — no puede convertirse en subcategoría.
              </p>
            )}
          </div>
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
