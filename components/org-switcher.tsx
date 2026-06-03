"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrgOption } from "@/services/organizations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Active-organization selector (shown only for multi-org users). */
export function OrgSwitcher({
  orgs,
  activeId,
}: {
  orgs: OrgOption[];
  activeId: string;
}) {
  const router = useRouter();
  if (orgs.length < 2) return null;

  async function onChange(organizationId: string) {
    const res = await fetch("/api/active-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    if (!res.ok) {
      toast.error("No se pudo cambiar de empresa");
      return;
    }
    toast.success("Empresa cambiada");
    router.refresh();
  }

  return (
    <Select value={activeId} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {orgs.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
