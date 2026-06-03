"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Date-range filter that pushes ?from=&to= to the current route. */
export function PeriodFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    router.push(`${pathname}?from=${f}&to=${t}`);
  }

  return (
    <form onSubmit={apply} className="flex items-end gap-2">
      <div className="grid gap-1">
        <Label htmlFor="from" className="text-xs">
          Desde
        </Label>
        <Input
          id="from"
          type="date"
          value={f}
          onChange={(e) => setF(e.target.value)}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="to" className="text-xs">
          Hasta
        </Label>
        <Input
          id="to"
          type="date"
          value={t}
          onChange={(e) => setT(e.target.value)}
        />
      </div>
      <Button type="submit" variant="outline">
        Aplicar
      </Button>
    </form>
  );
}
