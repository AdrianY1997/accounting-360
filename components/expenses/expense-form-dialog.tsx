"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ExpenseCategory } from "@/services/expenses";

/** Minimal shape needed to prefill the edit form (matches list projection). */
type EditableExpense = {
  id: string;
  categoryId: string | null;
  vendor: string | null;
  description: string | null;
  amount: string;
  paymentMethod: string | null;
  expenseDate: Date | string;
};
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
import { paymentMethods, paymentMethodLabels } from "@/lib/validations/payment";

const NONE = "__none__";

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export function ExpenseFormDialog({
  expense,
  categories,
  trigger,
}: {
  expense?: EditableExpense;
  categories: ExpenseCategory[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? NONE);
  const [method, setMethod] = useState(expense?.paymentMethod ?? NONE);
  const editing = Boolean(expense);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      categoryId: categoryId === NONE ? null : categoryId,
      vendor: String(form.get("vendor") ?? ""),
      description: String(form.get("description") ?? ""),
      amount: String(form.get("amount") ?? "0"),
      paymentMethod: method === NONE ? null : method,
      expenseDate: String(form.get("expenseDate") ?? ""),
    };
    setLoading(true);
    const res = await fetch(
      editing ? `/api/expenses/${expense!.id}` : "/api/expenses",
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
    toast.success(editing ? "Gasto actualizado" : "Gasto registrado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={expense?.amount ?? "0"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expenseDate">Fecha</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                required
                defaultValue={toDateInput(expense?.expenseDate ?? new Date())}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin categoría</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vendor">Proveedor</Label>
            <Input id="vendor" name="vendor" defaultValue={expense?.vendor ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label>Método de pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {paymentMethodLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              name="description"
              defaultValue={expense?.description ?? ""}
            />
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
