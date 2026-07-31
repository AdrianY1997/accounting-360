---
id: gotcha-store-photo-thumbnail-swatch-markup-border-2-size-16-agotado
type: gotcha
scope: project
title: Store photo thumbnail/swatch markup (border-2, size-16, Agotado ribbon, Nuevo badge) is copy-pasted across product-gallery.tsx, product-card.tsx and variant-picker.tsx instead of a shared component
triggers: ["swatch","thumbnail","variant picker","product gallery","duplicacion","duplicated markup"]
anchors: [{"path":"components/store/variant-picker.tsx","symbol":"VariantPicker"}]
asserted: 2026-07-31
invalidated: 2026-07-31
superseded_by: convention-components-store-photo-badges-tsx-photobadges-is-the-shared
confidence: medium
pin: false
source: audit
archived_at: 2026-07-31
archived_reason: superseded-by:convention-components-store-photo-badges-tsx-photobadges-is-the-shared
---
Three files in components/store render the near-identical "photo tile" pattern:
a size-16 rounded-md/lg box with an img (fallback initial letter), an
absolute "Agotado" ribbon when stock is 0, and a "Nuevo" badge via isNew().
See product-gallery.tsx (thumbnail strip), product-card.tsx (grid cover), and
variant-picker.tsx (swatches, added in commit efc8338). None of them share a
component — each reimplements the ribbon/badge classes slightly differently
(text sizes, positioning) so they've already drifted (e.g. variant-picker's
"Nuevo" badge is a corner ribbon, product-gallery's is a top-right rect).

Before adding a fourth photo tile anywhere in components/store, extract a
shared `PhotoTile`/`Swatch` component (image + soldOut + isNew + optional
aiKind badge) instead of copy-pasting again. This also fixes the aiKind
disclosure gap noted in the sibling convention node — a shared component
would carry that prop by construction instead of it being easy to forget.
