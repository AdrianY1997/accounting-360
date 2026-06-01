# Changelog

All relevant project changes are recorded here (most recent first).

## Phase 1 — Auth foundation (in progress)

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
