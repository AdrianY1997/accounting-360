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

## App components (`components/`)

| Component | File | Purpose / props |
| --------- | ---- | --------------- |
| `SignInForm` | `sign-in-form.tsx` | Client. Email/password sign-in via `authClient`, logo header, toast on error, redirects to `/dashboard`. No props. |
| `SignOutButton` | `sign-out-button.tsx` | Client. Ghost button; `signOut()` then redirect to `/sign-in`. No props. |
