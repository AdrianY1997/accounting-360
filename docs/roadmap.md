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

## Phase 1 — MVP accounting (income/expense)

Each feature splits into **API** (services + route handlers) and **UI** (screens).

### Auth & access

- [x] Sign-in page + auth-gated app shell (mobile-first) — `requireSession`
- [x] First admin + empresa + salón bootstrap via `pnpm db:seed`
- [ ] Organization (empresa) + salón (team) creation/selection from UI
- [ ] Staff invitations + role assignment; per-salón assignment (`team_member`)
- [ ] `requireMember()` / role guards; resource ownership checks

### Salón settings

- [ ] API + UI to edit `salon_settings` (currency, tax rate, timezone, address)

### Clients

- [ ] API — CRUD, scoped by salón
- [ ] UI — list, create, edit, delete

### Service catalog

- [ ] API — service categories + services (price, duration)
- [ ] UI — manage categories and services

### Sales / Tickets

- [ ] API — create sale (line items, client, staff, tax from `salon_settings`)
- [ ] UI — point-of-sale ticket entry

### Payments

- [ ] API — register payment(s) per sale (cash/card/transfer, split)
- [ ] UI — payment capture on a ticket

### Cash sessions (caja)

- [ ] API — open/close session, record movements, expected vs counted
- [ ] UI — open/close caja, daily movements

### Expenses

- [ ] API — expense categories + expenses (vendor, amount, salón)
- [ ] UI — register and list expenses

### Commissions

- [ ] API — commission rules per staff/service; compute from sales
- [ ] UI — configure rules, view earned commissions

### Reports

- [ ] Daily close (cierre diario) — UI + API
- [ ] P&L per salón / period; sales by staff/service; tax summary

## Phase 2 — Multi-salón advanced

- [ ] Consolidated chain reports across salones
- [ ] Fine-grained permissions per salón (access control)
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
