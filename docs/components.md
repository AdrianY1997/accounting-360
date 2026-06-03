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
| `CategoryFormDialog` | `catalog/category-form-dialog.tsx` | Client. Create/edit service category. Props `category?`, `trigger`. POST/PUT `/api/service-categories`. |
| `ServiceFormDialog` | `catalog/service-form-dialog.tsx` | Client. Create/edit service (name, category Select, price, duration). Props `service?`, `categories`, `trigger`. POST/PUT `/api/services`. |
| `SaleForm` | `sales/sale-form.tsx` | Client. New-sale form: dynamic line items (service autofill, price, qty, per-item staff), client Select, live subtotal/tax/total, optional payment (method + amount, "pagar total", 0 = pending). Props `clients`, `services`, `staff`, `taxRate`, `currency`. POST `/api/sales` → redirect to detail. |
| `PaymentDialog` | `sales/payment-dialog.tsx` | Client. Add a payment to a sale (method Select + amount, prefilled with balance). Props `saleId`, `defaultAmount`. POST `/api/sales/:id/payments`. |
| `OpenSessionForm` | `cash/open-session-form.tsx` | Client. Opens a cash session (opening balance). No props. POST `/api/cash-sessions`. |
| `MovementDialog` | `cash/movement-dialog.tsx` | Client. Add cash in/out movement (type, amount, description). Prop `sessionId`. POST `/api/cash-sessions/:id/movements`. |
| `CloseSessionDialog` | `cash/close-session-dialog.tsx` | Client. Close caja: counted amount (prefilled expected) + notes, live difference. Props `sessionId`, `expected`, `currency`. POST `/api/cash-sessions/:id/close`. |
