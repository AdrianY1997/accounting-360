# Changelog

All relevant project changes are recorded here (most recent first).

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
