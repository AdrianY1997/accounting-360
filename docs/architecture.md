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
  sign-up disabled; accounts are admin-provisioned. See
  [api.md](./api.md#authentication).
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

Business logic stays out of React components: route handlers stay thin and call
the `services/` layer; the same services back the Server Component pages.

```text
db/                 Drizzle schema, client, migrations, seed
  schema/           one file per concern (auth.ts generated, salon, client,
                    catalog, sale, payment, cash, expense, commission)
  index.ts          db client (neon-http)
lib/                cross-cutting: env, auth, auth-client, session, tenant,
                    roles, money, period, utils, validations/*
services/           business rules per resource (clients, catalog, sales,
                    payments, cash, expenses, commissions, reports, staff,
                    salons, organizations, settings, platform)
app/                routes — pages (UI) and route handlers (api/*)
  (app)/            auth-gated route group (header + nav; requireSalonContext)
  api/              REST endpoints; api/auth/ = Better Auth catch-all
  print/            chrome-less printable views (e.g. sale receipt)
components/         UI components (ui/ = shadcn primitives; feature folders)
```

Every domain route handler resolves tenant scope via
`requireSalonContext()` (`lib/tenant.ts`) → `{ userId, organizationId, salonId,
role }`; services filter every query by it.

## Authentication & access

Better Auth owns the `user` (with a `platform_admin` flag), `session`,
`account`, `verification` tables plus the organization tables (`organization`,
`team`, `team_member`, `member`, `invitation`). The catch-all handler at
`app/api/auth/[...all]/route.ts` exposes all auth endpoints. The browser uses
`lib/auth-client.ts`; server code uses `lib/auth.ts`.

Public registration is disabled (`emailAndPassword.disableSignUp`). Accounts are
**provisioned by admins**, not via self sign-up or invitation emails:

- **Platform admin** (`user.platform_admin`) onboards client companies at
  `/platform` (org + owner + first salón).
- **Org admins** (`owner`/`admin`) provision staff at `/staff` and assign roles +
  a salón. Roles (`lib/roles.ts`): `owner`, `admin`, `manager`, `cashier`,
  `staff`; `isAdmin` gates config/staff/destructive routes (403 otherwise).
- Active organization and salón are selected via header switchers, persisted in
  the `activeOrgId` / `activeSalonId` cookies and honored by
  `requireSalonContext`.

## Money & correctness

Money is never floating point. Tax rate is a Drizzle `numeric` decimal (e.g.
`0.19`). Amounts (Phase 1+) use integer minor units or `numeric`. See
[AGENTS.md](../AGENTS.md#money).

## Dev server

`pnpm dev` runs Next with Turbopack (default).

## Current state

Phase 1 (MVP accounting) complete: auth + admin-provisioned staff, roles/guards,
multi-salón with active-salón switching, clients, service catalog, sales/tickets,
payments (split/partial), cash sessions (caja), expenses, commissions, and
reports (P&L). Cross-module money flows are wired (cash payments and cash
expenses feed caja; commissions reduce P&L profit) and consistent for voided
sales. Platform layer onboards client companies (multi-company SaaS). Demo
polish: dashboard KPIs, responsive nav, search/filters, printable receipt,
branding. See [roadmap.md](./roadmap.md) and [changelog.md](./changelog.md).

Known gaps (see `docs/notes.md`): cross-module UI updates need a page refresh
(no live refetch); role permissions are coarse (`isAdmin` only — non-admins can
still operate all operational modules); cash expenses reflect in caja by amount
but there is no refund/return flow.
