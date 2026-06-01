# API

REST-style endpoints implemented as Next.js Route Handlers under `app/api/*`.
Business logic lives in a `services/` layer (added per feature); handlers stay
thin. All input is validated with Zod on the server.

## Conventions

- Follow REST: `GET/POST /api/<resource>`, `GET/PUT/DELETE /api/<resource>/:id`.
- Route handler `params` are async in Next.js 16: `const { id } = await ctx.params`.
- Every handler must verify the acting user belongs to the organization/salón of
  the resource. Never trust client-supplied tenant IDs.
- Errors: JSON `{ error }` with appropriate HTTP status.

## Authentication

Handled by **Better Auth** via the catch-all handler:

```text
app/api/auth/[...all]/route.ts  →  toNextJsHandler(auth)
```

This exposes all Better Auth endpoints under `/api/auth/*` (sign-in, sign-out,
session, organization, teams, invitations, members).

- **Email/password**, public **sign-up disabled** — accounts come from
  organization invitations.
- Server: import `auth` from `@/lib/auth` (e.g. `auth.api.getSession(...)`).
- Browser: import `authClient` (or `signIn`, `signOut`, `useSession`) from
  `@/lib/auth-client`. Organization/team operations use the `organizationClient`
  plugin already wired in.

### Multi-tenant operations (via Better Auth)

- Create empresa → `authClient.organization.create(...)`.
- Create salón → teams API (`organization.createTeam`, since teams are enabled).
- Invite staff → `organization.inviteMember` (optionally with `teamId`).
- Active context → `session.activeOrganizationId` / `session.activeTeamId`.

## Domain endpoints

None yet — Phase 1 introduces clients, services, sales, payments, cash sessions,
expenses, commissions, and reports. Document each here as it lands (path,
method, auth/role required, request/response shape) per the Documentation
Maintenance Rule in [AGENTS.md](../AGENTS.md).
