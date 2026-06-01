# salon360

Complete accounting system for beauty salons, built to scale from one salón to a
chain. Next.js 16 + Drizzle (Neon Postgres) + Better Auth.

Documentation lives in [`AGENTS.md`](./AGENTS.md) and [`docs/`](./docs). Start
there — the docs are kept in sync with the code (see the Documentation
Maintenance Rule).

## Getting started

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL (Neon) and BETTER_AUTH_SECRET
pnpm db:migrate        # apply migrations
pnpm dev
```

## Scripts

See the **Commands** section in [`AGENTS.md`](./AGENTS.md#commands).

## Status

Phase 0 (Foundation) complete. See [`docs/roadmap.md`](./docs/roadmap.md).
