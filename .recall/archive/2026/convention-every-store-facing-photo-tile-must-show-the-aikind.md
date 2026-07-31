---
id: convention-every-store-facing-photo-tile-must-show-the-aikind
type: convention
scope: project
title: Every store-facing photo tile must show the aiKind disclosure badge/tooltip (aiKindDisclosures) when the image has one
triggers: ["aiKind","ai disclosure","imagen generada","IA badge","aiKindDisclosures","store photo"]
anchors: [{"path":"lib/ai-images.ts","symbol":"aiKindDisclosures"}]
asserted: 2026-07-31
invalidated: 2026-07-31
superseded_by: convention-components-store-photo-badges-tsx-photobadges-is-the-shared
confidence: medium
pin: false
source: audit
archived_at: 2026-07-31
archived_reason: superseded-by:convention-components-store-photo-badges-tsx-photobadges-is-the-shared
---
lib/ai-images.ts documents aiKindDisclosures as "shared by the admin uploader
and the public store badges/tooltips" — the intent is that any customer-facing
render of a catalog photo discloses when it's AI reference/generated.
product-gallery.tsx (main image + thumbnail strip) and product-card.tsx (cover)
both render aiKindDisclosures[img.aiKind] as a badge/tooltip. variant-picker.tsx
(added commit efc8338, photo swatches) does not — it reads only
v.images[0]?.url and drops aiKind, so an AI-generated variant photo shown as a
swatch carries no disclosure even though the same photo would show one in the
gallery.

When adding any new UI in components/store that renders a PublicVariantImage
or similar image record, thread the aiKind field through and render
aiKindDisclosures[aiKind] (see product-gallery.tsx's pattern) rather than only
the url.
