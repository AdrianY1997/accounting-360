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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSIGNABLE_ROLES, roleLabels } from "@/lib/roles";

export function StaffEditDialog({ staff }: { staff: StaffRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(staff.role);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isOwner = staff.role === "owner";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: { role?: string; password?: string } = {};
    if (!isOwner && role !== staff.role) body.role = role;
    if (password) body.password = password;
    if (!body.role && !body.password) {
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
    toast.success("Staff actualizado");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {staff.name}</DialogTitle>
          <DialogDescription>{staff.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isOwner}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isOwner ? (
                  <SelectItem value="owner">{roleLabels.owner}</SelectItem>
                ) : (
                  ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
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
