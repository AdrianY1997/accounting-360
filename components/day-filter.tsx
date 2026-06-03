"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Single-day picker that pushes `?date=YYYY-MM-DD` to the current route. */
export function DayFilter({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("date", value);
    else next.delete("date");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1">
        <Label htmlFor="date" className="text-xs">
          Día
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
