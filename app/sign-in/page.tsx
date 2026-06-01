import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative flex min-h-svh items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <SignInForm />
    </main>
  );
}
