"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Search box that pushes `?<param>=` to the current route (merges existing).
 * `basePath` targets another route instead (e.g. the store listing from a
 * detail page). With `shallow`, same-route updates use history.replaceState
 * (no navigation) — used by client-side filtered views like the public store.
 */
export function SearchInput({
  param = "q",
  placeholder = "Buscar…",
  shallow = false,
  basePath,
}: {
  param?: string;
  placeholder?: string;
  shallow?: boolean;
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get(param) ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const target = basePath ?? pathname;
    const next = new URLSearchParams(
      target === pathname ? params.toString() : "",
    );
    if (value.trim()) next.set(param, value.trim());
    else next.delete(param);
    const qs = next.toString();
    const url = qs ? `${target}?${qs}` : target;
    if (shallow && target === pathname) window.history.replaceState(null, "", url);
    else router.push(url);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xs">
      <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </form>
  );
}
