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

/**
 * Copies a reseller's priceless catalog link (`/s/<token>`): pick the
 * intermediario, copy (creates the link on first use) or rotate it (the old
 * URL stops working).
 */
export function ResellerLinkCopier({
  resellers,
}: {
  resellers: { id: string; fullName: string }[];
}) {
  const [clientId, setClientId] = useState(NONE);
  const [loading, setLoading] = useState(false);

  async function copyLink(rotate: boolean) {
    if (clientId === NONE) {
      toast.error("Selecciona un intermediario");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reseller-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, rotate }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo generar el link");
      return;
    }
    const { token } = await res.json();
    const url = `${window.location.origin}/s/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        rotate
          ? "Link regenerado y copiado (el anterior dejó de funcionar)"
          : "Link sin precios copiado",
      );
    } catch {
      toast.error(`No se pudo copiar — el link es: ${url}`);
    }
  }

  if (resellers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || clientId === NONE}
        onClick={() => copyLink(false)}
        title="Copiar catálogo sin precios para este intermediario"
      >
        <Link2 className="size-4" />
        Copiar
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={loading || clientId === NONE}
        onClick={() => copyLink(true)}
        aria-label="Regenerar link (el anterior deja de funcionar)"
        title="Regenerar link (el anterior deja de funcionar)"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );
}
