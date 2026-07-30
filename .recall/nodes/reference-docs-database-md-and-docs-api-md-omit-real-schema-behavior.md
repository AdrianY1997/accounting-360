---
id: reference-docs-database-md-and-docs-api-md-omit-real-schema-behavior
type: reference
scope: project
title: client.type (direct/reseller) drives pricing and the priceless reseller share-link feature
triggers: ["client type","reseller","intermediario"]
anchors: [{"path":"db/schema/client.ts","symbol":"client"},{"path":"db/schema/access.ts","symbol":"memberPermission"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`client.type` (`direct`|`reseller`, default `direct`) exists and drives pricing (resellers buy at `reseller_price` and are exempt from the `min_price` floor in services/sales.ts createSale) and the priceless share-link feature (`reseller_link` table, `/s/:token` route). Also note the `member_permission` table (per-member custom permissions, see the access-control gotcha node).
