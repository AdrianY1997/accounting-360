import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { getSession } from "@/lib/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <SignInForm />
    </main>
  );
}
