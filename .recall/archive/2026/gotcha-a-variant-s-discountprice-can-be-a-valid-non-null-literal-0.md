---
id: gotcha-a-variant-s-discountprice-can-be-a-valid-non-null-literal-0
type: gotcha
scope: project
title: A variant's discountPrice can be a valid, non-null literal '0' (means 'no discount', not 'free') — use effectivePrice(), never a truthy check
triggers: ["discountPrice","descuento","effective price","precio efectivo","sale floor","precio minimo","effectivePrice"]
anchors: [{"path":"lib/model-gallery.ts","symbol":"effectivePrice"}]
asserted: 2026-07-31
invalidated: 2026-07-31
superseded_by: gotcha-a-variant-s-discountprice-can-be-a-valid-non-null-literal-0
supersedes: ["gotcha-a-variant-s-discountprice-can-be-a-valid-non-null-literal-0"]
confidence: medium
pin: false
source: audit
archived_at: 2026-07-31
archived_reason: superseded-by:gotcha-a-variant-s-discountprice-can-be-a-valid-non-null-literal-0
---
`discountPrice` is zod-validated as `min(0)` (lib/validations/catalog.ts) and
the UI (`components/catalog/variant-manager.tsx:240`,
`discountPrice: e.target.value || null`) happily stores a literal `"0"`
instead of nulling it out when a staff member types `0` into the field. A
truthy check (`variant.discountPrice || variant.price`, or
`variant.discountPrice ? ... : ...`) therefore treats "no real discount" as
"free."

`lib/model-gallery.ts#effectivePrice(variant)` is the shared helper — call it
instead of reimplementing the rule. It parses to a number and gates on `> 0`:
`disc > 0 ? disc : regular`. Takes `Pick<PublicVariant, "price"|"discountPrice">`
so raw DB rows work too, not just the mapped `PublicVariant` shape. Used by
`lib/store-order-message.ts`, `components/store/model-preview.tsx`, and
`services/public.ts` (`publicStore`'s "lowest effective variant price" calc).

`services/sales.ts` (`floorCents`, sale-floor enforcement, ~line 239) does NOT
use this helper, on purpose: it compares `discountPrice` against `minPrice`
(the minimum allowed sale price), not against `price` (the list price) — a
different business rule (floor for a manual sale override vs. price to
display/charge), not a missed copy of the same one. Don't merge them.
