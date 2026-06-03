# Roadmap

Phases mirror the target described in [AGENTS.md](../AGENTS.md). Checkboxes
reflect actual progress. The accounting model is **hybrid by phases**: start with
an income/expense model (Phase 1), add formal double-entry bookkeeping later
(Phase 4).

## Access model

- **No public registration** — accounts are provisioned via organization
  invitations (Better Auth `invitation`).
- **Multi-tenant**: every record is scoped by organization (empresa) and salón
  (`team`). No cross-organization data sharing.
- Roles: `owner`, `admin`, `manager` (per salón), `cashier`, `staff` (stylist).

## Phase 0 — Foundation (complete)

- [x] Next.js 16 scaffold (App Router, Tailwind v4, pnpm), `app/` at root, `@/*` → root
- [x] shadcn (`radix-nova`) initialized
- [x] Drizzle ORM + Neon HTTP driver, schema-first; `drizzle.config.ts`
- [x] Validated env access (`lib/env.ts`, zod)
- [x] Better Auth + organization plugin (teams enabled); sign-up disabled
- [x] Auth schema generated (`db/schema/auth.ts`) + catch-all route handler
- [x] `salon_settings` (per-salón currency / tax rate / timezone)
- [x] Initial migration generated (`db/migrations/0000_*.sql`)
- [x] Documentation (`AGENTS.md`, `docs/*`)

> Migration applied to Neon. Run `pnpm db:seed` to bootstrap the first admin
> (`admin@salon360.local` / `changeme123` unless overridden) + one empresa and
> salón.

## Phase 1 — MVP accounting (income/expense) — complete

Each feature splits into **API** (services + route handlers) and **UI** (screens).

### Auth & access

- [x] Sign-in page + auth-gated app shell (mobile-first) — `requireSession`
- [x] First admin + empresa + salón bootstrap via `pnpm db:seed`
- [x] Salón creation (admin) + active-salón selector (cookie) — `/api/salons`,
  `/api/active-salon`, header `SalonSwitcher`
- [x] Staff provisioning (admin creates users — sign-up stays disabled) + role
  assignment + per-salón assignment (`team_member`) — `/staff`, `/api/staff`
- [x] Role guards (`isAdmin`): config, staff, commission rules, settings are
  admin-only (403 otherwise); admin-only nav/pages hidden + redirected

### Salón settings

- [x] API + UI to edit `salon_settings` (currency, tax rate, timezone, address,
  phone) — `/settings`, `/api/salon-settings`. Activates tax on new sales.

### Module connections (MVP)

- [x] Cash expenses (`payment_method = cash`) reduce the cash session's expected
  amount (no duplicate movement; single source).
- [x] Commissions for the period are subtracted in the P&L
  (profit = income − expenses − commissions).

### Clients

- [x] API — CRUD, scoped by salón (`/api/clients`, `/api/clients/:id`)
- [x] UI — list, create, edit, delete (`/clients`)

### Service catalog

- [x] API — service categories + services (price, duration), scoped by salón
- [x] UI — manage categories and services (`/catalog`)

### Sales / Tickets

- [x] API — create sale (line items, client, per-item staff, tax snapshot from
  `salon_settings`); list, detail, soft-void (`/api/sales`, `/api/sales/:id`)
- [x] UI — new sale (dynamic items, live totals), list, detail with void
      (`/sales`, `/sales/new`, `/sales/:id`)

### Payments

- [x] API — register payment(s) per sale (cash/card/transfer/other, split,
  partial; payment status derived) — `/api/sales/:id/payments`,
  `/api/payments/:id`
- [x] UI — payment at sale time (POS) + add/remove payments in sale detail;
  pending/partial/paid status, balance

### Cash sessions (caja)

- [x] API — open/close session, cash movements (in/out), expected (opening +
  cash payments in window + movements) vs counted, difference
- [x] UI — `/cash`: open form, current session breakdown, movements (add/remove),
  close dialog (live difference), history; `/cash/:id` closed session summary

### Expenses

- [x] API — expense categories + expenses (category, vendor, amount, payment
  method, date), scoped by salón
- [x] UI — `/expenses`: register/edit/list expenses + manage categories

### Commissions

- [x] API — commission rules (per staff/service, percent/fixed, wildcards);
  compute earned from sales (most-specific rule wins), `/api/commission-rules`,
  `/api/commissions`
- [x] UI — `/commissions`: rules CRUD + earnings by staff for a period

### Reports

- [x] P&L per salón / period (income − expenses), sales by staff/service,
  payments by method, tax summary — `/reports`, `/api/reports`
- [x] Daily close (cierre diario) dedicated view — `/reports/daily`: day picker,
  sales/collected/expenses/profit, payments by method, day's cash sessions

### Demo polish (complete)

- [x] Dashboard with real KPIs (today/month sales, profit, receivables, caja, top services)
- [x] Responsive nav (mobile menu), empty states + loading skeletons, inline form errors
- [x] Search on clients/services/expenses; sales status + date filters
- [x] Printable sale receipt (`/print/sales/:id`) + company logo/branding in settings

## Platform — multi-company (SaaS)

- [x] `user.platform_admin` + `/platform` onboarding (org + owner + first salón)
- [x] Organization switcher (multi-org login); active org/salón via cookies
- [x] Org impersonation by platform admin — "Entrar" from `/platform` sets the
  active org cookie; `requireSalonContext` lets a platform admin operate any org
  as `admin` (banner + Salir to exit)
- [ ] Billing / plans / per-company limits

### Permissions & correctness (complete)

- [x] Fine-grained role permissions (`lib/roles.ts` `can()` matrix): per-capability
  gates on every operational route (clients/catalog/sales/payments/cash/expenses)
  plus reports view; admin-only config/staff/commission rules. UI follows: nav,
  page redirects, and write buttons hidden per permission.
- [x] Live cross-module UI updates: `staleTimes { dynamic: 0 }` so navigating
  between modules always refetches (no manual reload).

## Phase 2 — Multi-salón advanced

- [ ] Consolidated chain reports across salones
- [ ] Refunds / returns flow (reverse payments + caja)
- [ ] Password recovery (admin-initiated and/or email)

## Phase 3 — Inventory / products

- [ ] Products, stock, purchases, cost, margin
- [ ] Products as sale line items

## Phase 4 — Double-entry bookkeeping

- [ ] Chart of accounts
- [ ] Journal entries auto-generated from sales / expenses / payments
- [ ] General ledger, trial balance, balance sheet

## Phase 5 — Appointments / scheduling

- [ ] Appointments / agenda; booking → generates a sale

## Phase 6 — Advanced reporting

- [ ] PDF / Excel exports
- [ ] Statistics dashboards
- [ ] Audit logs

## Phase 7 — Mobile app

- [ ] Expo + React Native client consuming the existing API

## Phase 8 — Digital payments / e-invoicing

- [ ] Payment gateway integrations
- [ ] Electronic invoicing (country-specific, optional per deployment)
