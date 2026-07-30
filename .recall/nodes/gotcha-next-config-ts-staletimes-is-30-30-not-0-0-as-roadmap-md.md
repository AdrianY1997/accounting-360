---
id: gotcha-next-config-ts-staletimes-is-30-30-not-0-0-as-roadmap-md
type: gotcha
scope: project
title: next.config.ts staleTimes is 30/30 — cross-module navigation can show up to 30s stale Router Cache data
triggers: ["staleTimes","stale data","router cache","cache cliente","refetch"]
anchors: [{"path":"next.config.ts","symbol":"nextConfig"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`next.config.ts` sets `experimental.staleTimes: { dynamic: 30, static: 30 }` (changed from 0/0 by commit fea5753, "feat: platform org impersonation"). The comment above the config still says "a mutation in one module must be reflected when navigating to another (no manual reload)," but with staleTimes=30 a client-side navigation within 30s of a mutation elsewhere can serve a stale Router Cache entry. If a feature relies on "always fresh after mutation," verify this value first — it may drift again.
