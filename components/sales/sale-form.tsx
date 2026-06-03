"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/payment";

type ClientOpt = { id: string; fullName: string };
type ServiceOpt = { id: string; name: string; price: string };
type StaffOpt = { id: string; name: string };

type Row = {
  serviceId: string;
  description: string;
  unitPrice: string;
  quantity: string;
  staffId: string;
};

const NONE = "__none__";
const emptyRow = (): Row => ({
  serviceId: NONE,
  description: "",
  unitPrice: "0",
  quantity: "1",
  staffId: NONE,
});

export function SaleForm({
  clients,
  services,
  staff,
  taxRate,
  currency,
}: {
  clients: ClientOpt[];
  services: ServiceOpt[];
  staff: StaffOpt[];
  taxRate: number;
  currency: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(NONE);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = useMemo(
    () => new Intl.NumberFormat("es", { style: "currency", currency }),
    [currency],
  );

  function setRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function onPickService(i: number, serviceId: string) {
    if (serviceId === NONE) {
      setRow(i, { serviceId });
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    setRow(i, {
      serviceId,
      description: svc?.name ?? "",
      unitPrice: svc?.price ?? "0",
    });
  }

  const { subtotal, tax, total } = useMemo(() => {
    const sub = rows.reduce(
      (acc, r) => acc + (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0),
      0,
    );
    const t = sub * taxRate;
    return { subtotal: sub, tax: t, total: sub + t };
  }, [rows, taxRate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side guards before hitting the API.
    if (rows.some((r) => !r.description.trim())) {
      setError("Cada ítem necesita una descripción.");
      return;
    }
    if (subtotal <= 0) {
      setError("El total debe ser mayor a 0.");
      return;
    }
    if (Number(payAmount) > total) {
      setError("El pago no puede ser mayor al total.");
      return;
    }

    setLoading(true);
    const body = {
      clientId: clientId === NONE ? null : clientId,
      notes,
      items: rows.map((r) => ({
        serviceId: r.serviceId === NONE ? null : r.serviceId,
        staffId: r.staffId === NONE ? null : r.staffId,
        description: r.description,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
      })),
      payment:
        Number(payAmount) > 0
          ? { method: payMethod, amount: payAmount }
          : null,
    };
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error ?? "No se pudo registrar la venta";
      setError(msg);
      toast.error(msg);
      return;
    }
    const { id } = await res.json();
    toast.success("Venta registrada");
    router.push(`/sales/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Sin cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin cliente</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ítems</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((p) => [...p, emptyRow()])}
          >
            <Plus className="size-4" />
            Añadir ítem
          </Button>
        </div>

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto_1fr_auto] sm:items-end"
          >
            <div className="grid gap-1">
              <Label className="text-xs">Servicio / descripción</Label>
              <Select
                value={r.serviceId}
                onValueChange={(v) => onPickService(i, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Libre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Libre</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={r.description}
                onChange={(e) => setRow(i, { description: e.target.value })}
                placeholder="Descripción"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Precio</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="w-28"
                value={r.unitPrice}
                onChange={(e) => setRow(i, { unitPrice: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Cant.</Label>
              <Input
                type="number"
                min="1"
                className="w-20"
                value={r.quantity}
                onChange={(e) => setRow(i, { quantity: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Staff</Label>
              <Select
                value={r.staffId}
                onValueChange={(v) => setRow(i, { staffId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar ítem"
              disabled={rows.length === 1}
              onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{fmt.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Impuesto ({(taxRate * 100).toFixed(2)}%)
          </span>
          <span>{fmt.format(tax)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span>{fmt.format(total)}</span>
        </div>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-2 rounded-md border p-3">
        <Label className="text-sm">Pago (opcional)</Label>
        <div className="flex gap-2">
          <Select value={payMethod} onValueChange={setPayMethod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => (
                <SelectItem key={m} value={m}>
                  {paymentMethodLabels[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setPayAmount(total.toFixed(2))}
        >
          Pagar total ({fmt.format(total)})
        </Button>
        <p className="text-muted-foreground text-xs">
          Deja el monto en 0 para registrar la venta como pendiente.
        </p>
      </div>

      {error && (
        <p className="text-destructive text-right text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Registrar venta"}
        </Button>
      </div>
    </form>
  );
}
