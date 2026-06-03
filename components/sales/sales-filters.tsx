"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";
const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Parcial" },
  { value: "paid", label: "Pagada" },
  { value: "void", label: "Anulada" },
];

/** Sales list filters: payment status (instant). */
export function SalesFilters({ status }: { status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setStatus(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL) next.delete("status");
    else next.set("status", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <Select value={status ?? ALL} onValueChange={setStatus}>
      <SelectTrigger className="h-9 w-44">
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos los estados</SelectItem>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
