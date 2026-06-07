"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { can, type Permission } from "@/lib/roles";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  platform?: boolean;
  perm?: Permission;
};

const LINKS: NavLink[] = [
  { href: "/dashboard", label: "Panel" },
  { href: "/clients", label: "Clientes", perm: "clients:write" },
  { href: "/catalog", label: "Catálogo", perm: "catalog:write" },
  { href: "/sales", label: "Ventas", perm: "sales:write" },
  { href: "/cash", label: "Caja", perm: "cash:manage" },
  { href: "/expenses", label: "Gastos", perm: "expenses:write" },
  { href: "/commissions", label: "Comisiones", perm: "reports:view" },
  { href: "/reports", label: "Reportes", perm: "reports:view" },
  { href: "/staff", label: "Personal", perm: "staff:manage" },
  { href: "/settings", label: "Configuración", perm: "settings:manage" },
  { href: "/platform", label: "Plataforma", platform: true },
];

export function MainNav({
  role,
  permissions,
  platformAdmin,
}: {
  role: string;
  permissions: Permission[];
  platformAdmin: boolean;
}) {
  const pathname = usePathname();
  const access = { role, permissions };
  const links = LINKS.filter(
    (l) =>
      (!l.platform || platformAdmin) && (!l.perm || can(access, l.perm)),
  );
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop */}
      <nav className="mr-auto hidden items-center gap-4 text-sm lg:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            data-tour={l.href}
            className={cn(
              "hover:text-foreground transition-colors",
              isActive(l.href) ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile */}
      <div className="mr-auto ml-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menú">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {links.map((l) => (
              <DropdownMenuItem key={l.href} asChild>
                <Link href={l.href}>{l.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
