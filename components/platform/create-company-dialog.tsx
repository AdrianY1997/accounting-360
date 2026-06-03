"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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

export function CreateCompanyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      companyName: String(form.get("companyName") ?? ""),
      salonName: String(form.get("salonName") ?? "Salón Principal"),
      ownerName: String(form.get("ownerName") ?? ""),
      ownerEmail: String(form.get("ownerEmail") ?? ""),
      ownerPassword: String(form.get("ownerPassword") ?? ""),
    };
    setLoading(true);
    const res = await fetch("/api/platform/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error ?? "No se pudo crear la empresa";
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Empresa creada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nueva empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>
            Crea la empresa, su primer salón y la cuenta del dueño.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Empresa</Label>
            <Input id="companyName" name="companyName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="salonName">Primer salón</Label>
            <Input
              id="salonName"
              name="salonName"
              defaultValue="Salón Principal"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ownerName">Nombre del dueño</Label>
            <Input id="ownerName" name="ownerName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ownerEmail">Correo del dueño</Label>
            <Input id="ownerEmail" name="ownerEmail" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ownerPassword">Contraseña</Label>
            <Input
              id="ownerPassword"
              name="ownerPassword"
              type="text"
              minLength={8}
              required
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando…" : "Crear empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
