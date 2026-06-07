import Image from "next/image";
import Link from "next/link";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { MainNav } from "@/components/main-nav";
import { OrgSwitcher } from "@/components/org-switcher";
import { ProductTour } from "@/components/product-tour";
import { SalonSwitcher } from "@/components/salon-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { listSwitchableOrganizations } from "@/services/organizations";
import { listSalons } from "@/services/salons";
import { can, isAdmin } from "@/lib/roles";
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
  const platformAdmin = Boolean(
    (session.user as { platformAdmin?: boolean }).platformAdmin,
  );
  const [salons, orgs] = await Promise.all([
    listSalons(ctx),
    listSwitchableOrganizations(ctx, platformAdmin),
  ]);
  const onboarded = Boolean(
    (session.user as { onboarded?: boolean }).onboarded,
  );

  return (
    <div className="flex min-h-svh flex-col">
      {ctx.impersonating && <ImpersonationBanner />}
      <header className="flex items-center justify-between border-b px-4 py-3">
        {/* <Link href="/dashboard" className="flex items-center">
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
        </Link> */}
        <MainNav
          role={ctx.role}
          permissions={ctx.permissions}
          platformAdmin={platformAdmin}
        />
        <div className="flex items-center gap-3 text-sm">
          <OrgSwitcher orgs={orgs} activeId={ctx.organizationId} />
          <SalonSwitcher salons={salons} activeId={ctx.salonId} />
          <span className="text-muted-foreground">{session.user.name}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
      {!onboarded && (
        <ProductTour
          caps={{
            sales: can(ctx, "sales:write"),
            clients: can(ctx, "clients:write"),
            catalog: can(ctx, "catalog:write"),
            cash: can(ctx, "cash:manage"),
            expenses: can(ctx, "expenses:write"),
            reports: can(ctx, "reports:view"),
            admin,
            platformAdmin,
          }}
        />
      )}
    </div>
  );
}
