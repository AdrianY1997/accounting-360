import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-side session access. Use in Server Components, route handlers, and
 * server actions. Business logic must verify tenant membership separately
 * (see requireActiveSalon / member checks added per feature).
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Require an authenticated session or redirect to sign-in. Returns the session.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
