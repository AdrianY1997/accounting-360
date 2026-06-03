"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SalonOption } from "@/services/salons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Active-salón selector. Sets the cookie via the API then refreshes. */
export function SalonSwitcher({
  salons,
  activeId,
}: {
  salons: SalonOption[];
  activeId: string;
}) {
  const router = useRouter();
  if (salons.length < 2) return null;

  async function onChange(salonId: string) {
    const res = await fetch("/api/active-salon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId }),
    });
    if (!res.ok) {
      toast.error("No se pudo cambiar de salón");
      return;
    }
    router.refresh();
  }

  return (
    <Select value={activeId} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {salons.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
