import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo-icon.png"
            alt="salon360"
            width={32}
            height={32}
            priority
            className="size-8 w-auto dark:hidden"
          />
          <Image
            src="/logo-icon-dark.png"
            alt="salon360"
            width={32}
            height={32}
            priority
            className="size-8 w-auto hidden dark:block"
          />
        </Link>
        <nav className="ml-6 mr-auto flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            Panel
          </Link>
          <Link
            href="/clients"
            className="text-muted-foreground hover:text-foreground"
          >
            Clientes
          </Link>
          <Link
            href="/catalog"
            className="text-muted-foreground hover:text-foreground"
          >
            Servicios
          </Link>
          <Link
            href="/sales"
            className="text-muted-foreground hover:text-foreground"
          >
            Ventas
          </Link>
          <Link
            href="/cash"
            className="text-muted-foreground hover:text-foreground"
          >
            Caja
          </Link>
          <Link
            href="/expenses"
            className="text-muted-foreground hover:text-foreground"
          >
            Gastos
          </Link>
          <Link
            href="/commissions"
            className="text-muted-foreground hover:text-foreground"
          >
            Comisiones
          </Link>
          <Link
            href="/reports"
            className="text-muted-foreground hover:text-foreground"
          >
            Reportes
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground"
          >
            Configuración
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.name}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
