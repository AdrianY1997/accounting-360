# Documentation Maintenance Rule

The project documentation must evolve together with the codebase.

When a phase, feature, module, API endpoint, database change, or major business
rule is completed:

- Update all relevant documentation immediately.
- Mark completed roadmap phases and tasks.
- Document architectural decisions and their rationale.
- Keep API documentation synchronized with the implementation.
- Keep database schema documentation synchronized with migrations.
- Record any deviations from the original plan.
- Document newly introduced dependencies and their purpose.
- Update future roadmap items if priorities or requirements change.

Documentation must never lag behind the implementation.

The repository should always allow a new developer or AI agent to understand the
current state of the project by reading the documentation — without inspecting
the entire codebase.

When uncertain whether a change requires documentation updates, update the
documentation.

Documentation lives in the `docs/` folder. This file (`AGENTS.md`) is the master
overview; `docs/` holds the detail.

---

# Project Overview

**salon360** is a complete accounting system for a beauty salon, designed from
day one to scale to multiple salons (a chain).

The initial version targets a single salon owner managing one or more salons,
with staff assigned per salon. The architecture must support future expansion
into:

- Multiple organizations (salon chains / franchises)
- Multiple salons (branches) per organization
- Staff with role-based access scoped per salon
- Mobile applications
- Double-entry bookkeeping (added in a later phase)
- Appointments / scheduling
- Advanced financial reports and digital payments

Accounting is the core of the product. Everything else (clients, services,
appointments) exists to feed accurate financial records.

---

# Core Principles

## Accounting First

The system is an accounting system before it is anything else. Every feature
that moves money (sales, payments, expenses, commissions, cash sessions) must
produce a correct, auditable financial record. Never sacrifice financial
correctness for UI convenience.

## Configurable, not country-locked

Currency and tax rate are configured **per salón** (`salon_settings`). Do not
hard-code a country's tax regime, currency, or invoice format. Country-specific
rules (electronic invoicing, payment rails) belong in optional later phases.

## API First

Business logic must never live exclusively in UI components. All critical
functionality is exposed through API endpoints (Next.js Route Handlers) backed
by a `services/` layer.

Current consumer: the Next.js web app. Future consumers: React Native app,
third-party integrations.

## Mobile First

All interfaces are designed for mobile first (salon staff use phones/tablets),
then tablet, then desktop.

## Simplicity First

Avoid premature optimization. Do not introduce microservices, event buses,
distributed systems, CQRS, or complex abstractions without a clear business
requirement.

## Scalability Ready

Even though the MVP may run a single salon, never assume one organization, one
salon, one user, or one currency. Every accounting record is scoped by
`organizationId` and `salonId` (the salón is a Better Auth `team`).

---

# Tech Stack

## Frontend

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn (style `radix-nova`) + `radix-ui` primitives, `lucide-react` icons

## Backend

- Next.js Route Handlers (`app/api/*`)
- Business rules in a `services/` layer (added per feature)

## Database

- PostgreSQL (Neon, `@neondatabase/serverless` HTTP driver)
- Drizzle ORM — schema-first, strict typing, migrations under version control

## Authentication

- **Better Auth** with the `organization` plugin (teams enabled).
- Email/password, **public sign-up disabled** — accounts are provisioned via
  organization invitations.
- See [docs/api.md](./docs/api.md#authentication).

## Validation

- Zod for all input validation (server-side, never trust the client).

---

# Multi-Tenant Model

salon360 maps its domain onto Better Auth's organization primitives:

| Domain concept        | Better Auth entity | Notes                                  |
| --------------------- | ------------------ | -------------------------------------- |
| Empresa / cadena      | `organization`     | Top-level tenant                       |
| Salón (sede)          | `team`             | A team **is** a salón                  |
| Staff (in empresa)    | `member`           | User + role within an organization     |
| Staff assigned a salón| `team_member`      | Links a user to a specific salón       |
| Invitation            | `invitation`       | How accounts are provisioned           |

Per-salón accounting config (currency, tax rate, timezone, address) lives in
`salon_settings` (one row per `team`). See [docs/database.md](./docs/database.md).

**Roles** (organization roles, refined later via access control): `owner`,
`admin`, `manager` (per salón), `cashier`, `staff` (stylist).

---

# Accounting Domain (target)

These are the Phase 1 entities (income/expense model). Double-entry comes later.

- **Clients** — customer records.
- **Service catalog** — service categories and services (price, duration).
- **Sales / Tickets** — a sale with line items (service or product), client,
  attending staff, subtotal / tax / total.
- **Payments** — payment methods (cash, card, transfer); split payments allowed.
- **Cash sessions (caja)** — open/close a register: opening balance, expected
  vs counted, cash movements.
- **Expenses** — expense categories, vendor, amount, per salón.
- **Commissions** — per staff / per service (% or fixed), computed from sales.
- **Categories** — income and expense categories.
- **Reports** — daily close, P&L per salón/period, sales by staff/service, tax
  summary.

See [docs/roadmap.md](./docs/roadmap.md) for what is built vs planned and
[docs/database.md](./docs/database.md) for the schema as implemented.

---

# Code Standards

## TypeScript

Strict mode required. Avoid `any`; prefer `unknown` or explicit types.

## Money

Never store or compute money as floating point. Use integer minor units or
Drizzle `numeric`. Tax rate is stored as a decimal (`numeric`, e.g. `0.19`).

## Components

Keep components small and separate UI, data fetching, and business logic.

### Componentization & reuse (required)

All UI must be built from components — no ad-hoc inline markup duplicated across
screens. Before creating any new UI element:

1. Consult the component map in [docs/components.md](./docs/components.md) first.
2. Never reuse or extend a component you don't actually understand. If the map
   row lacks detail you need, open that one component file, confirm, then
   improve its row.
3. Reuse as-is if it fits; extend/adapt (a `cva` variant, optional prop, or
   wrapper) if it nearly fits; only create new when nothing reasonable exists.

Keep `docs/components.md` in sync in the same change.

## Server Logic

Business rules belong in `services/` and route handlers, never inside React
components.

## Security

Always validate inputs on the server, hash passwords (handled by Better Auth),
protect private routes, and verify that the acting user belongs to the
organization/salón of every resource they touch. Never trust client validation.

---

# Project Layout

```text
app/                 routes — pages (UI) and route handlers (api/*)
  api/auth/[...all]/  Better Auth catch-all handler
db/
  schema/            one file per concern (auth.ts generated, salon.ts, ...)
    index.ts         barrel — `import * as schema from "@/db/schema"`
    _shared.ts       shared column helpers (timestamps)
  migrations/        drizzle-kit SQL migrations (version controlled)
  index.ts           Drizzle client (neon-http)
lib/
  env.ts             zod-validated environment access
  auth.ts            Better Auth server instance
  auth-client.ts     Better Auth browser client
components/
  ui/                shadcn primitives
docs/                see Documentation Maintenance Rule
```

---

# Commands

```bash
pnpm dev            # Next dev server (Turbopack)
pnpm build          # production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm db:generate    # generate SQL migration from schema
pnpm db:migrate     # apply migrations
pnpm db:push        # push schema directly (dev only)
pnpm db:studio      # Drizzle Studio
pnpm auth:generate  # regenerate db/schema/auth.ts from Better Auth config
```

After changing `lib/auth.ts` (plugins, additional fields), run `pnpm
auth:generate` then `pnpm db:generate` to keep the auth schema and migrations in
sync.

---

# Agent Instructions

When implementing features:

1. Prioritize accounting correctness and simplicity.
2. Preserve API compatibility; design for future mobile clients.
3. Maintain mobile-first UX.
4. Keep multi-tenant scoping (`organizationId` / `salonId`) on every record.
5. Do not hard-code currency or tax — read `salon_settings`.
6. Never introduce breaking schema changes without a migration.
7. Componentize all UI; check [docs/components.md](./docs/components.md) before
   creating a component and keep the map in sync.
8. Update documentation in the same change (Documentation Maintenance Rule).
9. Record notable changes in [docs/changelog.md](./docs/changelog.md).
10. Commits are at the agent's discretion — commit completed, verified units of
    work using Conventional Commits. Do not push unless explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This is Next.js 16 with breaking changes — APIs, conventions, and file structure
may differ from training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing framework code. Notably: route
handler `params` are async (`await ctx.params`), and route handlers are not
cached by default. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
