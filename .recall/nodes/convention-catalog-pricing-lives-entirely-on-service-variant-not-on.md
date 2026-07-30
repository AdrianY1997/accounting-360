---
id: convention-catalog-pricing-lives-entirely-on-service-variant-not-on
type: convention
scope: project
title: Catalog pricing lives entirely on service_variant, not on service — service.price/cost_price/reseller_price/min_price are legacy/unused
triggers: ["pricing","precios","service_variant","variant price","catalog schema"]
anchors: [{"path":"db/schema/catalog.ts","symbol":"serviceVariant"},{"path":"services/catalog.ts"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
Every `service` (catalog item) has at least one `service_variant` ("Estándar" by default). Actual price/cost/reseller/min-price/discount live on `service_variant`, not on `service` — the columns of the same name on `service` are legacy/unused, confirmed in services/sales.ts (createSale reads variant.costPrice/minPrice/discountPrice, requires a variantId for any catalog item line). A sale item requires selecting a variant if the referenced service exists; walk-in free-text lines (no serviceId) skip this. Selling floor = min(min_price, active discount_price) and only applies to non-reseller buyers.
