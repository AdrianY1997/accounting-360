---
id: reference-agents-md-s-accounting-domain-section-doesn-t-mention-the
type: reference
scope: project
title: AGENTS.md's Accounting Domain section doesn't mention the public storefront/e-commerce features that are now most of the catalog module
triggers: ["storefront","tienda","e-commerce","public store","catalog scope"]
anchors: [{"path":"services/public.ts","symbol":"publicStore"},{"path":"app/store/[salonId]"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
AGENTS.md's "Accounting Domain (target)" section lists only Clients, Service catalog (price+duration), Sales, Payments, Cash sessions, Expenses, Commissions, Categories, Reports — as if the catalog were still simple. The real, current catalog module is far larger: product variants with stock (service_variant), multi-image galleries with per-photo stock and AI-disclosure tagging (service_image, lib/ai-images.ts), price tiers (cost/suggested/reseller/min, lib/pricing.ts), store-type-driven custom attributes (lib/store-types.ts), a public unauthenticated storefront (/store/:salonId, /store/:salonId/:itemId), and priceless reseller share links (/s/:token, reseller_link table). None of this is reflected in AGENTS.md's domain list. Treat it as stale/incomplete for the catalog area — read services/catalog.ts, services/public.ts and db/schema/catalog.ts for the real shape.
