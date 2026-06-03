"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SalonSettings } from "@/services/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ settings }: { settings?: SalonSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      currency: String(form.get("currency") ?? ""),
      taxRatePercent: String(form.get("taxRatePercent") ?? "0"),
      timezone: String(form.get("timezone") ?? ""),
      address: String(form.get("address") ?? ""),
      phone: String(form.get("phone") ?? ""),
    };
    setLoading(true);
    const res = await fetch("/api/salon-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo guardar");
      return;
    }
    toast.success("Configuración guardada");
    router.refresh();
  }

  const taxPercent = settings ? Number(settings.taxRate) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del salón</CardTitle>
        <CardDescription>
          Moneda e impuesto se aplican a nuevas ventas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-md gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Moneda (ISO)</Label>
              <Input
                id="currency"
                name="currency"
                maxLength={3}
                required
                defaultValue={settings?.currency ?? "USD"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRatePercent">Impuesto (%)</Label>
              <Input
                id="taxRatePercent"
                name="taxRatePercent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                defaultValue={taxPercent}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              required
              defaultValue={settings?.timezone ?? "UTC"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={settings?.address ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={settings?.phone ?? ""} />
          </div>
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
