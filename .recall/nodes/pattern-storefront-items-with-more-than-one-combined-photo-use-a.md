---
id: pattern-storefront-items-with-more-than-one-combined-photo-use-a
type: pattern
scope: project
title: Storefront items with more than one combined photo use a multi-select 'elige tu modelo' picker, not a single-variant chooser — the customer picks several favorite photos and one WhatsApp message lists them all
triggers: ["modelo","elige tu modelo","model selector","multi-select","whatsapp order","variant picker"]
anchors: [{"path":"lib/model-gallery.ts","symbol":"buildModelGallery"},{"path":"components/store/model-selector.tsx","symbol":"ModelSelector"}]
asserted: 2026-07-31
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: audit
---
Replaces the old gallery+variant-picker duo (deleted: `product-gallery.tsx`,
`variant-picker.tsx`). `buildModelGallery(item)` (lib/model-gallery.ts) is the
single source of truth for the flat, numbered "Modelo #N" order — item photos
first, then every variant's, sold-out pushed last (`orderGallery`) — and both
`ModelSelector` (interactive, checkbox-style multi-select) and `ModelPreview`
(stateless, resolves the same numbering from a `/preview/:indexes` URL
segment) number off this exact array. Never build a second, differently-
ordered gallery array for the same item — "Modelo #4" must mean the same photo
everywhere it's shown (selector, preview link, WhatsApp text).

Items with 0-1 combined photos (most services) skip the selector entirely and
get a minimal single-cover fallback in `product-detail.tsx` — `hasSelector =
gallery.length > 1` is the gate.

There is still no cart: the WhatsApp message built by
`lib/store-order-message.ts#buildOrderMessage` (or the simpler inline one in
`model-preview.tsx` for the already-selected preview page) *is* the order. The
actual sale is entered later by staff at POS via `services/sales.ts`.
