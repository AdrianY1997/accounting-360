# Component Map

Single source of truth for reusable UI. **Read this file before creating any UI
element** — do not scan the component tree file by file. Keep it in sync: every
time a component is added, changed, or removed, update its row here in the same
change.

## Reuse process

1. Find the closest match in the tables below.
2. If its row gives you enough to use it correctly (purpose + props/variants +
   notable behavior), proceed. If a row is missing context you need, open that
   one component file to confirm, then improve its row here.
3. **Reuse as-is** if it fits.
4. **Extend / adapt** if it nearly fits — add a `cva` variant, an optional prop,
   or compose/wrap it. Prefer this over duplication.
5. **Create new** only when nothing reasonable exists. Keep it small, separate UI
   from data-fetching and business logic (see [AGENTS.md](../AGENTS.md)), then
   add a row here.

Conventions: shadcn primitives live in `components/ui/` (alias
`@/components/ui`); shared app components in `components/` (alias
`@/components`). Style preset: `radix-nova`. Icons: `lucide-react`.

## Primitives (`components/ui/`)

shadcn primitives are added on demand with `pnpm dlx shadcn@latest add <name>`.
None added yet beyond the init baseline — add rows here as components are
installed.

| Component | File | Purpose / props |
| --------- | ---- | --------------- |
| `Button` | `ui/button.tsx` | shadcn button. `variant` (default/destructive/outline/secondary/ghost/link), `size` (default/sm/lg/icon), `asChild`. |
| `Input` | `ui/input.tsx` | Text input. Standard `<input>` props. |
| `Label` | `ui/label.tsx` | Form label (radix). `htmlFor`. |
| `Card` | `ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`. |
| `Toaster` | `ui/sonner.tsx` | Sonner toast host. Mounted once in root layout; fire with `toast()` from `sonner`. |
| `Table` | `ui/table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableFooter`. |
| `Dialog` | `ui/dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`. Controlled via `open`/`onOpenChange`. |
| `AlertDialog` | `ui/alert-dialog.tsx` | Confirm dialogs: `AlertDialog*` parts incl. `AlertDialogAction`, `AlertDialogCancel`. |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | `DropdownMenu*` parts (trigger/content/item/...). |
| `Textarea` | `ui/textarea.tsx` | Multiline input. Standard `<textarea>` props. |
| `Badge` | `ui/badge.tsx` | Status pill. `variant` (default/secondary/destructive/outline), `asChild`. |
| `Select` | `ui/select.tsx` | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`. Controlled via `value`/`onValueChange`. |
| `Skeleton` | `ui/skeleton.tsx` | Loading placeholder block. Used by `(app)/loading.tsx`. |
| `Breadcrumb` | `ui/breadcrumb.tsx` | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (`asChild` for `Link`), `BreadcrumbPage`, `BreadcrumbSeparator`. Used by store detail page. |

## App components (`components/`)

| Component | File | Purpose / props |
| --------- | ---- | --------------- |
| `SignInForm` | `sign-in-form.tsx` | Client. Email/password sign-in via `authClient`, logo header, toast on error, redirects to `/dashboard`. No props. |
| `SignOutButton` | `sign-out-button.tsx` | Client. Ghost button; `signOut()` then redirect to `/sign-in`. No props. |
| `ThemeProvider` | `theme-provider.tsx` | Client. Wraps `next-themes` provider; mounted in root layout (`attribute="class"`, system default). |
| `ThemeToggle` | `theme-toggle.tsx` | Client. Ghost icon button toggling light/dark via `next-themes` (sun/moon, hydration-safe). No props. In app header + sign-in page. |
| `ClientFormDialog` | `clients/client-form-dialog.tsx` | Client. Create/edit client dialog; `client?` (edit when set) + `trigger` node. POST/PUT `/api/clients`, toast + `router.refresh()`. |
| `DeleteClientButton` | `clients/delete-client-button.tsx` | Client. Trash icon → AlertDialog confirm → DELETE `/api/clients/:id`. Props `id`, `name`. |
| `ResourceDeleteButton` | `resource-delete-button.tsx` | Generic delete confirm. Props `endpoint`, `name`, `successMessage?`. DELETE + toast + refresh. Prefer this for new resources. |
| `CategoryFormDialog` | `catalog/category-form-dialog.tsx` | Client. Create/edit service category with "Categoría padre" Select (roots only; disabled when the category already has children — one level max). Props `category?`, `categories?`, `mode?`. POST/PUT `/api/service-categories` (400 on depth violations). |
| `ProductForm` | `catalog/product-form.tsx` | Client. Dedicated create/edit form (pages `/catalog/new`, `/catalog/[id]`): básicos (name, summary, hierarchical category Select, measure/duration, price on create, stock checkbox for products), descripción + features ("uno por línea" Textarea → ✓ list in store), atributos from the salon's store type (`lib/store-types.ts`; longtext = store tab), imágenes + variantes (edit only; reuses `ServiceImageManager`/`VariantManager`). Create redirects to `/catalog/[id]`. Props `service?`, `categories`, `storeType`. |
| `SaleForm` | `sales/sale-form.tsx` | Client. New-sale form: dynamic line items (service autofill, price, qty, per-item staff), client Select, live subtotal/tax/total, optional payment (method + amount, "pagar total", 0 = pending). When the chosen variant has photo-tracked stock, a horizontal thumbnail strip shows each pattern/print with its own +/-/clear buttons (capped to that photo's stock); the line's quantity is the sum across photos picked, and one sale item per photo is submitted so each photo's stock is decremented individually. Props `clients`, `services`, `staff`, `taxRate`, `currency`. POST `/api/sales` → redirect to detail. |
| `PaymentDialog` | `sales/payment-dialog.tsx` | Client. Add a payment to a sale (method Select + amount, prefilled with balance). Props `saleId`, `defaultAmount`. POST `/api/sales/:id/payments`. |
| `OpenSessionForm` | `cash/open-session-form.tsx` | Client. Opens a cash session (opening balance). No props. POST `/api/cash-sessions`. |
| `MovementDialog` | `cash/movement-dialog.tsx` | Client. Add cash in/out movement (type, amount, description). Prop `sessionId`. POST `/api/cash-sessions/:id/movements`. |
| `CloseSessionDialog` | `cash/close-session-dialog.tsx` | Client. Close caja: counted amount (prefilled expected) + notes, live difference. Props `sessionId`, `expected`, `currency`. POST `/api/cash-sessions/:id/close`. |
| `ExpenseFormDialog` | `expenses/expense-form-dialog.tsx` | Client. Create/edit expense (amount, date, category Select, vendor, payment method, description). Props `expense?` (minimal shape), `categories`, `trigger`. POST/PUT `/api/expenses`. |
| `ExpenseCategoryFormDialog` | `expenses/expense-category-form-dialog.tsx` | Client. Create/edit expense category. Props `category?`, `trigger`. POST/PUT `/api/expense-categories`. |
| `RuleFormDialog` | `commissions/rule-form-dialog.tsx` | Client. Create/edit commission rule (staff/service wildcards, type, value). Props `rule?`, `staff`, `services`, `trigger`. POST/PUT `/api/commission-rules`. |
| `PeriodFilter` | `period-filter.tsx` | Client. Date-range (from/to) filter; pushes `?from=&to=` to the current route. Props `from`, `to`. Used by `/commissions` and `/reports`. |
| `DayFilter` | `day-filter.tsx` | Client. Single-day picker; pushes `?date=`. Prop `date`. Used by `/reports/daily`. |
| `SalonSwitcher` | `salon-switcher.tsx` | Client. Active-salón Select (hidden if <2). Props `salons`, `activeId`. POST `/api/active-salon` then refresh. In app header. |
| `OrgSwitcher` | `org-switcher.tsx` | Client. Active-empresa Select (hidden if <2). Props `orgs`, `activeId`. POST `/api/active-org` then refresh. In app header. |
| `SearchInput` | `search-input.tsx` | Client. Search box; pushes `?<param>=` (merges params). Props `param?` (def `q`), `placeholder?`, `shallow?` (same-route `history.replaceState`, no navigation), `basePath?` (target another route, e.g. store listing from detail page). |
| `SalesFilters` | `sales/sales-filters.tsx` | Client. Payment-status Select; pushes `?status=`. Prop `status?`. |
| `PrintButton` | `print-button.tsx` | Client. Calls `window.print()`; `print:hidden`. |
| `ProductCard` | `store/product-card.tsx` | Server-safe. Store listing card linking to `/store/:salonId/:itemId`. Props `item`, `currency`, `salonId`, `view?` (`grid` square card / `list` horizontal row), `categoryName?` (list view). Cover is `item.cover` (item's main photo, else first in-stock variant photo — resolved in `services/public.ts`). "desde" price with >1 variant, "Agotado" badge + faded cover when tracked stock is 0, else "Nuevo" badge when `item.createdAt` < 2 weeks (`isNew()` in `lib/utils.ts`). Duration services show "/hora" (per_unit) and a "~N min" line. |
| `StoreHeader` | `store/store-header.tsx` | Server-safe. Sticky store header: company "logo" link to listing, salon subtitle, `SearchInput` (`shallow` + `basePath`). Props `company`, `salon`, `salonId`. Mounted in `app/store/[salonId]/layout.tsx`. |
| `StoreBrowser` | `store/store-browser.tsx` | Client. Filtered store listing: `StoreFilters` + `ViewToggle` + result count + grid/list of `ProductCard`; empty state with "Limpiar filtros". Filter state lives in URL params `q,cat,min,max,stock,type,view` (shallow). `q` matches name, item/variant SKU and category label; `cat` matches the category and its subcategories (`descendantsAndSelf`). Type filter only offered when the catalog has both products and services. Props `items`, `categories`, `currency`, `salonId`. |
| `StoreFilters` | `store/store-filters.tsx` | Client. Productos/Servicios chips (when `showTypeFilter`), hierarchical category Select (children indented "—"), min/max price inputs, "Solo disponibles" chip, "Limpiar". Writes params via `setParams` (shallow). Collapsed behind "Filtros" button (+active count badge) below `sm`. Props `categories`, `showTypeFilter?`. |
| `ViewToggle` | `store/view-toggle.tsx` | Client. Grid/list icon buttons; persists `view` URL param (grid = param removed). No props. |
| `ProductDetail` | `store/product-detail.tsx` | Client. Store detail orchestrator, mockup-style, no cart: gallery + info column (name + "Nuevo" badge when `item.createdAt` < 2 weeks, static reviews stub, price with "Desde"/"/hora", availability badge, summary, reactive detail rows — Variante, text attributes, Ref/SKU, Categoría path, Duración — and `VariantPicker` always visible with single variant auto-selected), then `DetailTabs` (Descripción + ✓ features, Detalles, longtext-attribute tabs; Envíos tab currently disabled in code) and `ShareButtons` (which embeds the WhatsApp CTA). Photo→variant resolution drives rows/price. Props `item`, `currency`, `categoryPath`, `storeTypeId`, `shippingInfo`, `whatsapp`. |
| `DetailTabs` | `store/detail-tabs.tsx` | Client. Lightweight local-state underline tabs (scroll-x on mobile) in a white card. Prop `tabs: {id,label,content}[]`. |
| `ShareButtons` | `store/share-buttons.tsx` | Client. "Compartir producto" card: circular brand buttons (WhatsApp/Facebook via `@icons-pack/react-simple-icons`) + copy link (clipboard + toast), and embeds `WhatsappCta`. Instagram omitted (no web intent). Props `whatsapp`, `itemName`. |
| `WhatsappCta` / `WhatsappFloat` | `store/whatsapp-link.tsx` | Server-safe. CTA block ("¿Tienes dudas?", pink card, rendered inside `ShareButtons`) with prefilled message, and the floating bottom-right button (mounted in the store layout). `wa.me` links (digits-only). Render nothing without a phone. Props `phone`, `message?`. |
| `Recommendations` | `store/recommendations.tsx` | Server-safe. "También te puede interesar" via `recommendItems()` (same category family + in stock first, max 5); snap strip on mobile → grid on `sm+`. Props `store`, `item`, `salonId`. |
| `ProductGallery` | `store/product-gallery.tsx` | Client, controlled. Main image + thumbnail strip; sold-out photos faded + "Agotado" badge, sorted last via exported `orderGallery()`; in-stock photos with `createdAt` < 2 weeks get a "Nuevo" tag (main image) / "N" dot (thumbnail) via `isNew()`. Props `images`, `alt`, `active`, `onSelect`. |
| `VariantPicker` | `store/variant-picker.tsx` | Client, controlled. Variant chips ("Todas" + per-variant with stock count, disabled at 0); a "Nuevo" pill is appended when the variant's `createdAt` is under 2 weeks (`isNew()`). Exports `ALL_VARIANTS` sentinel. Props `variants`, `tracksStock`, `value`, `onChange`. |
| `setParams` | `store/set-params.ts` | Helper (not a component). Shallow URL query merge via `history.replaceState`; empty/null removes the param. |

Shared non-component helpers: `lib/store-types.ts` (store-type registry — attribute
templates per tienda; `getStoreType`, `storeTypes`, `storeTypeIds`) and
`lib/categories.ts` (`categoryPath`, `categoryLabel`, `categoryTree`,
`descendantsAndSelf` for top-down filtering, `familyIds` for recommendations).
| `VariantManager` | `catalog/variant-manager.tsx` | Client. Per-item variants: name, price tiers (sugerido/costo/intermediario/mínimo), stock, and per-variant images via `ServiceImageManager`. Stock input is disabled and labeled "(desde fotos)" once any photo of that variant tracks its own stock. Shows each variant's SKU next to its name. Props `serviceId`, `kind?` (`product` default; `service` relabels variants as "Tarifas" and hides all stock UI). |
| `ServiceImageManager` | `catalog/service-image-manager.tsx` | Client. Upload/list/delete images for an item or a variant (Vercel Blob). For variant images, an inline number input sets per-photo stock (`PUT /api/service-images/:id`, blank = not tracked) and shows an "Agotado" badge at 0. Props `serviceId`, `variantId?`, `label?`, `photoStock?` (hide the per-photo stock input, used for services), `onStockSaved?`. |
| `MainNav` | `main-nav.tsx` | Client. App header navigation: inline links on desktop, hamburger dropdown on mobile, active highlight. Prop `admin` (shows Personal/Configuración). |
| `EmptyState` | `empty-state.tsx` | Empty-list block. Props `title`, `description?`, `action?` (CTA node). |
| `CreateCompanyDialog` | `platform/create-company-dialog.tsx` | Client (platform admin). Onboards a company (company, salón, owner name/email/password). POST `/api/platform/companies`. |
| `EnterCompanyButton` | `platform/enter-company-button.tsx` | Client (platform admin). Impersonate a company. Prop `organizationId`. POST `/api/active-org` → `/dashboard`. |
| `ImpersonationBanner` | `impersonation-banner.tsx` | Client. Banner shown while impersonating; Salir → DELETE `/api/active-org` → `/platform`. |
| `ProductTour` | `product-tour.tsx` | Client. First-run driver.js tour, role-aware (prop `caps`). Auto-starts, skips off-screen steps, POSTs `/api/onboarding/complete` on end. Mounted in layout when `!onboarded`. Nav links use `data-tour` selectors. |
| `SettingsForm` | `settings/settings-form.tsx` | Client. Edit salón settings (currency, tax %, timezone, address, phone, logo, tipo de tienda, WhatsApp de tienda, información de envíos). Logo: preview + file upload (POST `/api/salon-settings/logo`, persists immediately) + Quitar (DELETE) or manual external URL (saved with the form). Prop `settings?`. PUT `/api/salon-settings`. |
| `CreateSalonDialog` | `settings/create-salon-dialog.tsx` | Client. Admin creates a salón (name). POST `/api/salons`. |
| `StaffFormDialog` | `staff/staff-form-dialog.tsx` | Client. Admin creates staff (name, email, password, role). POST `/api/staff`. |
| `StaffEditDialog` | `staff/staff-edit-dialog.tsx` | Client. Admin edits role / resets password. Prop `staff`. PATCH `/api/staff/:id`. Owner role locked. |
