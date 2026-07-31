# Audit: storefront "elige tu modelo" redesign

Scope: lib/model-gallery.ts, lib/store-order-message.ts,
components/store/model-selector.tsx, components/store/model-preview.tsx,
components/store/product-detail.tsx (rewrite), components/store/product-card.tsx,
components/store/store-browser.tsx, components/store/whatsapp-link.tsx, the two
new `/preview/[indexes]` routes, the two item-detail `page.tsx` callers, and the
deletion of product-gallery.tsx + variant-picker.tsx.

## Findings

### 1. lib/model-gallery.ts:45 — 🟡 risk: unguarded `decodeURIComponent` on a public URL segment
`parsePreviewIndexes(raw, galleryLength)` calls `decodeURIComponent(raw)` with no
try/catch. `raw` is the `/preview/:indexes` route segment — reachable directly by
anyone (shared WhatsApp links, bots, manual edits). A malformed percent-escape
(e.g. `/preview/1,2%zz` or a bare `%`) throws an uncaught `URIError`. Neither
`app/store/[salonId]/[itemId]/preview/[indexes]/page.tsx` nor its `app/s/...`
counterpart catches it, and there is no `error.tsx`/`not-found.tsx` under
`app/store` or `app/s` — confirmed absent. The result is Next's generic error
page instead of the existing graceful `notFound()`/`redirect()` handling already
used two lines below for an empty/out-of-range selection.

### 2. lib/store-order-message.ts:37, components/store/model-preview.tsx:48 — 🟡 risk + duplication: "effective price" reimplemented, and reimplemented wrong
Both compute a variant's shown price as:
```ts
const price = variant ? Number(variant.discountPrice || variant.price) : Number(item.price);
```
The project's one other place this is computed, `services/public.ts:177-180`,
uses `disc > 0 ? disc : regular` specifically *because* `discountPrice` can be a
valid, non-null `"0"`/`"0.00"` (zod schema is `min(0)`, and
`components/catalog/variant-manager.tsx:240` — `discountPrice: e.target.value || null`
— stores a literal `"0"` typed into the field rather than nulling it out). A
string `"0"` is truthy, so `variant.discountPrice || variant.price` picks the
zero instead of falling back to the regular price: a variant with
`discountPrice: "0"` shows as **$0.00** in the WhatsApp order text and on the
`/preview` page, while every other surface (card, detail header, the real sale
floor in `services/sales.ts:239-244`) treats that same `"0"` as "no discount."
There's no shared `effectivePrice()` helper — this is the third independent
copy of the same rule, and it's the one that's wrong.

### 3. components/store/whatsapp-link.tsx:46-49 — 🟡 risk: item-detail detection is a segment-count guess, not a route match
```ts
const isItemDetail = pathname.split("/").filter(Boolean).length === 3;
```
Hides the floating WhatsApp button so it doesn't overlap the fixed order bar
on `/store/:salonId/:itemId` and `/s/:token/:itemId`. It works today because
those happen to be the only 3-segment paths in the app, but nothing ties the
check to those two routes — any future 3-segment route anywhere under
`/store` or `/s` (e.g. a checkout step, an FAQ page) silently loses the float
for a reason that no longer applies. Matching on the known route shapes
directly (or a shared route-list constant) would survive that.

### 4. components/store/product-card.tsx:119,171 and product-detail.tsx:233-240 — ❓ question: stock-count text dropped for every item, not just modelled ones
Before this change, in-stock tracked items showed `"{totalStock} disponibles"`
on both card views; now only `Agotado`/`Disponible` remains — the quantity is
gone even for items that never render the model selector (services, single-
variant products). Dropping an aggregate count that no longer means anything
once photos are numbered per-model makes sense for `hasModels` items, but this
also removed it from the plain fallback path. Intentional across-the-board
simplification, or should non-modelled items keep the quantity?

### 5. components/store/product-detail.tsx:41 / app/s/[token]/[itemId]/page.tsx:89 — 🔵 nit: `salonId` required prop is a throwaway `""` on the reseller call site
`ProductDetail`'s `salonId: string` is only read as the fallback
`` basePath ?? `/store/${salonId}` `` (line 75). The reseller page always
passes `basePath`, so its `salonId=""` exists purely to satisfy the type, not
because it means anything. Making it optional (like `basePath`) would remove
the placeholder value.

## Memory repair

`convention-components-store-photo-badges-tsx-photobadges-is-the-shared`'s body
names the "three photo tiles" as `product-gallery.tsx`, `product-card.tsx`, and
`variant-picker.tsx`. The first and third no longer exist (deleted this task);
`PhotoBadges` is now consumed by `product-card.tsx`, `model-selector.tsx`, and
`model-preview.tsx` instead. The anchor (`photo-badges.tsx#PhotoBadges`) still
resolves so `recall verify` doesn't catch this — the fact itself is stale.
Proposed a superseding rewrite in `.recall/local/proposals.md` (needs approval,
per the write policy for supersession).

## What I checked
- Full diff via `git --no-pager diff` for all listed files (git repo, clean
  working tree otherwise).
- `services/public.ts` (effective-price / cover-image logic already
  established there) and `services/sales.ts` (real sale-floor logic) to
  compare against the new duplicated price code.
- `components/store/photo-badges.tsx` to confirm the prop contract
  (`soldOut`, `isNewPhoto`, `aiKind`, `size`) matches the new callers.
- `services/public.ts` types (`PublicItem`, `PublicVariant`,
  `PublicVariantImage`) against `lib/model-gallery.ts`'s assumptions
  (`stock: number | null`, sort stability).
- Grepped the whole repo for leftover `product-gallery`/`variant-picker`
  references — none outside `.recall/archive` and past audit files (already
  archived, expected).
- Grepped for an existing `effectivePrice` helper — none exists anywhere.
- Confirmed no `error.tsx`/`not-found.tsx` under `app/store` or `app/s`.
- `recall pending --json`, `recall query`, `recall recurring --min 2` (empty),
  `recall verify` (anchors clean — see repair note above), `.recall/INDEX.md`.

## What I deliberately did not check
- Test coverage: the project has no test framework/script at all (`package.json`
  has no `test` script, no `*.test.ts*` files anywhere) — flagging the new pure
  functions (`buildModelGallery`, `parsePreviewIndexes`, `buildOrderMessage`,
  etc.) for missing tests would be enforcing a standard the project doesn't
  have, not a real regression.
- `components/store/recommendations.tsx`, `detail-tabs.tsx`, `share-buttons.tsx`,
  `store-filters.tsx` — unchanged, out of the stated scope.
- Visual/Tailwind styling choices (pink branding, emoji copy in
  store-browser.tsx) — taste, not correctness.
