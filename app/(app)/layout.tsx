import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { SalonSwitcher } from "@/components/salon-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { listSalons } from "@/services/salons";
import { isAdmin } from "@/lib/roles";
import { requireSession } from "@/lib/session";
import { requireSalonContext } from "@/lib/tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const ctx = await requireSalonContext();
  const admin = isAdmin(ctx.role);
  const salons = await listSalons(ctx);

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
        <MainNav admin={admin} />
        <div className="flex items-center gap-3 text-sm">
          <SalonSwitcher salons={salons} activeId={ctx.salonId} />
          <span className="text-muted-foreground">{session.user.name}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
