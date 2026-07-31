---
id: convention-components-store-photo-badges-tsx-photobadges-is-the-shared
type: convention
scope: project
title: components/store/photo-badges.tsx (PhotoBadges) is the shared Agotado/Nuevo/aiKind overlay for any store photo tile — reuse it, don't reimplement
triggers: ["photo badge","swatch","thumbnail","aiKind","ai disclosure","model selector","model preview"]
anchors: [{"path":"components/store/photo-badges.tsx","symbol":"PhotoBadges"}]
asserted: 2026-07-31
invalidated: 2026-07-31
superseded_by: convention-components-store-photo-badges-tsx-photobadges-is-the-shared
supersedes: ["convention-components-store-photo-badges-tsx-photobadges-is-the-shared"]
confidence: medium
pin: false
source: audit
archived_at: 2026-07-31
archived_reason: superseded-by:convention-components-store-photo-badges-tsx-photobadges-is-the-shared
---
Current call sites (as of the 2026-07-31 "elige tu modelo" redesign):
`product-card.tsx` (listing cover), `components/store/model-selector.tsx`
(the multi-select photo grid on the detail page), and
`components/store/model-preview.tsx` (the stateless `/preview/:indexes` page).
The earlier `product-gallery.tsx` and `variant-picker.tsx` call sites were
deleted when the single-variant gallery/swatch UI was replaced by the flat,
numbered model picker — `PhotoBadges` itself didn't change, only who renders it.

All three still render `<PhotoBadges soldOut isNewPhoto aiKind size="sm"|"md" />`
inside their own relative-positioned image container — only the overlay badges
(sold-out ribbon, Nuevo marker, aiKind tooltip) are centralized here, not the
container sizing/shape or empty-photo fallback, which still differs by tile
(cover vs. thumbnail-in-grid vs. preview tile) and is not worth forcing into one
component.

When adding a fourth photo tile anywhere in components/store: reuse
`PhotoBadges` for the overlay badges from the start; only build a new
container/fallback shape if the visual role genuinely differs from
cover/grid-tile/preview-tile.
