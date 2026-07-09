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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { storeTypes } from "@/lib/store-types";

export function SettingsForm({ settings }: { settings?: SalonSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? "");
  const [storeType, setStoreType] = useState(settings?.storeType ?? "generic");
  const [uploading, setUploading] = useState(false);

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const res = await fetch("/api/salon-settings/logo", {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo subir el logo");
      return;
    }
    const data = await res.json();
    setLogoUrl(data.logoUrl ?? "");
    toast.success("Logo actualizado");
    router.refresh();
  }

  async function onRemoveLogo() {
    setUploading(true);
    const res = await fetch("/api/salon-settings/logo", { method: "DELETE" });
    setUploading(false);
    if (!res.ok) {
      toast.error("No se pudo quitar el logo");
      return;
    }
    setLogoUrl("");
    toast.success("Logo eliminado");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      currency: String(form.get("currency") ?? ""),
      taxRatePercent: String(form.get("taxRatePercent") ?? "0"),
      timezone: String(form.get("timezone") ?? ""),
      address: String(form.get("address") ?? ""),
      phone: String(form.get("phone") ?? ""),
      logoUrl,
      storeType,
      whatsapp: String(form.get("whatsapp") ?? ""),
      shippingInfo: String(form.get("shippingInfo") ?? ""),
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
      const msg = data.error ?? "No se pudo guardar";
      setError(msg);
      toast.error(msg);
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
          <div className="grid gap-2">
            <Label>Tipo de tienda</Label>
            <Select value={storeType} onValueChange={setStoreType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storeTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Define qué atributos extra piden los productos y muestra la
              tienda (material, medidas, modo de uso…).
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp (tienda)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              placeholder="+57 300 000 0000"
              defaultValue={settings?.whatsapp ?? ""}
            />
            <p className="text-muted-foreground text-xs">
              Botón flotante y &quot;¿Tienes dudas?&quot; de la tienda pública.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shippingInfo">Información de envíos</Label>
            <Textarea
              id="shippingInfo"
              name="shippingInfo"
              rows={4}
              maxLength={4000}
              placeholder="Envíos a todo el país, 2 a 3 días hábiles…"
              defaultValue={settings?.shippingInfo ?? ""}
            />
            <p className="text-muted-foreground text-xs">
              Se muestra como pestaña &quot;Envíos&quot; en cada producto de la
              tienda.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Logo (recibo)</Label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo del salón"
                  className="bg-muted size-16 rounded-md border object-contain"
                />
              ) : (
                <div className="bg-muted text-muted-foreground grid size-16 place-items-center rounded-md border text-xs">
                  Sin logo
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onUploadLogo}
                    disabled={uploading}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>{uploading ? "Subiendo…" : "Subir imagen"}</span>
                  </Button>
                </label>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={onRemoveLogo}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
            <Label htmlFor="logoUrl" className="text-muted-foreground">
              o URL externa
            </Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              placeholder="https://…"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
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
