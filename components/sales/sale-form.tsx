"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, X } from "lucide-react";
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

type VariantImageOpt = { id: string; url: string; stock: number | null };
type VariantOpt = {
  id: string;
  name: string;
  price: string;
  resellerPrice: string;
  minPrice: string;
  stock: number;
  images: VariantImageOpt[];
};

/** Images of a variant that track stock per photo. */
function trackedImages(v?: VariantOpt): VariantImageOpt[] {
  return v?.images.filter((i) => i.stock !== null) ?? [];
}
type ClientOpt = { id: string; fullName: string; type: string };
type ServiceOpt = {
  id: string;
  name: string;
  measureType: string;
  priceMode: string;
  durationMinutes: number;
  tracksStock: boolean;
  variants: VariantOpt[];
};
type StaffOpt = { id: string; name: string };

type Row = {
  serviceId: string;
  variantId: string;
  /** Units to pull per photo (pattern/print), keyed by image id. */
  photoQty: Record<string, number>;
  tracksStock: boolean;
  description: string;
  unitPrice: string;
  minPrice: string;
  quantity: string;
  durationMinutes: string;
  measureType: string; // quantity | duration
  priceMode: string; // per_unit | fixed
  staffId: string;
};

const NONE = "__none__";
const emptyRow = (): Row => ({
  serviceId: NONE,
  variantId: NONE,
  photoQty: {},
  tracksStock: false,
  description: "",
  unitPrice: "0",
  minPrice: "0",
  quantity: "1",
  durationMinutes: "0",
  measureType: "quantity",
  priceMode: "per_unit",
  staffId: NONE,
});

/** Sum of units picked across all photos. */
function photoQtyTotal(photoQty: Record<string, number>): number {
  return Object.values(photoQty).reduce((a, b) => a + b, 0);
}

/** Default pick: 1 unit of the first in-stock photo, else nothing. */
function defaultPhotoQty(v?: VariantOpt): Record<string, number> {
  const tracked = trackedImages(v);
  const img = tracked.find((i) => (i.stock ?? 0) > 0);
  return img ? { [img.id]: 1 } : {};
}

/** Initial line quantity: matches the default photo pick, else 1 (no photo tracking). */
function defaultQuantity(v?: VariantOpt): string {
  const tracked = trackedImages(v);
  if (tracked.length === 0) return "1";
  return String(photoQtyTotal(defaultPhotoQty(v)));
}

/** Variant price for a client type: resellers get the intermediario price. */
function variantTier(v: VariantOpt, clientType: string): string {
  return clientType === "reseller" && Number(v.resellerPrice) > 0
    ? v.resellerPrice
    : v.price;
}

/** Line total for the live preview (mirrors the server math). */
function rowTotal(r: Row): number {
  const price = Number(r.unitPrice) || 0;
  if (r.measureType === "duration") {
    if (r.priceMode === "fixed") return price;
    return price * ((Number(r.durationMinutes) || 0) / 60);
  }
  return price * (Number(r.quantity) || 0);
}

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
  const [defaultStaff, setDefaultStaff] = useState(NONE);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  // Pick a default seller and apply it to every line (and future ones).
  function onPickDefaultStaff(v: string) {
    setDefaultStaff(v);
    setRows((prev) => prev.map((r) => ({ ...r, staffId: v })));
  }
  function addRow() {
    setRows((p) => [...p, { ...emptyRow(), staffId: defaultStaff }]);
  }
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

  /**
   * +/- on a photo. Each photo (pattern/print) of the variant has its own
   * count, capped to that photo's stock; the line's quantity is the sum
   * across all photos picked.
   */
  function pickPhoto(i: number, img: VariantImageOpt, delta: number) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const stock = img.stock ?? 0;
        const current = r.photoQty[img.id] ?? 0;
        const next = Math.min(Math.max(current + delta, 0), stock);
        const photoQty = { ...r.photoQty };
        if (next > 0) photoQty[img.id] = next;
        else delete photoQty[img.id];
        return { ...r, photoQty, quantity: String(photoQtyTotal(photoQty)) };
      }),
    );
  }

  function clearPhoto(i: number, imgId: string) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const photoQty = { ...r.photoQty };
        delete photoQty[imgId];
        return { ...r, photoQty, quantity: String(photoQtyTotal(photoQty)) };
      }),
    );
  }

  const clientType =
    clients.find((c) => c.id === clientId)?.type ?? "direct";

  function onPickService(i: number, serviceId: string) {
    if (serviceId === NONE) {
      setRow(i, {
        serviceId,
        minPrice: "0",
        tracksStock: false,
        variantId: NONE,
        photoQty: {},
      });
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    const firstVar = svc?.variants[0];
    setRow(i, {
      serviceId,
      description: svc?.name ?? "",
      tracksStock: svc?.tracksStock ?? false,
      variantId: firstVar?.id ?? NONE,
      photoQty: defaultPhotoQty(firstVar),
      unitPrice: firstVar ? variantTier(firstVar, clientType) : "0",
      minPrice: firstVar?.minPrice ?? "0",
      measureType: svc?.measureType ?? "quantity",
      priceMode: svc?.priceMode ?? "per_unit",
      durationMinutes: String(svc?.durationMinutes ?? 0),
      quantity: defaultQuantity(firstVar),
    });
  }

  function onPickVariant(i: number, variantId: string) {
    const svc = services.find((s) => s.id === rows[i].serviceId);
    const v = svc?.variants.find((x) => x.id === variantId);
    setRow(i, {
      variantId,
      photoQty: defaultPhotoQty(v),
      unitPrice: v ? variantTier(v, clientType) : rows[i].unitPrice,
      minPrice: v?.minPrice ?? "0",
      quantity: defaultQuantity(v),
    });
  }

  // Reprice catalog lines when the client (and thus tier) changes.
  function onPickClient(id: string) {
    setClientId(id);
    const ct = clients.find((c) => c.id === id)?.type ?? "direct";
    setRows((prev) =>
      prev.map((r) => {
        if (r.serviceId === NONE || r.variantId === NONE) return r;
        const svc = services.find((s) => s.id === r.serviceId);
        const v = svc?.variants.find((x) => x.id === r.variantId);
        return v ? { ...r, unitPrice: variantTier(v, ct) } : r;
      }),
    );
  }

  const { subtotal, tax, total } = useMemo(() => {
    const sub = rows.reduce((acc, r) => acc + rowTotal(r), 0);
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
    if (
      rows.some(
        (r) => Number(r.minPrice) > 0 && Number(r.unitPrice) < Number(r.minPrice),
      )
    ) {
      setError("Hay ítems por debajo del precio mínimo permitido.");
      return;
    }
    if (rows.some((r) => r.serviceId !== NONE && r.variantId === NONE)) {
      setError("Selecciona una variante para cada ítem del catálogo.");
      return;
    }
    for (const r of rows) {
      if (r.serviceId === NONE) continue;
      const svc = services.find((s) => s.id === r.serviceId);
      const v = svc?.variants.find((x) => x.id === r.variantId);
      const tracked = trackedImages(v);
      if (tracked.length === 0) continue;
      const picks = Object.entries(r.photoQty).filter(([, qty]) => qty > 0);
      if (picks.length === 0) {
        setError(`Selecciona al menos una foto y cantidad para "${r.description.trim()}".`);
        return;
      }
      for (const [imageId, qty] of picks) {
        const img = tracked.find((x) => x.id === imageId);
        if (!img || (img.stock ?? 0) < qty) {
          setError(`Stock insuficiente en una foto de "${r.description.trim()}".`);
          return;
        }
      }
    }
    if (Number(payAmount) > total) {
      setError("El pago no puede ser mayor al total.");
      return;
    }

    setLoading(true);
    const body = {
      clientId: clientId === NONE ? null : clientId,
      notes,
      items: rows.flatMap((r) => {
        const svc = services.find((s) => s.id === r.serviceId);
        const v = svc?.variants.find((x) => x.id === r.variantId);
        const tracked = trackedImages(v);
        const base = {
          serviceId: r.serviceId === NONE ? null : r.serviceId,
          variantId: r.variantId === NONE ? null : r.variantId,
          staffId: r.staffId === NONE ? null : r.staffId,
          description: r.description,
          unitPrice: r.unitPrice,
          durationMinutes: r.durationMinutes,
        };
        if (tracked.length === 0) {
          return [{ ...base, imageId: null as string | null, quantity: r.quantity }];
        }
        // One sale item per photo picked, so each photo's stock is
        // decremented by the units sold for that pattern.
        return Object.entries(r.photoQty)
          .filter(([, qty]) => qty > 0)
          .map(([imageId, qty]) => ({
            ...base,
            imageId: imageId as string | null,
            quantity: String(qty),
          }));
      }),
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
          <Select value={clientId} onValueChange={onPickClient}>
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
        <div className="grid gap-2">
          <Label>Vendedor (por defecto)</Label>
          <Select value={defaultStaff} onValueChange={onPickDefaultStaff}>
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ítems</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
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
            <div className="grid gap-1 col-span-6">
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
              {r.serviceId !== NONE && (
                <Select
                  value={r.variantId}
                  onValueChange={(v) => onPickVariant(i, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {(services
                      .find((s) => s.id === r.serviceId)
                      ?.variants ?? []).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        {r.tracksStock ? ` (stock ${v.stock})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(() => {
                if (r.serviceId === NONE) return null;
                const svc = services.find((s) => s.id === r.serviceId);
                const v = svc?.variants.find((x) => x.id === r.variantId);
                const tracked = trackedImages(v);
                if (tracked.length === 0) return null;
                return (
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {tracked.map((img) => {
                      const stock = img.stock ?? 0;
                      const qty = r.photoQty[img.id] ?? 0;
                      return (
                        <div key={img.id} className="flex shrink-0 flex-col items-center gap-1">
                          <div
                            className={`relative size-20 shrink-0 overflow-hidden rounded border ${
                              qty > 0 ? "ring-primary ring-2" : ""
                            } ${stock <= 0 ? "opacity-30" : ""}`}
                            title={`Stock: ${stock}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="size-full object-cover" />
                            <span className="absolute bottom-0 right-0 bg-black/60 px-1 text-[10px] text-white">
                              {stock}
                            </span>
                            {qty > 0 && (
                              <span className="bg-primary text-primary-foreground absolute left-0 top-0 px-1 text-[10px] font-semibold">
                                {qty}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-6"
                              disabled={qty <= 0}
                              onClick={() => pickPhoto(i, img, -1)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-6"
                              disabled={qty <= 0}
                              onClick={() => clearPhoto(i, img.id)}
                            >
                              <X className="size-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-6"
                              disabled={qty >= stock}
                              onClick={() => pickPhoto(i, img, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
            {r.measureType === "duration" ? (
              <div className="grid gap-1">
                <Label className="text-xs">Min.</Label>
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  value={r.durationMinutes}
                  disabled={r.priceMode === "fixed"}
                  onChange={(e) =>
                    setRow(i, { durationMinutes: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="grid gap-1">
                <Label className="text-xs">Cant.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-20"
                  value={r.quantity}
                  disabled={trackedImages(
                    services
                      .find((s) => s.id === r.serviceId)
                      ?.variants.find((x) => x.id === r.variantId),
                  ).length > 0}
                  onChange={(e) => setRow(i, { quantity: e.target.value })}
                />
              </div>
            )}
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
