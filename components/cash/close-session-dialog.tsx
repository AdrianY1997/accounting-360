"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";

export function CloseSessionDialog({
  sessionId,
  expected,
  currency,
}: {
  sessionId: string;
  expected: string;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [counted, setCounted] = useState(expected);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const difference = (Number(counted) || 0) - Number(expected);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/cash-sessions/${sessionId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countedAmount: counted, notes }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "No se pudo cerrar la caja");
      return;
    }
    toast.success("Caja cerrada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Cerrar caja</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>
            Esperado en caja: {fmt.format(Number(expected))}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="counted">Monto contado</Label>
            <Input
              id="counted"
              type="number"
              step="0.01"
              min="0"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              required
            />
          </div>
          <p className="text-sm">
            Diferencia:{" "}
            <span
              className={
                difference === 0
                  ? ""
                  : difference > 0
                    ? "text-green-600"
                    : "text-destructive"
              }
            >
              {fmt.format(difference)}
            </span>
          </p>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Cerrando…" : "Cerrar caja"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
