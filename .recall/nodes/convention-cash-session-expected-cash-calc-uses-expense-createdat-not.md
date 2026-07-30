---
id: convention-cash-session-expected-cash-calc-uses-expense-createdat-not
type: convention
scope: project
title: Cash session expected-cash calc uses expense.createdAt (not expense.expenseDate) to bound the session window
triggers: ["caja","cash session","expected amount","gastos en efectivo","expenseDate vs createdAt"]
anchors: [{"path":"services/cash.ts","symbol":"cashExpensesCents"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`services/cash.ts` `cashExpensesCents()` filters cash-paid expenses by `expense.createdAt` between the session's `openedAt` and now/closedAt — deliberately NOT `expense.expenseDate` (a day-granular accounting date defaulting to midnight, which would fall outside an intraday session window and undercount cash leaving the drawer). Same pattern applies to `cashPaymentsCents()` using `payment.paidAt`. If you add anything else that should reduce/increase the caja's expected cash, bound it by the actual-event timestamp, not an accounting date field.
