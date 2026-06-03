"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Search box that pushes `?<param>=` to the current route (merges existing). */
export function SearchInput({
  param = "q",
  placeholder = "Buscar…",
}: {
  param?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get(param) ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set(param, value.trim());
    else next.delete(param);
    router.push(`${pathname}?${next.toString()}`);
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
