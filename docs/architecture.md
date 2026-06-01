# Architecture

salon360 is an accounting system for beauty salons, built as a single Next.js
app serving both UI and API. It is designed API-first so future React Native /
admin clients can reuse the same endpoints, and multi-tenant so it scales from
one salón to a chain.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack). ⚠️ This Next.js has
  breaking changes vs training data — consult `node_modules/next/dist/docs/`
  before writing framework code. Route handler `params` are async; route
  handlers are not cached by default.
- **Language**: TypeScript, strict mode. No `any` — prefer `unknown` / explicit.
- **UI**: React 19, Tailwind CSS v4, shadcn (style `radix-nova`), `radix-ui`
  primitives, `lucide-react` icons.
- **Database**: PostgreSQL (Neon) + Drizzle ORM. See [database.md](./database.md).
- **Auth**: Better Auth + `organization` plugin (teams enabled). Email/password,
  sign-up disabled (invite-only). See [api.md](./api.md#authentication).
- **Validation**: Zod.

## Multi-tenancy

The domain maps onto Better Auth organization primitives:

- `organization` = empresa / cadena (top-level tenant)
- `team` = salón (sede)
- `member` = staff in an organization (with role)
- `team_member` = staff assigned to a specific salón
- `salon_settings` = per-salón currency, tax rate, timezone (one row per team)

Every accounting record (added in Phase 1+) is scoped by `organizationId` and
`salonId`. See [AGENTS.md](../AGENTS.md#multi-tenant-model).

## Layering

Business logic stays out of React components.

```text
db/                 Drizzle schema, client, migrations
  schema/           one file per concern (auth.ts generated, salon.ts)
  index.ts          db client (neon-http)
lib/                cross-cutting (env, auth, auth-client)
app/                routes — pages (UI) and route handlers (api/*)
  api/auth/         Better Auth catch-all handler
components/         UI components (ui/ = shadcn primitives)
```

Planned: `services/` for business rules consumed by route handlers, keeping
handlers thin and logic reusable across future clients.

## Authentication flow

Better Auth owns the `user`, `session`, `account`, `verification` tables plus the
organization tables (`organization`, `team`, `team_member`, `member`,
`invitation`). The catch-all handler at `app/api/auth/[...all]/route.ts` exposes
all auth endpoints. The browser uses `lib/auth-client.ts`; server code uses
`lib/auth.ts`.

Public registration is disabled (`emailAndPassword.disableSignUp`). New accounts
are created through organization invitations.

## Money & correctness

Money is never floating point. Tax rate is a Drizzle `numeric` decimal (e.g.
`0.19`). Amounts (Phase 1+) use integer minor units or `numeric`. See
[AGENTS.md](../AGENTS.md#money).

## Dev server

`pnpm dev` runs Next with Turbopack (default).

## Current state

Foundation only (Phase 0): Next.js scaffold, Drizzle + Neon DB layer, Better
Auth with the organization plugin, `salon_settings`, validated env, and the
initial migration. No accounting features yet. See [roadmap.md](./roadmap.md).
