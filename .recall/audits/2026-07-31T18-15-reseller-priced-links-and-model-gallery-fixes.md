# Audit: reseller link with prices + model-gallery post-audit fixes

Scope (as given):
1. Reseller link with prices — `db/schema/client.ts` (`resellerLink.showPrices`
   + composite unique index), `services/clients.ts` (`getResellerLink`),
   `app/api/reseller-links/route.ts`, `services/public.ts`
   (`publicStoreByResellerToken` → `{store, showPrices}`), the 4 call sites
   under `app/s/[token]/...`, `components/catalog/reseller-link-copier.tsx`.
2. Carried-over fixes from the prior "elige tu modelo" audit —
   `lib/model-gallery.ts` (`effectivePrice()`, try/catch around
   `decodeURIComponent`), `lib/store-order-message.ts` and
   `components/store/model-preview.tsx` (now call `effectivePrice()`).

## Findings

### 1. `services/public.ts:176-183` — 🟡 duplication: `publicStore`'s own price calc still isn't using the new `effectivePrice()` helper
`lib/model-gallery.ts:41`'s `effectivePrice()` docstring says it "mirrors
`services/public.ts`'s `publicStore` pricing, the source of truth for this
rule" — but `publicStore` (services/public.ts:176-180) keeps its own inline
`disc > 0 ? disc : regular` instead of being refactored to call the helper it
supposedly sources. That leaves the exact rule fixed in
`lib/store-order-message.ts` and `components/store/model-preview.tsx` by this
task still duplicated a third time here, plus a fourth copy in
`services/sales.ts:239-244` (sale-floor, correct but independent). The
project's own recurring-findings list already tracks `duplication` (2 prior
audits) — this is that category recurring again on the file the helper was
extracted *from*. Not a behavior bug (both forms are equivalent), but the
next tweak to this rule (e.g. tie-breaking on equal price) has to remember to
touch four places instead of one.

### 2. `.recall/nodes/gotcha-a-variant-s-discountprice-can-be-a-valid-non-null-literal-0.md` — stale memory: claims no shared `effectivePrice()` helper exists
This gotcha (written in the prior audit, asserted 2026-07-31) states "There is
no shared `effectivePrice()` helper — this has already been reimplemented
three times... both of which got it wrong with `||`." Both claims are now
false: `lib/model-gallery.ts:41` is exactly that helper, and
`store-order-message.ts` / `model-preview.tsx` now call it correctly. `recall
verify` doesn't catch this because the anchors (`services/public.ts#priced`,
`services/sales.ts#floorCents`) still resolve — the underlying fact is stale,
not the anchor. Repair proposed below (needs approval — supersedes a live
node).

## What I checked
- `git --no-pager diff --stat` / `git --no-pager diff` for all tracked files
  in scope; direct `Read` for the four untracked new/changed files
  (`lib/model-gallery.ts`, `lib/store-order-message.ts`,
  `components/store/model-preview.tsx` are untracked — no git diff available
  for them, read in full instead).
- `db/migrations/0025_spooky_wolfsbane.sql` against
  `db/migrations/meta/0024_snapshot.json` / `0023_wet_the_liberteens.sql` to
  confirm the dropped index name (`reseller_link_client_uidx`) actually
  matches what an earlier migration created — it does.
- Full read of `services/clients.ts#getResellerLink`: the existing
  delete-then-insert rotate pattern (no transaction, theoretical race on
  concurrent rotate calls) predates this task — confirmed via `git diff`
  showing only the `showPrices` param added around the untouched delete/insert
  block. Not a new finding.
- Multi-tenant scoping: `getResellerLink`'s existing-link lookup doesn't
  re-filter by `organizationId`/`salonId`, but `clientId` is already verified
  against `ctx.organizationId`/`ctx.salonId` earlier in the same function and
  client ids are globally unique — no cross-tenant leak.
- All 4 `app/s/[token]/...` call sites individually: `layout.tsx`, `page.tsx`,
  `[itemId]/page.tsx` all correctly destructure `{store, showPrices}` (or just
  `{store}` where `showPrices` isn't needed) and every `hidePrices` prop is
  `!showPrices`, matching the server-side stripping already done in
  `publicStoreByResellerToken`.
- `components/store/store-browser.tsx` and `components/store/product-detail.tsx`
  `hidePrices` prop plumbing — consistent with the reseller call sites (not
  otherwise in scope, spot-checked only since it's the downstream consumer).
- `app/(app)/catalog/page.tsx`: `resellers` list is built from
  `listClients(ctx)`, which is salon-scoped — the UI feeding
  `ResellerLinkCopier` can't leak another salón's clients.
- `lib/model-gallery.ts#parsePreviewIndexes` try/catch and
  `effectivePrice()` — both match exactly what the prior audit asked for
  (findings #1 and #2 of `.recall/audits/2026-07-31T17-30-elige-tu-modelo-redesign.md`).
- `recall verify` (clean, see finding #2 caveat), `recall recurring --min 2`
  (`correctness` ×2, `duplication` ×2 — informed finding #1's severity),
  `recall query "reseller link prices catalog share"`, `.recall/INDEX.md`.

## What I deliberately did not check
- `components/store/product-detail.tsx`, `product-card.tsx`,
  `store-browser.tsx`, `whatsapp-link.tsx`, the two `/preview/[indexes]`
  routes, `model-selector.tsx` — already fully audited in
  `.recall/audits/2026-07-31T17-30-elige-tu-modelo-redesign.md`; only the two
  named follow-up fixes (findings #1, #2 there) were re-verified here, not the
  rest of that surface.
- Findings #3, #4, #5 of the prior audit (whatsapp-link segment-count guess,
  dropped stock-count text, throwaway `salonId=""`) — out of this task's
  stated scope (not touched by this diff); not re-raised here.
- Test coverage — project has no test framework/script, as already noted in
  the prior audit; not repeating that observation as a new finding.
