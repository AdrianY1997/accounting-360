# Changelog

All relevant project changes are recorded here (most recent first).

## Store: cover-photo fallback + "Nuevo" badges

- `PublicItem.cover` (`services/public.ts`): main item photo, else the first
  variant photo that still has stock, else any photo (never blank). Replaces
  `ProductCard`'s old "first variant image regardless of stock" logic.
- `PublicItem`, `PublicVariant` and `PublicVariantImage` now carry `createdAt`.
  New `isNew()` helper (`lib/utils.ts`, < 2 weeks) drives "Nuevo" badges on the
  store listing card, the PDP title, gallery photos/thumbnails, and variant
  chips.

## Store v2: mockup-style detail page, store types, subcategories, product page, WhatsApp

- **PDP redesign** (no cart — informational): gallery + info column (price,
  availability badge, `summary`, reactive detail rows — Variante, store-type
  attributes, Ref/SKU, Categoría path — and always-visible variant chips),
  then chip-tabs (Descripción with ✓ `features`, Detalles, longtext-attribute
  tabs like Cuidados/Modo de uso, Envíos from salón `shipping_info`), share
  buttons (WhatsApp/Facebook/copy — Instagram omitted, no web intent),
  "¿Tienes dudas?" WhatsApp CTA and "También te puede interesar"
  recommendations (`recommendItems`: same category family + in stock first).
  `SelectionSummary` removed (folded into the reactive rows).
- **Store types** (`salon_settings.store_type`, registry `lib/store-types.ts`):
  Genérica / Ropa / Belleza templates decide which product attributes exist
  (text = detail row, longtext = tab). Values in `service.attributes` (jsonb)
  survive template switches.
- **Subcategories**: `service_category.parent_id` (one level max, enforced
  server-side; deleting a parent promotes children). Category dialog gains a
  parent Select; admin list nests children; store filter Select is
  hierarchical and selecting a parent matches its subcategories; PDP
  breadcrumb shows the full path + "Volver a <categoría>".
- **Dedicated product pages** `/catalog/new` and `/catalog/[id]` with
  `ProductForm` (summary, features one-per-line, store-type attributes,
  images, variants); `ServiceFormDialog` deleted.
- **WhatsApp**: `salon_settings.whatsapp` (+ floating button on the store and
  CTA on the PDP), fallback `NEXT_PUBLIC_WHATSAPP_FALLBACK`; migration `0021`
  backfills `+573213015880` into existing salons (per-salón editable). First
  hand-edited migration and first jsonb columns in the repo.
- Store search `q` now also matches item/variant SKUs and category labels;
  header placeholder updated. `service.summary` feeds page metadata.

## Auto-generated SKUs

- `service.sku` and `service_variant.sku` (migration `0020`): items get
  `P-0001` (products) / `S-0001` (duration services) per salón, variants get
  the item SKU + 2-digit suffix (`P-0001-02`). Unique per (salon, sku) /
  (service, sku). Immutable, not user-editable.
- Generation: `nextItemSku()` bumps `salon_settings.sku_seq_product|service`
  atomically (row upserted if missing) on `createService`; `createVariant`
  derives the next free suffix from existing sibling SKUs.
- Backfill inside migration `0020`: existing items/variants numbered by
  creation order per salón; sequences seeded from the highest assigned number.
- Shown in `/catalog` (SKU column), `VariantManager` (per-variant label) and
  the store's "Tu selección" panel (variant SKU, falling back to item SKU).
  `PublicItem`/`PublicVariant` expose `sku`.

## Store: selection summary resolves the photo's variant

- On the item detail page with "Todas" active, picking a photo that belongs to
  a variant now makes "Tu selección" show that variant's name and exact price
  instead of the "desde" minimum. Photos without a variant (main item images)
  keep the previous behavior.

## Salón logo file upload

- Settings form: the logo can now be uploaded as a file (preview thumbnail,
  "Subir imagen", "Quitar"), besides the manual external URL. Upload persists
  immediately via `POST /api/salon-settings/logo` (Vercel Blob under
  `logos/<salonId>/`, image-only, ≤4 MB); replacing or clearing deletes the
  previous blob when it was an upload (external URLs untouched). New
  `setLogoUrl()` in `services/settings.ts`.

## Min-price floor no longer applies to resellers

- Sales to a client of type `reseller` (intermediario) skip the `min_price`
  floor, both in the sale form validation and in `createSale` (the server
  loads the buyer's type; the guard stays authoritative for direct clients).
  Reseller tiers can legitimately sit below the retail minimum.

## Service (duration) parity with products

- Catalog form: create mode gains a price field (feeds the Estándar variant —
  new entries are no longer created at $0). Duration services hide the stock
  checkbox (server receives `tracksStock:false`) and their variants render as
  "Tarifas" (`VariantManager kind="service"`): no stock inputs, no per-photo
  stock (`ServiceImageManager photoStock={false}`). Images stay available.
- `/catalog`: type tabs (Todos | Productos | Servicios via `?type=`) and the
  Medida column now shows a badge ("Producto", "Servicio · por hora",
  "Servicio · fijo").
- Public store: duration services show "/hora" (per_unit) and "~N min" on
  cards, detail page and selection summary; the summary shows Duración instead
  of Disponibilidad for services. Single-variant items auto-select the variant
  and hide the picker (products included). New Productos/Servicios filter
  (`?type=`, only when the catalog has both); result texts are now
  "N resultados". `PublicItem` exposes `durationMinutes`.
- Commissions: fixed rules now pay per service performed on duration lines —
  previously the fixed amount was multiplied by hours (`quantity`), so a
  90-minute service paid 1.5× the rule value. Percent rules unchanged.
- Reports: "Ventas por servicio" split into servicios (duration, with a new
  Horas column derived from `sale_item.duration_minutes`) and productos;
  "Ventas por staff" also shows hours worked. No schema changes.

## Public storefront redesign: filters, grid/list views and item detail page

- `/store/[salonId]` listing redesigned: sticky `StoreHeader` (company link +
  salon + search) in a new `app/store/[salonId]/layout.tsx`, plus client-side
  filters synced to the URL (`q`, `cat`, `min`, `max`, `stock=1`) and a
  grid/list view toggle (`view`). New components: `StoreBrowser`,
  `StoreFilters`, `ViewToggle`, `setParams` helper.
- New public item detail page `/store/[salonId]/[itemId]`: breadcrumb
  (shadcn `breadcrumb` added), `ProductGallery` (thumbnails, sold-out photos
  last with "Agotado"), `VariantPicker` chips, low-stock warning, description
  and a "Tu selección" `SelectionSummary` side panel. No cart — informational
  only. `generateMetadata` on both store pages.
- `ProductCard` is now a link card (grid + list layouts); its old dialog moved
  to the detail page components. `SearchInput` gains `shallow` + `basePath`.
- `publicStore()` is request-cached (`react` `cache`) and now exposes
  `categories` and per-item `categoryId`/`description`; new
  `publicStoreItem(salonId, itemId)` feeds the detail page.
- `service` gains a nullable `description` column (migration `0019`), editable
  in the catalog item form ("Descripción (visible en la tienda)").

## Per-photo stock for variants

- `service_image` gains a nullable `stock` column (migration `0018`). Null =
  not tracked per photo (variant's own `stock` is the manual total). When set,
  the variant's `stock` becomes the sum of its images' stock and is
  recomputed on every photo-stock edit/delete (`recomputeVariantStock`).
- Catalog: `ServiceImageManager` shows a stock input under each variant photo
  (`PUT /api/service-images/[id]`) and an "Agotado" badge at 0. `VariantManager`
  disables the variant's manual stock field and labels it "(desde fotos)" once
  any photo tracks stock.
- Sale: `sale_item` gains nullable `image_id`. When a variant has photo-tracked
  stock, the POS requires picking a specific photo (thumbnail picker shows each
  photo's remaining stock); selling decrements both the photo and the variant
  total, voiding restores both.
- Public store: sold-out photos (`stock = 0`) are no longer hidden — they're
  shown last in the gallery with an "Agotado" badge (cover/thumbnail and main
  image).

- `ProductCard` (client): card shows cover + name + "desde" price; clicking opens
  a dialog with a main image, thumbnail strip, and variant chips. Selecting a
  variant swaps the gallery to that variant's images (falls back to the item's
  main images) and shows its price/stock; out-of-stock variants are disabled.
  The public store grid now uses it.

## Pricing moved to variants (item base has no pricing)

- Per `docs/notes.md`: pricing + stock now live entirely on variants. Every item
  has ≥1 variant; the item base only holds name/category/measure/images.
- `service_variant` gains `cost_price`, `reseller_price`, `min_price` (price tiers
  per variant); `price` is now NOT NULL (migration `0017`, with backfill).
  Creating an item auto-creates an "Estándar" variant; existing items were
  backfilled one variant from their old item price.
- `VariantManager` edits all four prices + stock + images per variant. The item
  form no longer shows prices (just a note + a "Descuenta stock al vender"
  toggle); the variant manager shows for every item.
- Sale: **a variant is required for every catalog line** (auto-selected when the
  item has a single variant); unit price, min-price floor and cost snapshot come
  from the chosen variant; reseller pricing uses the variant's reseller price.
  Catalog list shows "desde" (lowest variant price); public store shows the
  lowest variant price as the item price. The legacy `service` price columns are
  unused.

## Public storefront (part 3)

- Unauthenticated catalog per salón at `/store/[salonId]`: shows active items
  with cover image (item or variant), suggested price, total stock, and each
  variant's price/stock/images. No cost/min/reseller exposed. `services/
  public.ts` `publicStore(salonId)` queries directly by salón (no session).
- Settings → Salones lists a "Ver tienda" link per salón to share the URL.

## Inventory — sale variant selection + stock decrement (part 2)

- `sale_item.variant_id` (migration `0016`). Stock-tracked items require a
  variant on the sale line; the POS shows a variant select (with stock) and
  prices from the variant (own price or item price).
- `createSale` validates available stock per variant (aggregated across lines,
  `SaleError` → 400) and decrements `service_variant.stock` atomically in the
  same `db.batch`. `voidSale` now restores the stock the sale consumed.

## Inventory — variants & stock (part 1)

- `service.tracks_stock`; `service_variant` (free-text name, optional own price,
  stock); `service_image.variant_id` (image belongs to item or a variant).
  Migration `0015`.
- `services/catalog.ts`: variant CRUD (`listVariants`, `createVariant`,
  `updateVariant`, `deleteVariant`), `stockForServices` (total = sum of variant
  stock), images now optionally scoped to a variant. REST: `GET/POST
  /api/services/:id/variants`, `PUT/DELETE /api/variants/:id`; image upload
  accepts `variantId`.
- UI: item edit dialog has a "Controla stock" toggle + `VariantManager`
  (variants with price/stock/images); catalog list shows total Stock.
- Sale form: a **default seller** select applies to every line (and new ones),
  so you don't re-pick the same staff per item.
- (Stock decrement on sale + public store view come next.)

## Catalog — item images (Vercel Blob)

- `service_image` table (migration `0014`): optional, multiple images per item,
  stored in Vercel Blob (`@vercel/blob`; needs `BLOB_READ_WRITE_TOKEN`).
- `services/catalog.ts`: `listImages`, `imagesForServices` (list thumbnails),
  `addImage`, `deleteImage` (salón-scoped). REST: `GET/POST
  /api/services/:id/images` (multipart upload via `put`), `DELETE
  /api/service-images/:id` (also removes the blob). `catalog:write` gated.
- UI: `ServiceImageManager` in the item edit dialog (upload multiple, thumbnail
  grid, delete); catalog list shows the first image as a thumbnail.

## Access — fully custom per-user permissions

- Replaced the fixed role→permission matrix with **per-user permissions**
  (`member_permission` table, migration `0013`). `member.role` keeps `owner`
  (implicit full access); everyone else gets an explicit permission set chosen by
  the owner. `can(ctx, permission)` now reads `ctx.permissions` (owners/admins
  always allowed); `requireSalonContext` loads them.
- Staff form/edit use permission checkboxes (`ALL_PERMISSIONS` +
  `permissionLabels`) instead of a role select. Staff/settings/commission-rules/
  salon routes + pages now gate on the matching permission (`staff:manage`,
  `settings:manage`, `commissions:manage`, `salon:manage`). Nav filtered by
  `can`.

## General accounting — price tiers, client types, traceability

- **Item price tiers**: `service` gains `cost_price` (proveedor), `reseller_price`
  (intermediario) and `min_price` (hard floor); existing `price` is the suggested
  price. Catalog form edits all four.
- **Client types**: `client.type` (`direct` | `reseller`). Direct clients may be
  anonymous (sale without client); resellers are always registered records.
- **Sale pricing**: line price defaults by client type (reseller → reseller
  price, else suggested) and is editable but **cannot go below `min_price`**
  (enforced client + server via `SaleError` → 400). `sale_item` snapshots
  `cost_price` for margin/traceability.
- **Commissions**: rule `base` (`line` | `margin`); percent commissions can be
  computed on the margin (line − cost). Rule form adds the base selector.
- **Reports**: add Costo (proveedor) and Margen (subtotal − costo) totals/cards.
- Migration `0012`.

## General accounting — item measure + pricing

- Pivot from salon-only to general accounting. Catalog renamed UI-wise to
  "Productos y servicios" / "Catálogo"; items can be measured by **quantity** or
  **duration**.
- `service` gains `measure_type` (quantity|duration) and `price_mode`
  (per_unit|fixed). Duration items: `per_unit` = price per hour (line scales with
  minutes), `fixed` = flat price (duration informational). Migration `0011`.
- `sale_item`: `quantity` now numeric (decimal), plus `measure_type` snapshot and
  `duration_minutes`. `createSale` loads referenced items and computes line
  totals authoritatively per measure/price mode. Sale form shows a Cant. or Min.
  input per line; detail + receipt render duration vs quantity. Commission compute
  updated for numeric quantity.

## Onboarding — first-run interactive tour

- `user.onboarded` boolean (Better Auth additional field; migration `0010`).
- `ProductTour` (driver.js): role-aware spotlight tour that auto-starts once per
  user. Steps cover only the modules the user can access (via `can()` + admin /
  platform flags); nav links carry `data-tour` selectors and off-screen steps
  are skipped. Marks the user onboarded on finish/skip via
  `POST /api/onboarding/complete`. Mounted in the app layout when `!onboarded`.

## Platform — org impersonation

- Platform admins can **enter a client company** from `/platform`
  (`EnterCompanyButton` → `POST /api/active-org`, now allowing platform admins to
  set any existing org, not only their memberships). `requireSalonContext`
  resolves an impersonated org (role `admin`, salones from the org directly) and
  returns `impersonating: true`.
- `ImpersonationBanner` shows while operating a client company, with **Salir**
  (`DELETE /api/active-org` clears the org/salón cookies). `SalonContext` gains
  an `impersonating` flag.

## Phase 1 — Daily close view

- `/reports/daily`: dedicated cierre diario — day picker (`DayFilter`), stat
  cards (sales, collected, expenses, profit), payments by method, and the day's
  cash sessions (expected/counted/difference). Linked from `/reports`. Gated by
  `reports:view`. Completes the Phase 1 reports section.

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
