# salon360

Complete accounting system for beauty salons, built to scale from one salón to a
chain. Next.js 16 + Drizzle (Neon Postgres) + Better Auth.

Documentation for AI agents lives in [`AGENTS.md`](./AGENTS.md) and in
`recall` (`.recall/`) — verified facts, conventions and gotchas surfaced
automatically at the start of a task.

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

Phase 0 (Foundation) complete.
