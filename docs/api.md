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
- Server: use `getSession()` / `requireSession()` from `@/lib/session` in
  Server Components and route handlers (`requireSession` redirects to `/sign-in`).
  Lower-level access via `auth` from `@/lib/auth`.
- Browser: import `authClient` (or `signIn`, `signOut`, `useSession`) from
  `@/lib/auth-client`. Organization/team operations use the `organizationClient`
  plugin already wired in.

### Multi-tenant operations (via Better Auth)

- Create empresa → `authClient.organization.create(...)`.
- Create salón → teams API (`organization.createTeam`, since teams are enabled).
- Invite staff → `organization.inviteMember` (optionally with `teamId`).
- Active context → `session.activeOrganizationId` / `session.activeTeamId`.

## Tenant scope

Domain route handlers call `requireSalonContext()` from `@/lib/tenant` to get
`{ userId, organizationId, salonId, role }`. Services filter every query by that
context — the salón is never taken from the request body.

## Clients

`client` body (zod, `lib/validations/client.ts`): `fullName` (required), `phone?`,
`email?`, `notes?`, `active?`.

| Method | Path               | Description                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/api/clients`     | List clients for the salón   |
| POST   | `/api/clients`     | Create a client (201)        |
| PUT    | `/api/clients/:id` | Update a client (404 if not in salón) |
| DELETE | `/api/clients/:id` | Delete a client (404 if not in salón) |

## Service catalog

Categories — body `{ name }`. Services — body (zod, `lib/validations/catalog.ts`):
`name` (required), `categoryId?` (null = none), `price` (number ≥ 0, coerced),
`durationMinutes` (int ≥ 0, coerced), `active?`.

| Method | Path                          | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/service-categories`     | List categories (salón)    |
| POST   | `/api/service-categories`     | Create category (201)      |
| PUT    | `/api/service-categories/:id` | Update (404 if not in salón) |
| DELETE | `/api/service-categories/:id` | Delete (404 if not in salón) |
| GET    | `/api/services`               | List services (salón)      |
| POST   | `/api/services`               | Create service (201)       |
| PUT    | `/api/services/:id`           | Update (404 if not in salón) |
| DELETE | `/api/services/:id`           | Delete (404 if not in salón) |

## Remaining domain endpoints

Still to come in Phase 1: sales, payments, cash sessions, expenses,
commissions, reports. Document each here as it lands per the Documentation
Maintenance Rule in [AGENTS.md](../AGENTS.md).
