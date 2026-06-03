"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Shown when a platform admin is operating a client company. */
export function ImpersonationBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exit() {
    setLoading(true);
    const res = await fetch("/api/active-org", { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo salir");
      return;
    }
    router.push("/platform");
    router.refresh();
  }

  return (
    <div className="bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center gap-3 border-b px-4 py-1.5 text-sm">
      <span>Operando una empresa cliente (modo plataforma).</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7"
        onClick={exit}
        disabled={loading}
      >
        Salir
      </Button>
    </div>
  );
}
