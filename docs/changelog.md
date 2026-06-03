# Changelog

All relevant project changes are recorded here (most recent first).

## Phase 1 — Role permissions + live updates

- **Permissions**: capability matrix `can(role, permission)` in `lib/roles.ts`
  (clients/catalog/sales/payments/cash/expenses writes, `sales:void`,
  `reports:view`; admin keeps config/staff/commission rules). Enforced
  server-side on every operational route (403) and mirrored in the UI: nav
  filtered by permission, page redirects for gated routes, hidden write/void
  actions and the commissions rules section. Fixes `notes.md` #3 (e.g. staff can
  no longer edit the catalog).
- **Live cross-module updates**: `experimental.staleTimes { dynamic: 0 }` so
  navigating between modules always refetches — no manual reload (`notes.md` #2).

## Phase 1 — Demo polish (search, receipt, branding)

- **Search/filters**: `SearchInput` (pushes `?q=`); server-side `ilike` filters
  on clients (name/phone/email), services (name), expenses (vendor/description).
  Sales gain a payment-status filter (`SalesFilters`) + optional date range in
  `listSales`.
- **Printable receipt**: `/print/sales/[id]` (outside the app chrome) — company +
  salón header with optional logo, items, totals, payments, balance; `PrintButton`.
  "Recibo" link from the sale detail.
- **Branding**: `salon_settings.logo_url` (migration 0009) editable in settings;
  shown on the receipt.
- **Consistency**: success toasts on the org/salón switchers; all destructive
  actions already confirm via AlertDialog and toast.

## Platform — organization switcher

- `requireSalonContext` now resolves the active organization from an
  `activeOrgId` cookie (cookie > Better Auth active org > first membership);
  switching org clears `activeSalonId` so the salón re-resolves in-scope.
- `services/organizations.ts` (`listUserOrganizations`, `isOrgMember`); REST
  `POST /api/active-org`; header `OrgSwitcher` (shown only for multi-org users).

## Platform — multi-company onboarding

- `user.platform_admin` boolean (Better Auth additional field; migration `0008`).
  Set server-side only; the seed marks the bootstrap admin as platform admin.
- `services/platform.ts`: `getPlatformSession` (gate), `listAllOrganizations`
  (cross-org, with salón/member counts), `createCompany` (organization + owner
  user + owner membership + first salón + settings; unique slug). Admin onboards
  new client companies — public sign-up stays disabled.
- REST: `GET/POST /api/platform/companies` (platform-admin only). UI `/platform`:
  companies table + `CreateCompanyDialog`. Nav link shown only to platform admins.
- The data model was already multi-tenant (organization = empresa, fully scoped);
  this adds the platform-level capability to provision companies. Company
  switching for multi-org logins remains a later enhancement.

## Phase 1 — UX polish (demo-ready)

- **Dashboard**: real KPIs (today/month sales, month profit, outstanding
  receivables, open cash expected, top services) replacing the placeholder.
- **Responsive nav**: `MainNav` client component — inline on desktop, hamburger
  dropdown on mobile, active-route highlight.
- **Empty/loading**: reusable `EmptyState` (with CTA on clients/sales) + app
  route-group `loading.tsx` skeleton; shadcn `skeleton` added.
- **Form errors**: persistent inline error messages on sign-in, settings, and
  the sale form (plus client-side guards on the sale form: every item needs a
  description, total > 0, payment ≤ total).

## Phase 1 — Roles, staff & multi-salón (completes Phase 1)

- **Roles** (`lib/roles.ts`): `owner`/`admin`/`manager`/`cashier`/`staff`;
  `isAdmin` (owner|admin) gates config/staff/destructive. Admin-only API routes
  return 403 (salon-settings PUT, commission-rules writes, all `/api/staff`,
  salón create); admin-only pages (`/staff`, `/settings`) redirect non-admins;
  admin-only nav links hidden.
- **Staff** (`services/staff.ts`, `/staff`, `/api/staff` + `/:id`): admins
  provision users (Better Auth internals — public sign-up stays disabled), assign
  a role + the current salón (`team_member`), edit role, reset password, remove
  (not self, not owner). `StaffFormDialog`, `StaffEditDialog`.
- **Multi-salón**: `services/salons.ts` (`listSalons`, `createSalon`,
  `isAssigned`); admins create salones from `/settings`; active salón is chosen
  via the header `SalonSwitcher` and persisted in the `activeSalonId` cookie,
  which `requireSalonContext` now honors (cookie > Better Auth active team >
  first). `/api/salons`, `/api/active-salon`.

## Phase 1 — Money-flow correctness fix

- Payments belonging to **voided sales** are now excluded everywhere money is
  totalled: the cash session's expected amount (`cashPaymentsCents`) and the
  reports "collected by method" (`byMethod`) both inner-join `sale` and filter
  `status != void`. Previously a voided sale's payments still inflated caja and
  collected totals, while income/commissions already excluded them — now all
  money views are consistent.

## Phase 1 — MVP module connections

- **Salón settings**: `services/settings.ts` + `GET/PUT /api/salon-settings` +
  `/settings` UI (`SettingsForm`). Edits currency, tax rate (entered as %, stored
  as decimal), timezone, address, phone — activates tax on new sales (was 0).
  Header nav (Configuración).
- **Cash ↔ expenses**: `sessionSummary` now subtracts cash-paid expenses
  (`payment_method = cash`) in the session window from expected cash (single
  source, no duplicate movement). Caja breakdown shows "Gastos en efectivo".
- **Commissions ↔ P&L**: `salonReport` includes the period's commissions; profit
  = income − expenses − commissions. Reports adds a Comisiones stat card.

## Phase 1 — Reports (in progress)

- `services/reports.ts` `salonReport(from,to)`: aggregates (read-only, derived)
  for a window — totals (income = non-void sales, subtotal, tax, expenses,
  profit = income − expenses, collected), sales by service, sales by staff,
  payments by method. Reuses `lib/period`.
- REST: `GET /api/reports` (`?from=&to=`, defaults to current month).
- UI `/reports`: period filter, summary stat cards (income, expenses, profit,
  tax) + breakdown tables (by service, by staff, by payment method). Header nav
  (Reportes).

## Phase 1 — Commissions (in progress)

- `commission_rule` table (scoped by `organization_id` + `salon_id`): optional
  `staff_id` / `service_id` wildcards, `type` (percent/fixed), `value`, active.
  Migration `0007`.
- `services/commissions.ts`: rules CRUD + `computeCommissions(from,to)` — earned
  per staff from non-void sale items; most-specific matching rule wins
  (staff+service > staff > service > global); percent on line total, fixed per
  unit. Derived on demand (nothing stored). `lib/validations/commission.ts`.
- `lib/period.ts`: `monthRange`, `parseRange`, `toDateInput` (shared by reports).
- REST: `GET/POST /api/commission-rules` + `/:id`, `GET /api/commissions`
  (`?from=&to=`, defaults to current month).
- UI `/commissions`: earnings-by-staff table for a period (`PeriodFilter`) +
  rules management. Header nav (Comisiones). Reusable `PeriodFilter` component.

## Phase 1 — Expenses (in progress)

- `expense_category` + `expense` tables (scoped by `organization_id` +
  `salon_id`; expense has optional category on delete set null, vendor,
  description, amount numeric, optional payment method, expense date, createdBy).
  Migration `0006`.
- `services/expenses.ts`: salón-scoped CRUD for categories and expenses.
  `lib/validations/expense.ts` (zod; reuses payment methods).
- REST: `GET/POST /api/expense-categories` + `/:id`, `GET/POST /api/expenses` +
  `/:id`.
- UI `/expenses`: expenses table (date, category badge, vendor, method, amount)
  with create/edit dialog (amount, date, category, vendor, method, description)
  plus categories management. Header nav (Gastos).

## Phase 1 — Cash sessions / caja (in progress)

- `cash_session` + `cash_movement` tables (scoped by `organization_id` +
  `salon_id`). Session: opening balance, openedBy/At, status open/closed, and at
  close a snapshot of expected/counted/difference. Movement: in/out, amount,
  description. Migration `0005`.
- `services/cash.ts`: `openSession` (one open per salón), `getOpenSession`,
  `addMovement`/`deleteMovement` (open sessions only), `closeSession`,
  `listSessions`, `getSession`, and `sessionSummary` — expected cash = opening +
  cash payments in the session window + cash-in − cash-out. `lib/validations/
  cash.ts` (zod).
- REST: `GET/POST /api/cash-sessions`, `POST /api/cash-sessions/:id/close`,
  `POST /api/cash-sessions/:id/movements`, `DELETE /api/cash-movements/:id`.
- UI `/cash`: open form, live breakdown of the open session, movements table
  (add/remove), close dialog with live difference, closed-session history.
  `/cash/:id` shows a closed session summary. Header nav (Caja).

## Phase 1 — Payments (in progress)

- `payment` table (scoped by `organization_id` + `salon_id`, FK `sale_id`):
  method (cash/card/transfer/other), amount numeric, paid_at. Migration `0004`.
- `lib/money.ts` shared cents helpers (`toCents`, `centsToString`); sales service
  refactored to use them.
- `services/payments.ts`: `addPayment` (rejects unknown/voided sales),
  `listPayments`, `deletePayment`, `paidCentsBySale`, derived `paymentStatus`
  (pending/partial/paid). `lib/validations/payment.ts` (methods + labels).
- `createSale` accepts an optional initial payment (added in the same `db.batch`).
  `listSales`/`getSale` now return paid amount, balance, and payment status.
- REST: `GET/POST /api/sales/:id/payments`, `DELETE /api/payments/:id`.
- UI: payment fields (method + amount, "pagar total", leave 0 = pending) on the
  new-sale form; sale detail shows payments table, balance, status badge,
  `PaymentDialog` to add and delete payments. Sales list badge now reflects
  payment status.

## Phase 1 — Sales / tickets (in progress)

- `sale` + `sale_item` tables (scoped by `organization_id` + `salon_id`). Sale
  stores a tax-rate snapshot and computed `subtotal`/`tax_amount`/`total`
  (numeric); items carry `service_id?`, per-item `staff_id?` (commission basis),
  description, unit price, quantity, line total. Migration `0003`.
- `services/sales.ts`: `createSale` (atomic `db.batch` — neon-http has no
  transactions; totals computed in integer cents, tax snapshotted from
  `salon_settings`), `listSales`, `getSale`, `voidSale` (soft-void keeps the
  record), `listSalonStaff`. `lib/validations/sale.ts` (zod).
- REST: `GET/POST /api/sales`, `GET/DELETE /api/sales/:id` (DELETE = soft-void).
- UI: `/sales` list (status badge, currency), `/sales/new` (dynamic line items,
  service autofill, per-item staff, live subtotal/tax/total preview),
  `/sales/:id` detail with void. Header nav (Ventas).

## Phase 1 — Service catalog (in progress)

- `service_category` + `service` tables (scoped by `organization_id` +
  `salon_id`; `service.price` numeric(12,2), `duration_minutes` int, optional
  `category_id` on delete set null) + migration `0002`.
- `services/catalog.ts`: CRUD for categories and services, all scoped to the
  caller's salón. `lib/validations/catalog.ts` (zod; price/duration coerced).
- REST: `GET/POST /api/service-categories` + `/:id`, `GET/POST /api/services` +
  `/:id`.
- UI `/catalog`: services table (price formatted by salón currency, category
  badge) + categories list, create/edit dialogs, generic delete. Header nav
  link (Servicios).
- `ResourceDeleteButton` (generic delete confirm) + shadcn `select`.

## Phase 1 — Clients (in progress)

- Tenant context helper `lib/tenant.ts` (`requireSalonContext`): resolves the
  acting user's active organization + salón + role (Better Auth active org/team,
  falling back to first membership / first assigned salón).
- `client` table (scoped by `organization_id` + `salon_id`) + migration `0001`.
- `services/clients.ts`: list/create/update/delete, all scoped to the caller's
  salón (never trusts a salonId from the body). `lib/validations/client.ts` (zod).
- REST: `GET/POST /api/clients`, `PUT/DELETE /api/clients/:id`.
- UI `/clients`: table, create/edit dialog (`ClientFormDialog`), delete
  confirmation (`DeleteClientButton`). Header nav links (Panel, Clientes).
- shadcn primitives added: table, dialog, dropdown-menu, textarea, alert-dialog,
  badge.

## Phase 1 — Auth foundation

- Light/dark theme: `next-themes` `ThemeProvider` in the root layout +
  `ThemeToggle` (sun/moon) in the app header and sign-in page. Logos swap by
  theme (`logo-*-dark.png` via `dark:` classes).
- Applied the initial migration to Neon.
- Added `pnpm db:seed` (`db/seed.ts`): bootstraps the first admin user (via
  Better Auth internals, bypassing disabled sign-up) plus one empresa
  (`organization`), one salón (`team` + `team_member`), and its
  `salon_settings`. Idempotent.
- Added server session helpers (`lib/session.ts`: `getSession`,
  `requireSession`) and `lib/utils.ts` (`cn`, missing after the src→root move).
- Added shadcn primitives: button, input, label, card, sonner.
- Sign-in page (`/sign-in`) + `SignInForm` (email/password, mobile-first, logo).
- Auth-gated app shell (`app/(app)/layout.tsx`, `requireSession`) with header
  (logo, user name, `SignOutButton`) + dashboard placeholder. Root `/` redirects
  by session state. Toaster wired in the root layout.
- Pinned `kysely` to `0.28.17` (pnpm override): `@better-auth/kysely-adapter`
  1.6.13 imports `DEFAULT_MIGRATION_TABLE`, dropped in kysely 0.29, which broke
  the production build. Also set `serverExternalPackages` for better-auth.
- Logos available in `public/`: `logo-full.png`, `logo-icon.png`.

## Phase 0 — Foundation

- Scaffolded Next.js 16 (App Router, Tailwind v4, TypeScript strict, pnpm).
  `app/` at repo root; `@/*` alias → root.
- Initialized shadcn (style `radix-nova`, `lucide-react` icons).
- Added Drizzle ORM + Neon HTTP driver; `drizzle.config.ts`; DB client
  (`db/index.ts`); schema barrel + `timestamps` helper.
- Added validated env access (`lib/env.ts`, zod).
- Added Better Auth with the `organization` plugin (teams enabled),
  email/password, sign-up disabled. Generated `db/schema/auth.ts`; added the
  catch-all route handler and `lib/auth-client.ts`.
- Added `salon_settings` table (per-salón currency / tax rate / timezone).
- Generated initial migration `db/migrations/0000_*.sql` (10 tables). Not yet
  applied — requires a real Neon `DATABASE_URL`.
- Wrote project documentation: `AGENTS.md` + `docs/` (architecture, roadmap,
  database, api, components, changelog).
