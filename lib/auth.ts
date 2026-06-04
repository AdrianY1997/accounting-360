import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import { env } from "@/lib/env";

/**
 * Better Auth server instance.
 *
 * Multi-tenant model (see AGENTS.md):
 *   organization = empresa / cadena de salones
 *   team         = salón (sede) within an organization
 *   member       = staff (user) in an organization, with a role
 *
 * No public sign-up: accounts are provisioned via organization invitations.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  user: {
    additionalFields: {
      // Platform-level super admin (above all organizations). Set server-side
      // only (seed / by another platform admin); never accepted from input.
      platformAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      // First-run interactive tour completed (set via /api/onboarding/complete).
      onboarded: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    organization({
      teams: { enabled: true },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
