---
id: convention-all-money-math-runs-in-integer-cents-via-lib-money-ts-even
type: convention
scope: project
title: All money math runs in integer cents via lib/money.ts even though DB columns are numeric(12,2) strings
triggers: ["money","dinero","cents","centavos","numeric precision","float"]
anchors: [{"path":"lib/money.ts","symbol":"toCents"},{"path":"services/sales.ts","symbol":"createSale"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`lib/money.ts` exports `toCents(n) = Math.round(n*100)` and `centsToString(cents) = (cents/100).toFixed(2)`. Every service that does arithmetic on money (services/sales.ts, cash.ts, commissions.ts, payments.ts, expenses.ts) converts DB `numeric` string values to integer cents with `toCents(Number(x))` before adding/subtracting/multiplying, then converts back with `centsToString` before writing/returning. Never do arithmetic directly on the numeric strings or raw floats — the codebase's actual float-safety convention is "convert to cents, compute, convert back," not literally storing integer minor units in the DB (columns stay `numeric(12,2)`).
