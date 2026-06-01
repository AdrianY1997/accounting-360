# Changelog

All relevant project changes are recorded here (most recent first).

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
