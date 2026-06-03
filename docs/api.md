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

## Sales

Body (zod, `lib/validations/sale.ts`): `clientId?` (null = walk-in), `notes?`,
`items` (≥1) of `{ serviceId?, staffId?, description, unitPrice, quantity }`.
Totals are computed server-side; tax rate is snapshotted from `salon_settings`.

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/api/sales`     | List sales (salón)                       |
| POST   | `/api/sales`     | Create sale (201 → `{ id }`)             |
| GET    | `/api/sales/:id` | Sale + items (404 if not in salón)       |
| DELETE | `/api/sales/:id` | Soft-void (status → `void`); keeps record |

## Payments

A sale may have many payments (split / partial / abonos). Payment status is
derived: `pending` (0 paid), `partial` (0 < paid < total), `paid` (≥ total).
Body (zod, `lib/validations/payment.ts`): `method` (`cash`|`card`|`transfer`|
`other`), `amount` (> 0). A payment may also be sent inline on `POST /api/sales`
via the `payment` field.

| Method | Path                       | Description                          |
| ------ | -------------------------- | ------------------------------------ |
| GET    | `/api/sales/:id/payments`  | List payments for a sale             |
| POST   | `/api/sales/:id/payments`  | Add a payment (404 if sale void/missing) |
| DELETE | `/api/payments/:id`        | Delete a payment                     |

## Cash sessions (caja)

One open session per salón. Expected cash = opening balance + cash payments in
the session window + cash-in − cash-out movements; the close stores expected,
counted, and difference. Bodies (zod, `lib/validations/cash.ts`): open
`{ openingBalance }`, close `{ countedAmount, notes? }`, movement
`{ type: in|out, amount, description }`.

| Method | Path                              | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| GET    | `/api/cash-sessions`              | List sessions (salón)             |
| POST   | `/api/cash-sessions`              | Open a session (409 if one open)  |
| POST   | `/api/cash-sessions/:id/close`    | Close (404 if missing/closed)     |
| POST   | `/api/cash-sessions/:id/movements`| Add cash movement (404 if closed) |
| DELETE | `/api/cash-movements/:id`         | Remove movement (open session)    |

## Expenses

Categories — body `{ name }`. Expenses — body (zod, `lib/validations/
expense.ts`): `categoryId?`, `vendor?`, `description?`, `amount` (≥ 0),
`paymentMethod?` (`cash`|`card`|`transfer`|`other`), `expenseDate?` (YYYY-MM-DD,
omitted = now).

| Method | Path                          | Description                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/expense-categories`     | List categories (salón)    |
| POST   | `/api/expense-categories`     | Create category (201)      |
| PUT    | `/api/expense-categories/:id` | Update (404 if not in salón) |
| DELETE | `/api/expense-categories/:id` | Delete (404 if not in salón) |
| GET    | `/api/expenses`               | List expenses (salón)      |
| POST   | `/api/expenses`               | Create expense (201)       |
| PUT    | `/api/expenses/:id`           | Update (404 if not in salón) |
| DELETE | `/api/expenses/:id`           | Delete (404 if not in salón) |

## Commissions

Rule body (zod, `lib/validations/commission.ts`): `staffId?` (null = all),
`serviceId?` (null = all), `type` (`percent`|`fixed`), `value` (≥ 0), `active?`.
Earnings are derived: the most specific active rule applies to each non-void
sale item (staff+service > staff > service > global); percent on line total,
fixed per unit.

| Method | Path                        | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/api/commission-rules`     | List rules (salón)                   |
| POST   | `/api/commission-rules`     | Create rule (201)                    |
| PUT    | `/api/commission-rules/:id` | Update (404 if not in salón)         |
| DELETE | `/api/commission-rules/:id` | Delete (404 if not in salón)         |
| GET    | `/api/commissions`          | Earnings by staff; `?from=&to=` (YYYY-MM-DD), defaults to current month |

## Roles & access

Roles (`lib/roles.ts`): `owner`, `admin`, `manager`, `cashier`, `staff`.
`isAdmin` = `owner`|`admin`. Admin-only endpoints return `403` otherwise:
salón settings PUT, commission-rule writes, all `/api/staff`, salón create.
Operational endpoints (clients, catalog, sales, payments, cash, expenses) are
open to any member of the salón.

## Staff (admin only)

Body — create: `{ name, email, password (≥8), role }` (role ∈ admin/manager/
cashier/staff). Update: `{ role?, password? }`. Admins provision users (public
sign-up stays disabled); the new user is assigned the current salón.

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/api/staff`     | List org members                         |
| POST   | `/api/staff`     | Create staff (201; 409 if email exists)  |
| PATCH  | `/api/staff/:id` | Update role / reset password (id = memberId) |
| DELETE | `/api/staff/:id` | Remove member (not self, not owner)      |

## Salones

| Method | Path                | Description                               |
| ------ | ------------------- | ----------------------------------------- |
| GET    | `/api/salons`       | Salones the user is assigned to           |
| POST   | `/api/salons`       | Create salón (admin)                       |
| POST   | `/api/active-salon` | Set active salón (`activeSalonId` cookie); body `{ salonId }`, must be assigned |

## Salón settings

Body (zod, `lib/validations/settings.ts`): `currency` (3-letter), `taxRatePercent`
(0–100, stored as decimal), `timezone`, `address?`, `phone?`.

| Method | Path                  | Description                       |
| ------ | --------------------- | --------------------------------- |
| GET    | `/api/salon-settings` | Current salón settings            |
| PUT    | `/api/salon-settings` | Update (upsert) salón settings    |

## Reports

Read-only aggregates over a window (derived from existing records). `profit =
income − expenses − commissions`.

| Method | Path           | Description                                        |
| ------ | -------------- | -------------------------------------------------- |
| GET    | `/api/reports` | `?from=&to=` (YYYY-MM-DD, defaults to current month). Returns `totals` (income, subtotal, tax, expenses, commissions, profit, collected, salesCount), `byService`, `byStaff`, `byMethod`. |

## Notes

Phase 1 accounting endpoints are complete. A dedicated daily-close view is still
pending (the report works per day via the period filter). Document new endpoints
here as they land per the Documentation Maintenance Rule in
[AGENTS.md](../AGENTS.md).
