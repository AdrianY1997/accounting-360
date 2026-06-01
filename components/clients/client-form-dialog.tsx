"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Client } from "@/services/clients";
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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  /** Existing client to edit; omit to create a new one. */
  client?: Client;
  trigger: React.ReactNode;
};

export function ClientFormDialog({ client, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const editing = Boolean(client);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    setLoading(true);
    const res = await fetch(
      editing ? `/api/clients/${client!.id}` : "/api/clients",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar el cliente");
      return;
    }
    toast.success(editing ? "Cliente actualizado" : "Cliente creado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            Datos de contacto del cliente del salón.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              defaultValue={client?.fullName ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={client?.email ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
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
