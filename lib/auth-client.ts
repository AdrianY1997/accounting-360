import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Better Auth browser client. Use in client components for sign-in,
 * session, and organization (salón chain) operations.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const { signIn, signOut, useSession } = authClient;
