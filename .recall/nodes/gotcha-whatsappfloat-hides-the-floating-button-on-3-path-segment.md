---
id: gotcha-whatsappfloat-hides-the-floating-button-on-3-path-segment
type: gotcha
scope: project
title: WhatsappFloat hides the floating button on 3-path-segment routes as a proxy for 'item detail page', not by matching the actual route
triggers: ["whatsapp float","floating button","usePathname","boton flotante"]
anchors: [{"path":"components/store/whatsapp-link.tsx","symbol":"WhatsappFloat"}]
asserted: 2026-07-31
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: audit
---
`WhatsappFloat` (mounted once in the store layout) hides itself so it doesn't
overlap the item-detail page's own fixed "Pedir por WhatsApp" bar. The check is
`pathname.split("/").filter(Boolean).length === 3`, which works only because
`/store/:salonId/:itemId` and `/s/:token/:itemId` are currently the only
3-segment paths under the store. It is not tied to those routes by name — any
new 3-segment route added later under `/store` or `/s` (a checkout step, an
FAQ page, etc.) will silently lose the float for a reason that no longer
applies to it. If you add such a route, either exclude it explicitly or switch
this to matching the two known item-detail patterns directly.
