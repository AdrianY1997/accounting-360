"use client";

import { useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

const modes = [
  { showPrices: false, label: "Sin precios" },
  { showPrices: true, label: "Con precios" },
] as const;

/**
 * Copies a reseller's catalog link (`/s/<token>`): pick the intermediario,
 * then copy (creates the link on first use) or rotate (the old URL stops
 * working) either its priceless or priced link — each mode is its own
 * independent link/token, so rotating one never touches the other.
 */
export function ResellerLinkCopier({
  resellers,
}: {
  resellers: { id: string; fullName: string }[];
}) {
  const [clientId, setClientId] = useState(NONE);
  const [loading, setLoading] = useState(false);

  async function copyLink(showPrices: boolean, rotate: boolean) {
    if (clientId === NONE) {
      toast.error("Selecciona un intermediario");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reseller-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, showPrices, rotate }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo generar el link");
      return;
    }
    const { token } = await res.json();
    const url = `${window.location.origin}/s/${token}`;
    const label = showPrices ? "Link con precios" : "Link sin precios";
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        rotate
          ? `${label} regenerado y copiado (el anterior dejó de funcionar)`
          : `${label} copiado`,
      );
    } catch {
      toast.error(`No se pudo copiar — el link es: ${url}`);
    }
  }

  if (resellers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={clientId} onValueChange={setClientId}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Link intermediario…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Link intermediario…</SelectItem>
          {resellers.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clientId !== NONE && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {modes.map((m) => (
            <div key={m.label} className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">{m.label}:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => copyLink(m.showPrices, false)}
                title={`Copiar catálogo ${m.label.toLowerCase()} para este intermediario`}
              >
                <Link2 className="size-4" />
                Copiar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => copyLink(m.showPrices, true)}
                aria-label={`Regenerar link ${m.label.toLowerCase()} (el anterior deja de funcionar)`}
                title={`Regenerar link ${m.label.toLowerCase()} (el anterior deja de funcionar)`}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
