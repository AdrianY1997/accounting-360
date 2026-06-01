"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      <span className="sr-only sm:not-sr-only">Salir</span>
    </Button>
  );
}
