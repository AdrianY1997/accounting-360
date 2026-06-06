"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { StaffRow } from "@/services/staff";
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
import { ALL_PERMISSIONS, permissionLabels, type Permission } from "@/lib/roles";

export function StaffEditDialog({ staff }: { staff: StaffRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<Permission[]>(staff.permissions);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isOwner = staff.role === "owner";

  function toggle(p: Permission) {
    setPerms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: { permissions?: Permission[]; password?: string } = {};
    if (!isOwner) body.permissions = perms;
    if (password) body.password = password;
    if (!body.permissions && !body.password) {
      toast.error("Nada que actualizar");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/staff/${staff.memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo actualizar");
      return;
    }
    toast.success("Personal actualizado");
    setPassword("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {staff.name}</DialogTitle>
          <DialogDescription>{staff.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          {isOwner ? (
            <p className="text-muted-foreground text-sm">
              El dueño tiene acceso total.
            </p>
          ) : (
            <div className="grid gap-2">
              <Label>Permisos</Label>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={perms.includes(p)}
                      onChange={() => toggle(p)}
                    />
                    {permissionLabels[p]}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="password">Nueva contraseña (opcional)</Label>
            <Input
              id="password"
              type="text"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
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
