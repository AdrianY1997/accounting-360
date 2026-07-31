---
id: decision-facebook-multi-tenant-integration-page-posts-commerce
type: decision
scope: project
title: Facebook multi-tenant integration (Page posts + Commerce catalog sync) is designed but implementation is PAUSED — resume from the plan file
triggers: ["facebook","meta graph api","catalog sync","marketplace","oauth facebook"]
anchors: []
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: high
pin: true
source: cli
---
Full design reviewed and approved-in-substance by the user, but NOT started — user said 'déjalo en memoria como pendiente, luego retomo' (2026-07-30). Full plan lives at C:/Users/Adrian/.claude/plans/revisame-el-catalogo-store-fuzzy-phoenix.md — read it before resuming, do not re-derive from scratch.

Scope: each salón OAuth-connects its own Facebook Page from /settings; app auto-posts a Page feed post on new catalog items and keeps a Commerce Catalog synced (price/discount/stock/availability) via items_batch, feeding the Page's Shop tab. OUT of scope: Marketplace classified listings (no API), personal-profile chat automation (different ToS-incompatible ask from earlier in the same conversation).

Key verified decisions (already fact-checked against this codebase, don't re-verify): new facebookConnection table shaped like salonSettings (single salonId unique, NO organizationId — see db/schema/salon.ts precedent); reuse settings:manage permission (noted trade-off: it's currently inert config, this adds public-posting blast radius — flagged, not resolved either way); after() from next/server is stable in next@16.2.9, safe to use for fire-and-forget post-response sync; no edge runtime anywhere so Node crypto is safe; services/sales.ts updates stock via raw SQL bypassing services/catalog.ts entirely, so BOTH must be hooked for sync triggers or stock-driven availability changes get missed; services/public.ts publicStore()/PublicItem already has the exact shape needed for the catalog feed (price=effective/discounted, compareAtPrice=regular-when-discounted, sku, cover image, per-variant data) — reuse directly, no new queries.

Hard external blocker (not code): Meta Business Verification + App Review required before any non-tester salón can use it (1-7 business days per round, needs a public /privacy page which doesn't exist yet). Start that process on day 1 in parallel with code, not after — sequencing it last was flagged as the single biggest schedule risk.

Build order (from the plan file): env+crypto -> schema -> graph client (parallel-able) -> services/facebook.ts -> OAuth routes -> connection/sync routes+UI -> hooks into catalog.ts/sales.ts (parallel with prior step) -> cron+vercel.json. Hard blockers: schema before services/facebook.ts; services/facebook.ts before everything after it.
