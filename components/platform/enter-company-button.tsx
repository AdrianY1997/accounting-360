"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Platform admin: enter (impersonate) a client company. */
export function EnterCompanyButton({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await fetch("/api/active-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo entrar a la empresa");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={loading}>
      <LogIn className="size-4" />
      Entrar
    </Button>
  );
}
