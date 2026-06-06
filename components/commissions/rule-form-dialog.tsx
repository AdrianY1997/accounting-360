"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  commissionTypes,
  commissionTypeLabels,
  commissionBases,
  commissionBaseLabels,
} from "@/lib/validations/commission";

type Option = { id: string; name: string };
type Rule = {
  id: string;
  staffId: string | null;
  serviceId: string | null;
  type: string;
  base: string;
  value: string;
};

const NONE = "__none__";

export function RuleFormDialog({
  rule,
  staff,
  services,
  trigger,
}: {
  rule?: Rule;
  staff: Option[];
  services: Option[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState(rule?.staffId ?? NONE);
  const [serviceId, setServiceId] = useState(rule?.serviceId ?? NONE);
  const [type, setType] = useState(rule?.type ?? "percent");
  const [base, setBase] = useState(rule?.base ?? "line");
  const editing = Boolean(rule);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      staffId: staffId === NONE ? null : staffId,
      serviceId: serviceId === NONE ? null : serviceId,
      type,
      base,
      value: String(form.get("value") ?? "0"),
    };
    setLoading(true);
    const res = await fetch(
      editing ? `/api/commission-rules/${rule!.id}` : "/api/commission-rules",
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
    toast.success(editing ? "Regla actualizada" : "Regla creada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar regla" : "Nueva regla"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Staff (vacío = todos)</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Servicio (vacío = todos)</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Todos</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {commissionTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {commissionTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">
                {type === "percent" ? "Porcentaje (%)" : "Monto"}
              </Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={rule?.value ?? "0"}
              />
            </div>
          </div>
          {type === "percent" && (
            <div className="grid gap-2">
              <Label>Base</Label>
              <Select value={base} onValueChange={setBase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {commissionBases.map((b) => (
                    <SelectItem key={b} value={b}>
                      {commissionBaseLabels[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
