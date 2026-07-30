---
id: gotcha-neon-http-driver-has-no-real-transactions-multi-statement
type: gotcha
scope: project
title: Neon HTTP driver has no real transactions: multi-statement writes use db.batch(), never db.transaction()
triggers: ["transaction","transaccion","db.batch","atomic","neon-http"]
anchors: [{"path":"db/index.ts","symbol":"db"},{"path":"services/sales.ts","symbol":"createSale"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`db/index.ts` uses `drizzle-orm/neon-http` (the HTTP driver, not a pooled/websocket connection), which does not support `db.transaction()`. Every place that needs multiple statements to succeed or fail together (createSale inserting sale+items+payment+stock decrements, voidSale restoring stock) uses `db.batch([...])` instead. If you add a new multi-step write, follow this pattern — do not introduce `db.transaction()`, it will not work with this driver.
