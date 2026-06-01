import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
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
            className="size-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
