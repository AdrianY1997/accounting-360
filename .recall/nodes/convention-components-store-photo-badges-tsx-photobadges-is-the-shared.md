---
id: convention-components-store-photo-badges-tsx-photobadges-is-the-shared
type: convention
scope: project
title: components/store/photo-badges.tsx (PhotoBadges) is the shared Agotado/Nuevo/aiKind overlay for any store photo tile — reuse it, don't reimplement
triggers: ["photo badge","swatch","thumbnail","aiKind","ai disclosure","product gallery","variant picker"]
anchors: [{"path":"components/store/photo-badges.tsx","symbol":"PhotoBadges"}]
asserted: 2026-07-31
invalidated: null
superseded_by: null
supersedes: ["gotcha-store-photo-thumbnail-swatch-markup-border-2-size-16-agotado","convention-every-store-facing-photo-tile-must-show-the-aikind"]
confidence: high
pin: false
source: cli
---
Fixed in commit after efc8338 (variant swatches): the three photo tiles in components/store (product-gallery.tsx main image + thumbnails, product-card.tsx cover, variant-picker.tsx swatches) previously reimplemented the sold-out ribbon, Nuevo badge and aiKind-disclosure tooltip independently and had already drifted (variant-picker's aiKind badge was missing entirely). Now all three render <PhotoBadges soldOut isNewPhoto aiKind size="sm"|"md" /> inside their own relative-positioned image container — the badge markup itself (including the aiKind Tooltip, which requires an ancestor TooltipProvider — present in both app/store/[salonId]/layout.tsx and app/s/[token]/layout.tsx) is centralized there.

Scope of the fix: only the OVERLAY BADGES were unified, not the whole photo-tile container. Each caller still owns its own container sizing/shape and empty-photo fallback (gallery thumbnail = size-16 rounded border; product-card cover = aspect-square/size-24; variant-picker swatch = w-20 box with size-16 image + first-letter-initial fallback when a variant has no photo) — those differ by real design intent (cover vs thumbnail vs swatch-with-fallback) and were judged not worth forcing into one component. product-card's grid-view Agotado/Nuevo badges intentionally still use the shadcn Badge UI primitive instead of PhotoBadges' plain spans (a deliberate, pre-existing, more idiomatic choice, not part of the duplication this fixed).

When adding a fourth photo tile anywhere in components/store: reuse PhotoBadges for the overlay badges from the start; only build a new container/fallback shape if the visual role genuinely differs from cover/thumbnail/swatch.
